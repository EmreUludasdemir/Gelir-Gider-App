import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma.service";
import { EmailService, WeeklyReportData } from "./email.service";
import { PushNotificationService, PushPayload } from "./push-notification.service";
import { SmartNotificationService, SmartNotification } from "./smart-notification.service";

interface UserWithPreferences {
  id: string;
  email: string;
  name: string | null;
}

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pushService: PushNotificationService,
    private smartNotificationService: SmartNotificationService
  ) {}

  onModuleInit() {
    this.logger.log("Notification Scheduler initialized");
  }

  /**
   * Get users with specific notification preference enabled
   */
  private async getUsersWithPreference(
    preference: "weeklyDigest" | "monthlyDigest" | "billReminders" | "budgetAlerts"
  ): Promise<UserWithPreferences[]> {
    // Get all users - in production, filter by preferences stored in database
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Filter users based on their preferences
    const usersWithPrefs: UserWithPreferences[] = [];
    for (const user of users) {
      const prefs = await this.smartNotificationService.getPreferences(user.id);
      if (prefs[preference]) {
        usersWithPrefs.push(user);
      }
    }

    return usersWithPrefs;
  }

  /**
   * Convert smart notification to push payload
   */
  private notificationToPush(notification: SmartNotification): PushPayload {
    return {
      title: notification.title,
      body: notification.message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: notification.id,
      data: {
        url: notification.actionUrl || "/dashboard",
        ...notification.data,
      },
    };
  }

  /**
   * Weekly digest - Every Sunday at 9 AM
   */
  @Cron("0 9 * * 0")
  async sendWeeklyDigests(): Promise<void> {
    this.logger.log("Starting weekly digest job");
    const startTime = Date.now();

    try {
      const users = await this.getUsersWithPreference("weeklyDigest");
      this.logger.log(`Processing weekly digest for ${users.length} users`);

      let emailsSent = 0;
      let pushSent = 0;

      for (const user of users) {
        try {
          // Generate digest data
          const digest = await this.smartNotificationService.generateWeeklyDigest(user.id);
          const digestData = digest.data as {
            income: number;
            expense: number;
            balance: number;
            topCategories: [string, number][];
          };

          // Prepare email data
          const emailData: WeeklyReportData = {
            userName: user.name || user.email.split("@")[0],
            totalIncome: digestData.income || 0,
            totalExpense: digestData.expense || 0,
            balance: digestData.balance || 0,
            topCategories: (digestData.topCategories || []).map(([name, amount]) => ({
              name,
              amount,
            })),
            budgetAlerts: [], // Would be populated from budget data
            savingsProgress: 0, // Would be calculated from savings goals
          };

          // Send email
          const emailSent = await this.emailService.sendWeeklyReport(user.email, emailData);
          if (emailSent) emailsSent++;

          // Send push notification
          const pushPayload = this.notificationToPush(digest);
          const sent = await this.pushService.sendToUser(user.id, pushPayload);
          pushSent += sent;

        } catch (error) {
          this.logger.error(`Failed to send weekly digest to ${user.email}`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Weekly digest completed: ${emailsSent} emails, ${pushSent} push notifications sent in ${duration}ms`
      );
    } catch (error) {
      this.logger.error("Weekly digest job failed", error);
    }
  }

  /**
   * Monthly digest - 1st of every month at 10 AM
   */
  @Cron("0 10 1 * *")
  async sendMonthlyDigests(): Promise<void> {
    this.logger.log("Starting monthly digest job");
    const startTime = Date.now();

    try {
      const users = await this.getUsersWithPreference("monthlyDigest");
      this.logger.log(`Processing monthly digest for ${users.length} users`);

      let pushSent = 0;

      for (const user of users) {
        try {
          const digest = await this.smartNotificationService.generateMonthlyDigest(user.id);

          // Send push notification
          const pushPayload = this.notificationToPush(digest);
          const sent = await this.pushService.sendToUser(user.id, pushPayload);
          pushSent += sent;

          // For monthly digest, you could send a more detailed email report
          // This could be implemented with a separate email template
          this.logger.log(`Monthly digest sent to ${user.email}`);
        } catch (error) {
          this.logger.error(`Failed to send monthly digest to ${user.email}`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Monthly digest completed: ${pushSent} push notifications sent in ${duration}ms`
      );
    } catch (error) {
      this.logger.error("Monthly digest job failed", error);
    }
  }

  /**
   * Daily bill reminders - Every day at 8 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyBillReminders(): Promise<void> {
    this.logger.log("Starting daily bill reminder job");
    const startTime = Date.now();

    try {
      const users = await this.getUsersWithPreference("billReminders");
      let pushSent = 0;
      let emailsSent = 0;

      for (const user of users) {
        try {
          const billReminders = await this.smartNotificationService.getBillReminders(user.id);

          // Filter urgent/high priority bills for immediate notification
          const urgentBills = billReminders.filter(
            (b) => b.priority === "urgent" || b.priority === "high"
          );

          for (const bill of urgentBills) {
            // Send push notification
            const pushPayload = this.notificationToPush(bill);
            const sent = await this.pushService.sendToUser(user.id, pushPayload);
            pushSent += sent;
          }

          // Send email summary if there are any bills due soon
          if (billReminders.length > 0) {
            const html = this.generateBillReminderEmail(
              user.name || user.email.split("@")[0],
              billReminders
            );

            const sent = await this.emailService.sendEmail({
              to: user.email,
              subject: `📅 ${billReminders.length} Fatura Hatırlatıcısı`,
              html,
            });
            if (sent) emailsSent++;
          }
        } catch (error) {
          this.logger.error(`Failed to send bill reminders to ${user.email}`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Bill reminders completed: ${emailsSent} emails, ${pushSent} push notifications in ${duration}ms`
      );
    } catch (error) {
      this.logger.error("Bill reminder job failed", error);
    }
  }

  /**
   * Budget alerts - Twice daily at 12 PM and 6 PM
   */
  @Cron("0 12,18 * * *")
  async checkBudgetAlerts(): Promise<void> {
    this.logger.log("Starting budget alert check");
    const startTime = Date.now();

    try {
      const users = await this.getUsersWithPreference("budgetAlerts");
      let pushSent = 0;
      let emailsSent = 0;

      for (const user of users) {
        try {
          const budgetAlerts = await this.smartNotificationService.getBudgetAlerts(user.id);

          // Only send notifications for exceeded or near-limit budgets
          const criticalAlerts = budgetAlerts.filter(
            (a) => a.priority === "urgent" || a.priority === "high"
          );

          for (const alert of criticalAlerts) {
            // Send push notification
            const pushPayload = this.notificationToPush(alert);
            const sent = await this.pushService.sendToUser(user.id, pushPayload);
            pushSent += sent;

            // Send email for exceeded budgets
            if (alert.priority === "urgent") {
              const data = alert.data as { spent: number; limit: number };
              await this.emailService.sendBudgetAlert(
                user.email,
                alert.title,
                Math.round((data.spent / data.limit) * 100)
              );
              emailsSent++;
            }
          }
        } catch (error) {
          this.logger.error(`Failed to check budget alerts for ${user.email}`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Budget alerts completed: ${emailsSent} emails, ${pushSent} push notifications in ${duration}ms`
      );
    } catch (error) {
      this.logger.error("Budget alert job failed", error);
    }
  }

  /**
   * Anomaly detection - Every 4 hours
   */
  @Cron("0 */4 * * *")
  async checkSpendingAnomalies(): Promise<void> {
    this.logger.log("Starting spending anomaly check");
    const startTime = Date.now();

    try {
      const users = await this.prisma.user.findMany({
        select: { id: true, email: true, name: true },
      });

      let pushSent = 0;

      for (const user of users) {
        try {
          const prefs = await this.smartNotificationService.getPreferences(user.id);
          if (!prefs.unusualSpendingAlerts) continue;

          const anomalies = await this.smartNotificationService.detectAnomalies(user.id);

          for (const anomaly of anomalies) {
            const pushPayload = this.notificationToPush(anomaly);
            const sent = await this.pushService.sendToUser(user.id, pushPayload);
            pushSent += sent;
          }
        } catch (error) {
          this.logger.error(`Failed to check anomalies for ${user.email}`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Anomaly check completed: ${pushSent} push notifications in ${duration}ms`
      );
    } catch (error) {
      this.logger.error("Anomaly check job failed", error);
    }
  }

  /**
   * Generate bill reminder email HTML
   */
  private generateBillReminderEmail(
    userName: string,
    bills: SmartNotification[]
  ): string {
    const billRows = bills
      .map((bill) => {
        const priorityColors = {
          urgent: "#EF4444",
          high: "#F59E0B",
          medium: "#3B82F6",
          low: "#6B7280",
        };
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
              <span style="color: ${priorityColors[bill.priority]}; font-size: 18px;">${bill.icon}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">${bill.message}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .header { color: #1a1a1a; font-size: 22px; font-weight: bold; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
          .btn { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px;
                 border-radius: 6px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">📅 Fatura Hatırlatıcıları</div>
          <p>Merhaba ${userName},</p>
          <p>Yaklaşan faturalarınız için hatırlatma:</p>

          <table>
            ${billRows}
          </table>

          <p style="text-align: center;">
            <a href="${process.env.APP_URL || "http://localhost:3000"}/bills" class="btn">
              Faturaları Görüntüle
            </a>
          </p>

          <div class="footer">
            Gelir-Gider Takip Uygulaması<br>
            Bu bildirimi almak istemiyorsanız, ayarlardan kapatabilirsiniz.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Manually trigger a notification check for a user (for testing)
   */
  async triggerAllChecks(userId: string): Promise<{
    anomalies: number;
    bills: number;
    budgets: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let anomalies = 0;
    let bills = 0;
    let budgets = 0;

    // Check anomalies
    const anomalyNotifs = await this.smartNotificationService.detectAnomalies(userId);
    for (const notif of anomalyNotifs) {
      const sent = await this.pushService.sendToUser(userId, this.notificationToPush(notif));
      anomalies += sent;
    }

    // Check bills
    const billNotifs = await this.smartNotificationService.getBillReminders(userId);
    for (const notif of billNotifs) {
      const sent = await this.pushService.sendToUser(userId, this.notificationToPush(notif));
      bills += sent;
    }

    // Check budgets
    const budgetNotifs = await this.smartNotificationService.getBudgetAlerts(userId);
    for (const notif of budgetNotifs) {
      const sent = await this.pushService.sendToUser(userId, this.notificationToPush(notif));
      budgets += sent;
    }

    return { anomalies, bills, budgets };
  }
}
