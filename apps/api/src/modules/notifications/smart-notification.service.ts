import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export interface SmartNotification {
  id: string;
  type:
    | "anomaly"
    | "reminder"
    | "achievement"
    | "tip"
    | "warning"
    | "celebration"
    | "bill"
    | "budget"
    | "digest";
  title: string;
  message: string;
  icon: string;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  userId: string;
  unusualSpendingAlerts: boolean;
  billReminders: boolean;
  budgetAlerts: boolean;
  weeklyDigest: boolean;
  monthlyDigest: boolean;
  email?: string;
}

@Injectable()
export class SmartNotificationService {
  private readonly logger = new Logger(SmartNotificationService.name);
  private preferences: Map<string, NotificationPreferences> = new Map();

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

  // Check upcoming bills and send reminders
  async getBillReminders(userId: string): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get upcoming bills
    const bills = await this.prisma.bill.findMany({
      where: {
        userId,
        dueDate: {
          gte: now,
          lte: sevenDaysLater,
        },
        isPaid: false,
      },
      orderBy: { dueDate: "asc" },
    });

    for (const bill of bills) {
      const dueDate = new Date(bill.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      let priority: "low" | "medium" | "high" | "urgent" = "low";
      if (daysUntilDue <= 1) priority = "urgent";
      else if (daysUntilDue <= 3) priority = "high";
      else if (daysUntilDue <= 5) priority = "medium";

      notifications.push({
        id: `bill_${bill.id}`,
        type: "bill",
        title: "Fatura Hatırlatıcısı",
        message: `"${bill.name}" faturası ${daysUntilDue} gün içinde (${dueDate.toLocaleDateString("tr-TR")}) ödenecek. Tutar: ₺${bill.amount.toFixed(2)}`,
        icon: daysUntilDue <= 1 ? "🚨" : "📅",
        priority,
        createdAt: new Date(),
        actionUrl: "/bills",
        data: { billId: bill.id, amount: bill.amount, dueDate },
      });
    }

    return notifications;
  }

  // Check budget alerts
  async getBudgetAlerts(userId: string): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all budgets for user
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
    });

    for (const budget of budgets) {
      // Calculate spending for this category
      const spending = await this.prisma.transaction.aggregate({
        where: {
          userId,
          type: "expense",
          categoryId: budget.categoryId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      });

      const spent = Math.abs(spending._sum.amount || 0);
      const percentUsed = (spent / budget.limitAmount) * 100;

      if (percentUsed >= 100) {
        notifications.push({
          id: `budget_exceeded_${budget.id}`,
          type: "budget",
          title: "Bütçe Aşıldı!",
          message: `"${budget.categoryLabel}" kategorisinde bütçeyi ₺${(spent - budget.limitAmount).toFixed(2)} aştınız!`,
          icon: "🔴",
          priority: "urgent",
          createdAt: new Date(),
          actionUrl: "/budgets",
          data: { budgetId: budget.id, spent, limit: budget.limitAmount },
        });
      } else if (percentUsed >= 90) {
        notifications.push({
          id: `budget_warning_${budget.id}`,
          type: "budget",
          title: "Bütçe Uyarısı",
          message: `"${budget.categoryLabel}" kategorisinde bütçenin %${percentUsed.toFixed(0)}'ını kullandınız. Kalan: ₺${(budget.limitAmount - spent).toFixed(2)}`,
          icon: "🟠",
          priority: "high",
          createdAt: new Date(),
          actionUrl: "/budgets",
          data: { budgetId: budget.id, spent, limit: budget.limitAmount },
        });
      } else if (percentUsed >= 75) {
        notifications.push({
          id: `budget_info_${budget.id}`,
          type: "budget",
          title: "Bütçe Bilgisi",
          message: `"${budget.categoryLabel}" kategorisinde bütçenin %${percentUsed.toFixed(0)}'ını kullandınız.`,
          icon: "🟡",
          priority: "medium",
          createdAt: new Date(),
          actionUrl: "/budgets",
          data: { budgetId: budget.id, spent, limit: budget.limitAmount },
        });
      }
    }

    return notifications;
  }

  // Generate weekly digest
  async generateWeeklyDigest(userId: string): Promise<SmartNotification> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: weekAgo, lte: now },
      },
    });

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expense;

    // Get top categories
    const categorySpending = new Map<string, number>();
    for (const tx of transactions.filter((t) => t.type === "expense")) {
      const label = tx.categoryLabel || "Diğer";
      categorySpending.set(label, (categorySpending.get(label) || 0) + Math.abs(tx.amount));
    }

    const topCategories = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, amount]) => `${label}: ₺${amount.toFixed(0)}`);

    return {
      id: `weekly_digest_${Date.now()}`,
      type: "digest",
      title: "Haftalık Özet",
      message: `Bu hafta: Gelir ₺${income.toFixed(0)} | Gider ₺${expense.toFixed(0)} | Net ${balance >= 0 ? "+" : ""}₺${balance.toFixed(0)}. İşlem sayısı: ${transactions.length}. En çok harcama: ${topCategories.join(", ") || "Yok"}`,
      icon: "📊",
      priority: "low",
      createdAt: new Date(),
      actionUrl: "/dashboard",
      data: {
        income,
        expense,
        balance,
        transactionCount: transactions.length,
        topCategories: Array.from(categorySpending.entries()),
      },
    };
  }

  // Generate monthly digest
  async generateMonthlyDigest(userId: string): Promise<SmartNotification> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: now },
      },
    });

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Get month name in Turkish
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const monthName = monthNames[now.getMonth()];

    return {
      id: `monthly_digest_${Date.now()}`,
      type: "digest",
      title: `${monthName} Ayı Özeti`,
      message: `Gelir: ₺${income.toFixed(0)} | Gider: ₺${expense.toFixed(0)} | Tasarruf Oranı: %${savingsRate.toFixed(1)}. Toplam ${transactions.length} işlem.`,
      icon: "📅",
      priority: "medium",
      createdAt: new Date(),
      actionUrl: "/reports",
      data: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        income,
        expense,
        savingsRate,
        transactionCount: transactions.length,
      },
    };
  }

  // Set notification preferences
  async setPreferences(prefs: NotificationPreferences): Promise<{ success: boolean }> {
    this.preferences.set(prefs.userId, prefs);
    this.logger.log(`Updated preferences for user ${prefs.userId}`);
    return { success: true };
  }

  // Get notification preferences
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.preferences.get(userId) || {
      userId,
      unusualSpendingAlerts: true,
      billReminders: true,
      budgetAlerts: true,
      weeklyDigest: true,
      monthlyDigest: true,
    };
  }

  // Get all smart notifications including new types
  async getSmartNotifications(userId: string): Promise<SmartNotification[]> {
    const prefs = await this.getPreferences(userId);

    const notificationPromises: Promise<SmartNotification[]>[] = [];

    if (prefs.unusualSpendingAlerts) {
      notificationPromises.push(this.detectAnomalies(userId));
    }
    if (prefs.billReminders) {
      notificationPromises.push(this.getBillReminders(userId));
    }
    if (prefs.budgetAlerts) {
      notificationPromises.push(this.getBudgetAlerts(userId));
    }

    // Always include tips, reminders, and celebrations
    notificationPromises.push(this.generateTips(userId));
    notificationPromises.push(this.getUpcomingReminders(userId));
    notificationPromises.push(this.checkCelebrations(userId));

    const results = await Promise.all(notificationPromises);
    const all = results.flat();

    // Sort by priority and date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return all.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // NOTE: Cron jobs are now managed by NotificationSchedulerService
  // which coordinates email and push notifications
}
