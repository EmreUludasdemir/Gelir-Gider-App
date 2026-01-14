import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  RawBodyRequest,
  Req,
  Headers,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

@Controller('billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private stripeService: StripeService,
  ) {}

  /**
   * Get all available plans
   */
  @Get('plans')
  async getPlans() {
    const plans = await this.billingService.getPlans();
    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        limits: {
          maxTransactions: plan.maxTransactions,
          maxBudgets: plan.maxBudgets,
          maxSavingsGoals: plan.maxSavingsGoals,
          maxBankConnections: plan.maxBankConnections,
          maxHouseholdMembers: plan.maxHouseholdMembers,
        },
        features: JSON.parse(plan.features || '[]'),
      })),
    };
  }

  /**
   * Get current user's plan and usage
   */
  @Get('my-plan')
  @UseGuards(JwtAuthGuard)
  async getMyPlan(@User('id') userId: string) {
    return this.billingService.getUserPlan(userId);
  }

  /**
   * Create checkout session for upgrading plan
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @User('id') userId: string,
    @Body() body: { planName: string; billingCycle: 'monthly' | 'yearly' },
  ) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/dashboard/settings?billing=success`;
    const cancelUrl = `${appUrl}/dashboard/settings?billing=cancelled`;

    return this.billingService.createCheckoutSession(
      userId,
      body.planName,
      body.billingCycle,
      successUrl,
      cancelUrl,
    );
  }

  /**
   * Create customer portal session for managing billing
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(@User('id') userId: string) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/dashboard/settings`;

    return this.billingService.createPortalSession(userId, returnUrl);
  }

  /**
   * Cancel subscription (at period end)
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@User('id') userId: string) {
    return this.billingService.cancelSubscription(userId);
  }

  /**
   * Resume cancelled subscription
   */
  @Post('resume')
  @UseGuards(JwtAuthGuard)
  async resumeSubscription(@User('id') userId: string) {
    return this.billingService.resumeSubscription(userId);
  }

  /**
   * Get payment history
   */
  @Get('payments')
  @UseGuards(JwtAuthGuard)
  async getPayments(@User('id') userId: string) {
    const payments = await this.billingService.getPaymentHistory(userId);
    return { payments };
  }

  /**
   * Check feature access
   */
  @Get('check-feature')
  @UseGuards(JwtAuthGuard)
  async checkFeature(
    @User('id') userId: string,
    @Body() body: { feature: string },
  ) {
    const hasAccess = await this.billingService.checkFeatureAccess(
      userId,
      body.feature as keyof import('./billing.service').PlanFeatures,
    );
    return { hasAccess };
  }

  /**
   * Stripe webhook handler
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    if (!event) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.billingService.handleSubscriptionCreated(
          event.data.object as any,
        );
        break;

      case 'customer.subscription.deleted':
        await this.billingService.handleSubscriptionDeleted(
          event.data.object as any,
        );
        break;

      case 'invoice.payment_succeeded':
        await this.billingService.handlePaymentSucceeded(
          event.data.object as any,
        );
        break;

      case 'invoice.payment_failed':
        await this.billingService.handlePaymentFailed(
          event.data.object as any,
        );
        break;

      default:
        // Unhandled event type
        break;
    }

    return { received: true };
  }
}
