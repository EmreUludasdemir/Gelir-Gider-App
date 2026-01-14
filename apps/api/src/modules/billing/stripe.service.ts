import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;

  onModuleInit() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
      });
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Payment features disabled.');
    }
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  // ==================== Customers ====================

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Stripe.Customer | null> {
    if (!this.stripe) return null;

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
      this.logger.log(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    if (!this.stripe) return null;

    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) return null;
      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Failed to get customer: ${error.message}`);
      return null;
    }
  }

  async updateCustomer(customerId: string, data: Stripe.CustomerUpdateParams): Promise<Stripe.Customer | null> {
    if (!this.stripe) return null;

    try {
      return await this.stripe.customers.update(customerId, data);
    } catch (error) {
      this.logger.error(`Failed to update customer: ${error.message}`);
      throw error;
    }
  }

  // ==================== Subscriptions ====================

  async createSubscription(
    customerId: string,
    priceId: string,
    options?: {
      trialDays?: number;
      metadata?: Record<string, string>;
    }
  ): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: options?.metadata,
      };

      if (options?.trialDays) {
        subscriptionData.trial_period_days = options.trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      this.logger.log(`Created subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    try {
      if (immediately) {
        return await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw error;
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      this.logger.error(`Failed to resume subscription: ${error.message}`);
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`);
      throw error;
    }
  }

  // ==================== Checkout Sessions ====================

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    options?: {
      trialDays?: number;
      metadata?: Record<string, string>;
    }
  ): Promise<Stripe.Checkout.Session | null> {
    if (!this.stripe) return null;

    try {
      const sessionData: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: options?.metadata,
        allow_promotion_codes: true,
      };

      if (options?.trialDays) {
        sessionData.subscription_data = {
          trial_period_days: options.trialDays,
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);
      this.logger.log(`Created checkout session: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw error;
    }
  }

  // ==================== Customer Portal ====================

  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session | null> {
    if (!this.stripe) return null;

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      this.logger.error(`Failed to create portal session: ${error.message}`);
      throw error;
    }
  }

  // ==================== Webhooks ====================

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event | null {
    if (!this.stripe) return null;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return null;
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      return null;
    }
  }

  // ==================== Invoices ====================

  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    if (!this.stripe) return null;

    try {
      return await this.stripe.invoices.createPreview({ customer: customerId });
    } catch (error) {
      this.logger.error(`Failed to get upcoming invoice: ${error.message}`);
      return null;
    }
  }

  async listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    if (!this.stripe) return [];

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
      return invoices.data;
    } catch (error) {
      this.logger.error(`Failed to list invoices: ${error.message}`);
      return [];
    }
  }

  // ==================== Payment Methods ====================

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    if (!this.stripe) return [];

    try {
      const methods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return methods.data;
    } catch (error) {
      this.logger.error(`Failed to list payment methods: ${error.message}`);
      return [];
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
    if (!this.stripe) return false;

    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error) {
      this.logger.error(`Failed to detach payment method: ${error.message}`);
      return false;
    }
  }
}
