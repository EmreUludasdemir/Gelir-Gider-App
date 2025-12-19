import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import * as webpush from "web-push";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string }>;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidConfigured = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@gelir-gider.app";

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log("✅ Web Push VAPID configured");
    } else {
      this.logger.warn(
        "⚠️ VAPID keys not configured. Push notifications disabled."
      );
    }
  }

  /**
   * Save push subscription for a user
   */
  async subscribe(
    userId: string,
    subscription: PushSubscription
  ): Promise<{ success: boolean }> {
    await this.prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        keys: JSON.stringify(subscription.keys),
        isActive: true,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        keys: JSON.stringify(subscription.keys),
        isActive: true,
      },
    });

    this.logger.log(`User ${userId} subscribed to push notifications`);
    return { success: true };
  }

  /**
   * Remove push subscription
   */
  async unsubscribe(
    userId: string,
    endpoint: string
  ): Promise<{ success: boolean }> {
    await this.prisma.pushSubscription.updateMany({
      where: { userId, endpoint },
      data: { isActive: false },
    });

    return { success: true };
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<number> {
    if (!this.vapidConfigured) {
      this.logger.warn("Push notifications disabled - VAPID not configured");
      return 0;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId, isActive: true },
    });

    let sent = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys),
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );
        sent++;
      } catch (error: any) {
        this.logger.error(
          `Failed to send push to ${sub.endpoint}: ${error.message}`
        );

        // Mark invalid subscriptions as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          failedEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up invalid subscriptions
    if (failedEndpoints.length > 0) {
      await this.prisma.pushSubscription.updateMany({
        where: {
          userId,
          endpoint: { in: failedEndpoints },
        },
        data: { isActive: false },
      });
    }

    return sent;
  }

  /**
   * Send budget alert notification
   */
  async sendBudgetAlert(
    userId: string,
    budgetName: string,
    spent: number,
    limit: number,
    percentage: number
  ): Promise<void> {
    const isExceeded = percentage >= 100;

    const payload: NotificationPayload = {
      title: isExceeded ? "🚨 Bütçe Aşıldı!" : "⚠️ Bütçe Uyarısı",
      body: isExceeded
        ? `${budgetName} bütçenizi aştınız! (${spent.toLocaleString(
            "tr-TR"
          )} / ${limit.toLocaleString("tr-TR")} TRY)`
        : `${budgetName} bütçenizin %${percentage.toFixed(0)}'ine ulaştınız.`,
      icon: "/icons/budget-alert.png",
      badge: "/icons/badge.png",
      tag: `budget-${budgetName}`,
      data: {
        type: "budget_alert",
        budgetName,
        spent,
        limit,
        percentage,
      },
      actions: [
        { action: "view", title: "Bütçeleri Gör" },
        { action: "dismiss", title: "Kapat" },
      ],
    };

    await this.sendToUser(userId, payload);
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminder(
    userId: string,
    description: string,
    amount: number,
    dueDate: Date
  ): Promise<void> {
    const daysUntil = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const payload: NotificationPayload = {
      title: "📅 Ödeme Hatırlatması",
      body: `${description}: ${amount.toLocaleString(
        "tr-TR"
      )} TRY - ${daysUntil} gün sonra`,
      icon: "/icons/payment-reminder.png",
      badge: "/icons/badge.png",
      tag: `reminder-${description}`,
      data: {
        type: "payment_reminder",
        description,
        amount,
        dueDate: dueDate.toISOString(),
      },
    };

    await this.sendToUser(userId, payload);
  }

  /**
   * Send weekly summary notification
   */
  async sendWeeklySummary(
    userId: string,
    income: number,
    expense: number,
    topCategory: string
  ): Promise<void> {
    const balance = income - expense;
    const emoji = balance >= 0 ? "📈" : "📉";

    const payload: NotificationPayload = {
      title: `${emoji} Haftalık Özet`,
      body: `Gelir: ${income.toLocaleString(
        "tr-TR"
      )} TRY | Gider: ${expense.toLocaleString(
        "tr-TR"
      )} TRY | En çok: ${topCategory}`,
      icon: "/icons/summary.png",
      badge: "/icons/badge.png",
      tag: "weekly-summary",
      data: {
        type: "weekly_summary",
        income,
        expense,
        balance,
        topCategory,
      },
    };

    await this.sendToUser(userId, payload);
  }
}
