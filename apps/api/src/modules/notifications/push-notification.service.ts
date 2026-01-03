import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import * as webPush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string; icon?: string }[];
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private isConfigured = false;

  constructor(private prisma: PrismaService) {
    this.initializeVapid();
  }

  private initializeVapid(): void {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@gelir-gider.app";

    if (publicKey && privateKey) {
      try {
        webPush.setVapidDetails(subject, publicKey, privateKey);
        this.isConfigured = true;
        this.logger.log("VAPID keys configured successfully");
      } catch (error) {
        this.logger.error("Failed to configure VAPID keys", error);
      }
    } else {
      this.logger.warn(
        "VAPID keys not configured. Push notifications will be disabled."
      );
    }
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint,
          },
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          keys: JSON.stringify(subscription.keys),
          isActive: true,
        },
        update: {
          keys: JSON.stringify(subscription.keys),
          isActive: true,
        },
      });

      this.logger.log(`User ${userId} subscribed to push notifications`);
      return { success: true, message: "Successfully subscribed to push notifications" };
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId}`, error);
      return { success: false, message: "Failed to subscribe to push notifications" };
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(
    userId: string,
    endpoint: string
  ): Promise<{ success: boolean }> {
    try {
      await this.prisma.pushSubscription.updateMany({
        where: { userId, endpoint },
        data: { isActive: false },
      });
      this.logger.log(`User ${userId} unsubscribed from push notifications`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to unsubscribe user ${userId}`, error);
      return { success: false };
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!this.isConfigured) {
      this.logger.debug("Push notifications not configured, skipping");
      return 0;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId, isActive: true },
    });

    let successCount = 0;

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys),
        };

        await webPush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );
        successCount++;
      } catch (error) {
        // Handle expired/invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await this.prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          });
          this.logger.log(`Deactivated expired subscription ${sub.id}`);
        } else {
          this.logger.error(
            `Failed to send push to subscription ${sub.id}`,
            error
          );
        }
      }
    }

    this.logger.log(
      `Sent push notification to ${successCount}/${subscriptions.length} subscriptions for user ${userId}`
    );
    return successCount;
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<number> {
    let totalSent = 0;
    for (const userId of userIds) {
      totalSent += await this.sendToUser(userId, payload);
    }
    return totalSent;
  }

  /**
   * Get VAPID public key for client
   */
  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  /**
   * Check if push notifications are configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }
}
