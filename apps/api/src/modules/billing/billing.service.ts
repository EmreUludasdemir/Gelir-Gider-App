import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StripeService } from './stripe.service';

export interface PlanFeatures {
  pdfUpload: boolean;
  bankConnection: boolean;
  aiInsights: boolean;
  exportCsv: boolean;
  exportPdf: boolean;
  household: boolean;
  prioritySupport: boolean;
  customCategories: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
}

export interface UserPlanInfo {
  planId: string;
  planName: string;
  displayName: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
  limits: {
    maxTransactions: number;
    maxBudgets: number;
    maxSavingsGoals: number;
    maxBankConnections: number;
    maxHouseholdMembers: number;
  };
  features: PlanFeatures;
  usage: {
    transactions: number;
    budgets: number;
    savingsGoals: number;
    bankConnections: number;
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  // ==================== Plans ====================

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlanById(planId: string) {
    return this.prisma.plan.findUnique({ where: { id: planId } });
  }

  async getPlanByName(name: string) {
    return this.prisma.plan.findUnique({ where: { name } });
  }

  // ==================== User Plan ====================

  async getUserPlan(userId: string): Promise<UserPlanInfo> {
    // Get or create user plan
    let userPlan = await this.prisma.userPlan.findUnique({
      where: { userId },
      include: { plan: true },
    });

    // If no plan, assign free plan
    if (!userPlan) {
      const freePlan = await this.prisma.plan.findUnique({ where: { name: 'free' } });
      if (!freePlan) {
        throw new Error('Free plan not found. Please seed the database.');
      }

      userPlan = await this.prisma.userPlan.create({
        data: {
          userId,
          planId: freePlan.id,
          status: 'active',
        },
        include: { plan: true },
      });
    }

    // Get usage stats
    const [transactions, budgets, savingsGoals, bankConnections] = await Promise.all([
      this.prisma.transaction.count({ where: { userId } }),
      this.prisma.budget.count({ where: { userId } }),
      this.prisma.savingsGoal.count({ where: { userId } }),
      this.prisma.bankConnection.count({ where: { userId, isActive: true } }),
    ]);

    // Parse features
    let features: PlanFeatures;
    try {
      const featureKeys = JSON.parse(userPlan.plan.features || '[]') as string[];
      features = {
        pdfUpload: featureKeys.includes('pdf_upload'),
        bankConnection: featureKeys.includes('bank_connection'),
        aiInsights: featureKeys.includes('ai_insights'),
        exportCsv: featureKeys.includes('export_csv'),
        exportPdf: featureKeys.includes('export_pdf'),
        household: featureKeys.includes('household'),
        prioritySupport: featureKeys.includes('priority_support'),
        customCategories: featureKeys.includes('custom_categories'),
        advancedReports: featureKeys.includes('advanced_reports'),
        apiAccess: featureKeys.includes('api_access'),
      };
    } catch {
      features = {
        pdfUpload: true,
        bankConnection: false,
        aiInsights: false,
        exportCsv: false,
        exportPdf: false,
        household: false,
        prioritySupport: false,
        customCategories: false,
        advancedReports: false,
        apiAccess: false,
      };
    }

    return {
      planId: userPlan.plan.id,
      planName: userPlan.plan.name,
      displayName: userPlan.plan.displayName,
      status: userPlan.status,
      billingCycle: userPlan.billingCycle,
      currentPeriodEnd: userPlan.currentPeriodEnd,
      cancelAt: userPlan.cancelAt,
      limits: {
        maxTransactions: userPlan.plan.maxTransactions,
        maxBudgets: userPlan.plan.maxBudgets,
        maxSavingsGoals: userPlan.plan.maxSavingsGoals,
        maxBankConnections: userPlan.plan.maxBankConnections,
        maxHouseholdMembers: userPlan.plan.maxHouseholdMembers,
      },
      features,
      usage: {
        transactions,
        budgets,
        savingsGoals,
        bankConnections,
      },
    };
  }

  // ==================== Checkout ====================

  async createCheckoutSession(
    userId: string,
    planName: string,
    billingCycle: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) throw new NotFoundException('Plan not found');

    if (plan.name === 'free') {
      throw new BadRequestException('Cannot checkout for free plan');
    }

    const priceId = billingCycle === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
    if (!priceId) {
      throw new BadRequestException('Stripe price not configured for this plan');
    }

    // Get or create Stripe customer
    let userPlan = await this.prisma.userPlan.findUnique({ where: { userId } });
    let customerId = userPlan?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.createCustomer(user.email, user.name || undefined, {
        userId: user.id,
      });
      if (!customer) {
        throw new BadRequestException('Failed to create Stripe customer');
      }
      customerId = customer.id;

      // Update or create user plan with customer ID
      if (userPlan) {
        await this.prisma.userPlan.update({
          where: { userId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    const session = await this.stripe.createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      {
        metadata: { userId, planName, billingCycle },
        trialDays: plan.name === 'pro' ? 14 : undefined, // 14-day trial for Pro
      },
    );

    if (!session) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return { sessionId: session.id, url: session.url };
  }

  // ==================== Customer Portal ====================

  async createPortalSession(userId: string, returnUrl: string) {
    const userPlan = await this.prisma.userPlan.findUnique({ where: { userId } });
    if (!userPlan?.stripeCustomerId) {
      throw new BadRequestException('No billing information found');
    }

    const session = await this.stripe.createPortalSession(userPlan.stripeCustomerId, returnUrl);
    if (!session) {
      throw new BadRequestException('Failed to create portal session');
    }

    return { url: session.url };
  }

  // ==================== Subscription Management ====================

  async cancelSubscription(userId: string) {
    const userPlan = await this.prisma.userPlan.findUnique({ where: { userId } });
    if (!userPlan?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription');
    }

    const subscription = await this.stripe.cancelSubscription(userPlan.stripeSubscriptionId, false);
    if (!subscription) {
      throw new BadRequestException('Failed to cancel subscription');
    }

    await this.prisma.userPlan.update({
      where: { userId },
      data: {
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      },
    });

    return { success: true, cancelAt: subscription.cancel_at };
  }

  async resumeSubscription(userId: string) {
    const userPlan = await this.prisma.userPlan.findUnique({ where: { userId } });
    if (!userPlan?.stripeSubscriptionId) {
      throw new BadRequestException('No subscription found');
    }

    const subscription = await this.stripe.resumeSubscription(userPlan.stripeSubscriptionId);
    if (!subscription) {
      throw new BadRequestException('Failed to resume subscription');
    }

    await this.prisma.userPlan.update({
      where: { userId },
      data: { cancelAt: null },
    });

    return { success: true };
  }

  // ==================== Webhook Handlers ====================

  async handleSubscriptionCreated(subscription: {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    trial_end?: number | null;
    metadata?: { userId?: string; planName?: string; billingCycle?: string };
    items: { data: { price: { id: string } }[] };
  }) {
    const metadata = subscription.metadata || {};
    const userId = metadata.userId;
    const planName = metadata.planName;
    const billingCycle = metadata.billingCycle || 'monthly';

    if (!userId) {
      this.logger.error('No userId in subscription metadata');
      return;
    }

    const plan = planName
      ? await this.prisma.plan.findUnique({ where: { name: planName } })
      : await this.findPlanByStripePriceId(subscription.items.data[0]?.price.id);

    if (!plan) {
      this.logger.error(`Plan not found for subscription ${subscription.id}`);
      return;
    }

    await this.prisma.userPlan.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        billingCycle,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
      update: {
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        billingCycle,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancelAt: null,
        cancelledAt: null,
      },
    });

    this.logger.log(`Subscription created/updated for user ${userId}: ${plan.name}`);
  }

  async handleSubscriptionUpdated(subscription: {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at?: number | null;
    canceled_at?: number | null;
    items: { data: { price: { id: string } }[] };
  }) {
    const userPlan = await this.prisma.userPlan.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!userPlan) {
      this.logger.warn(`UserPlan not found for subscription ${subscription.id}`);
      return;
    }

    const plan = await this.findPlanByStripePriceId(subscription.items.data[0]?.price.id);

    await this.prisma.userPlan.update({
      where: { id: userPlan.id },
      data: {
        planId: plan?.id || userPlan.planId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    });

    this.logger.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
  }

  async handleSubscriptionDeleted(subscription: { id: string }) {
    const userPlan = await this.prisma.userPlan.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!userPlan) return;

    // Downgrade to free plan
    const freePlan = await this.prisma.plan.findUnique({ where: { name: 'free' } });
    if (!freePlan) return;

    await this.prisma.userPlan.update({
      where: { id: userPlan.id },
      data: {
        planId: freePlan.id,
        stripeSubscriptionId: null,
        status: 'active',
        cancelAt: null,
        cancelledAt: new Date(),
      },
    });

    this.logger.log(`Subscription deleted, user downgraded to free: ${userPlan.userId}`);
  }

