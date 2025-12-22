import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export interface SmartNotification {
  id: string;
  type:
    | "anomaly"
    | "reminder"
    | "achievement"
    | "tip"
    | "warning"
    | "celebration";
  title: string;
  message: string;
  icon: string;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  actionUrl?: string;
}

@Injectable()
export class SmartNotificationService {
  constructor(private prisma: PrismaService) {}

  // Check for spending anomalies
  async detectAnomalies(userId: string): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];

    // Get today's spending
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySpending = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: "expense",
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });

    // Get average daily spending for past 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const pastSpending = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: "expense",
        createdAt: { gte: thirtyDaysAgo, lt: today },
      },
      _sum: { amount: true },
    });

    const avgDaily = (pastSpending._sum.amount || 0) / 30;
    const todayAmount = todaySpending._sum.amount || 0;

    // Anomaly: spending 50% more than average
    if (todayAmount > avgDaily * 1.5 && todayAmount > 100) {
      const percentOver = Math.round(
        ((todayAmount - avgDaily) / avgDaily) * 100
      );
      notifications.push({
        id: `anomaly_${Date.now()}`,
        type: "anomaly",
        title: "Yüksek Harcama Tespit Edildi",
        message: `Bugün ortalamanın %${percentOver} üzerinde harcama yaptınız (₺${todayAmount.toFixed(
          0
        )})`,
        icon: "⚠️",
        priority: "high",
        createdAt: new Date(),
        actionUrl: "/transactions",
      });
    }

    // Check for large single transactions
    const largeTx = await this.prisma.transaction.findFirst({
      where: {
        userId,
        type: "expense",
        createdAt: { gte: today },
        amount: { gte: avgDaily * 2 },
      },
      orderBy: { amount: "desc" },
    });

    if (largeTx) {
      notifications.push({
        id: `large_tx_${largeTx.id}`,
        type: "warning",
        title: "Büyük Harcama",
        message: `₺${largeTx.amount} tutarında harcama: "${largeTx.description}"`,
        icon: "💸",
        priority: "medium",
        createdAt: new Date(),
        actionUrl: `/transactions/${largeTx.id}`,
      });
    }

    return notifications;
  }

  // Generate tips based on spending patterns
  async generateTips(userId: string): Promise<SmartNotification[]> {
    const tips: SmartNotification[] = [];

    // Get category spending for this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const categorySpending = await this.prisma.transaction.groupBy({
      by: ["categoryLabel"],
      where: {
        userId,
        type: "expense",
        createdAt: { gte: thisMonth },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    // Tip for top spending category
    if (categorySpending.length > 0) {
      const top = categorySpending[0];
      const amount = top._sum.amount || 0;

      tips.push({
        id: `tip_category_${Date.now()}`,
        type: "tip",
        title: "Harcama İpucu",
        message: `En çok ${
          top.categoryLabel
        } kategorisine harcıyorsunuz (₺${amount.toFixed(
          0
        )}). Bu alanda tasarruf yapabilir misiniz?`,
        icon: "💡",
        priority: "low",
        createdAt: new Date(),
      });
    }

    return tips;
  }

  // Check for upcoming bills and reminders
  async getUpcomingReminders(userId: string): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Check savings goals near completion
    const goals = await this.prisma.savingsGoal.findMany({
      where: {
        userId,
        deadline: { lte: nextWeek },
      },
    });

    for (const goal of goals) {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;

      if (progress < 100) {
        const remaining = goal.targetAmount - goal.currentAmount;
        notifications.push({
          id: `goal_reminder_${goal.id}`,
          type: "reminder",
          title: "Hedef Yaklaşıyor",
          message: `"${
            goal.name
          }" hedefinin süresi dolmak üzere. ₺${remaining.toFixed(
            0
          )} daha eklemeniz gerekiyor.`,
          icon: "🎯",
          priority: "high",
          createdAt: new Date(),
          actionUrl: "/goals",
        });
      }
    }

    return notifications;
  }

  // Get all notifications for user
  async getAllNotifications(userId: string): Promise<SmartNotification[]> {
    const [anomalies, tips, reminders] = await Promise.all([
      this.detectAnomalies(userId),
      this.generateTips(userId),
      this.getUpcomingReminders(userId),
    ]);

    const all = [...anomalies, ...tips, ...reminders];

    // Sort by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return all.sort((a, b) => {
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // Generate celebration notifications
  async checkCelebrations(userId: string): Promise<SmartNotification[]> {
    const celebrations: SmartNotification[] = [];

    // Check if user completed a goal today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check savings milestones
    const totalSaved = await this.prisma.savingsGoal.aggregate({
      where: { userId },
      _sum: { currentAmount: true },
    });

    const saved = totalSaved._sum.currentAmount || 0;
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000];

    for (const milestone of milestones) {
      if (saved >= milestone && saved < milestone * 1.1) {
        celebrations.push({
          id: `celebration_${milestone}`,
          type: "celebration",
          title: "🎉 Tebrikler!",
          message: `₺${milestone.toLocaleString(
            "tr-TR"
          )} tasarruf hedefine ulaştınız!`,
          icon: "🏆",
          priority: "medium",
          createdAt: new Date(),
        });
        break;
      }
    }

    return celebrations;
  }
}