  async handlePaymentSucceeded(invoice: {
    id: string;
    customer: string;
    subscription?: string;
    amount_paid: number;
    currency: string;
    hosted_invoice_url?: string;
    invoice_pdf?: string;
  }) {
    const userPlan = await this.prisma.userPlan.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!userPlan) return;

    await this.prisma.paymentHistory.create({
      data: {
        userId: userPlan.userId,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'succeeded',
        planName: userPlan.planId,
        invoiceUrl: invoice.hosted_invoice_url,
        receiptUrl: invoice.invoice_pdf,
        paidAt: new Date(),
      },
    });

    this.logger.log(`Payment succeeded for user ${userPlan.userId}: ${invoice.amount_paid / 100} ${invoice.currency}`);
  }

  async handlePaymentFailed(invoice: {
    id: string;
    customer: string;
    amount_due: number;
    currency: string;
  }) {
    const userPlan = await this.prisma.userPlan.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!userPlan) return;

    await this.prisma.userPlan.update({
      where: { id: userPlan.id },
      data: { status: 'past_due' },
    });

    await this.prisma.paymentHistory.create({
      data: {
        userId: userPlan.userId,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        planName: userPlan.planId,
      },
    });

    this.logger.log(`Payment failed for user ${userPlan.userId}`);
  }

  // ==================== Helpers ====================

  private async findPlanByStripePriceId(priceId: string) {
    if (!priceId) return null;

    return this.prisma.plan.findFirst({
      where: {
        OR: [
          { stripePriceIdMonthly: priceId },
          { stripePriceIdYearly: priceId },
        ],
      },
    });
  }

  // ==================== Limit Checks ====================

  async checkTransactionLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const planInfo = await this.getUserPlan(userId);
    const { maxTransactions } = planInfo.limits;

    if (maxTransactions === -1) {
      return { allowed: true, remaining: -1 };
    }

    const remaining = maxTransactions - planInfo.usage.transactions;
    return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
  }

  async checkFeatureAccess(userId: string, feature: keyof PlanFeatures): Promise<boolean> {
    const planInfo = await this.getUserPlan(userId);
    return planInfo.features[feature] ?? false;
  }

  // ==================== Payment History ====================

  async getPaymentHistory(userId: string, limit = 10) {
    return this.prisma.paymentHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
