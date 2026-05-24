import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { RedisService } from "../../redis.service";

interface MonthlyData {
  month: string;
  year: number;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

interface CategoryTrend {
  categoryId: string;
  categoryLabel: string;
  currentPeriod: number;
  previousPeriod: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

interface Forecast {
  predictedExpense: number;
  predictedIncome: number;
  confidence: number;
  basedOnMonths: number;
  topCategoryPredictions: Array<{
    categoryId: string;
    categoryLabel: string;
    predicted: number;
  }>;
}

export interface SavingsAction {
  id: string;
  estimatedMonthlySaving: number;
  confidence: number;
  actionType:
    | "cancel_subscription"
    | "reduce_category_spend"
    | "review_recurring_charge";
  reason: string;
  outcome?: "accepted" | "dismissed" | "completed";
}

export interface SavingsActionOutcomeDto {
  status: "accepted" | "dismissed" | "completed";
  reason?: string;
}

export interface ActionFeedItem {
  id: string;
  type: "cash_flow" | "budget" | "bill" | "subscription" | "savings";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impactAmount?: number;
  dueDate?: string;
  href: string;
}

export interface ActionFeed {
  generatedAt: string;
  attentionScore: number;
  items: ActionFeedItem[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  /**
   * Get monthly comparison data for the last N months
   */
  async getMonthlyComparison(
    userId: string,
    months: number = 6
  ): Promise<MonthlyData[]> {
    const cacheKey = `analytics:monthly:${userId}:${months}`;
    const cached = await this.redis.get<MonthlyData[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const results: MonthlyData[] = [];

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      let income = 0,
        expense = 0;
      transactions.forEach((tx) => {
        if (tx.type === "income") income += Math.abs(tx.amount);
        else expense += Math.abs(tx.amount);
      });

      results.push({
        month: monthDate.toLocaleString("tr-TR", { month: "long" }),
        year: monthDate.getFullYear(),
        income,
        expense,
        balance: income - expense,
        transactionCount: transactions.length,
      });
    }

    await this.redis.set(cacheKey, results.reverse(), 300); // 5 min cache
    return results;
  }

  /**
   * Get category spending trends
   */
  async getCategoryTrends(
    userId: string,
    period: "week" | "month" = "month"
  ): Promise<CategoryTrend[]> {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;

    if (period === "week") {
      const dayOfWeek = now.getDay();
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - dayOfWeek);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(now);

      prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
    } else {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    const [currentTx, prevTx] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: "expense",
          date: { gte: currentStart, lte: currentEnd },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: "expense",
          date: { gte: prevStart, lte: prevEnd },
        },
      }),
    ]);

    // Aggregate by category
    const currentByCategory = new Map<
      string,
      { total: number; label: string }
    >();
    const prevByCategory = new Map<string, { total: number; label: string }>();

    currentTx.forEach((tx) => {
      const existing = currentByCategory.get(tx.categoryId) || {
        total: 0,
        label: tx.categoryLabel,
      };
      existing.total += Math.abs(tx.amount);
      currentByCategory.set(tx.categoryId, existing);
    });

    prevTx.forEach((tx) => {
      const existing = prevByCategory.get(tx.categoryId) || {
        total: 0,
        label: tx.categoryLabel,
      };
      existing.total += Math.abs(tx.amount);
      prevByCategory.set(tx.categoryId, existing);
    });

    // Calculate trends
    const allCategories = new Set([
      ...currentByCategory.keys(),
      ...prevByCategory.keys(),
    ]);
    const trends: CategoryTrend[] = [];

    allCategories.forEach((categoryId) => {
      const current = currentByCategory.get(categoryId)?.total || 0;
      const prev = prevByCategory.get(categoryId)?.total || 0;
      const label =
        currentByCategory.get(categoryId)?.label ||
        prevByCategory.get(categoryId)?.label ||
        "Bilinmiyor";

      const changePercent =
        prev > 0 ? ((current - prev) / prev) * 100 : current > 0 ? 100 : 0;
      let trend: "up" | "down" | "stable" = "stable";
      if (changePercent > 10) trend = "up";
      else if (changePercent < -10) trend = "down";

      trends.push({
        categoryId,
        categoryLabel: label,
        currentPeriod: current,
        previousPeriod: prev,
        changePercent,
        trend,
      });
    });

    return trends.sort((a, b) => b.currentPeriod - a.currentPeriod);
  }

  /**
   * Get spending forecast based on historical data
   */
  async getSpendingForecast(userId: string): Promise<Forecast> {
    const cacheKey = `analytics:forecast:${userId}`;
    const cached = await this.redis.get<Forecast>(cacheKey);
    if (cached) return cached;

    // Get last 3 months data for prediction
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: threeMonthsAgo, lte: now },
      },
    });

    // Calculate monthly averages
    const monthlyData = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
      const monthKey = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
      const existing = monthlyData.get(monthKey) || { income: 0, expense: 0 };

      if (tx.type === "income") existing.income += Math.abs(tx.amount);
      else existing.expense += Math.abs(tx.amount);

      monthlyData.set(monthKey, existing);
    });

    const monthCount = monthlyData.size || 1;
    let totalIncome = 0,
      totalExpense = 0;
    monthlyData.forEach((data) => {
      totalIncome += data.income;
      totalExpense += data.expense;
    });

    const avgIncome = totalIncome / monthCount;
    const avgExpense = totalExpense / monthCount;

    // Category predictions
    const categoryTotals = new Map<string, { total: number; label: string }>();
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const existing = categoryTotals.get(tx.categoryId) || {
          total: 0,
          label: tx.categoryLabel,
        };
        existing.total += Math.abs(tx.amount);
        categoryTotals.set(tx.categoryId, existing);
      });

    const topCategoryPredictions = Array.from(categoryTotals.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryLabel: data.label,
        predicted: data.total / monthCount,
      }))
      .sort((a, b) => b.predicted - a.predicted)
      .slice(0, 5);

    const forecast: Forecast = {
      predictedExpense: avgExpense,
      predictedIncome: avgIncome,
      confidence: Math.min(monthCount * 25, 75), // Max 75% confidence
      basedOnMonths: monthCount,
      topCategoryPredictions,
    };

    await this.redis.set(cacheKey, forecast, 3600); // 1 hour cache
    return forecast;
  }

  /**
   * Get daily spending for current month
   */
  async getDailySpending(
    userId: string
  ): Promise<Array<{ date: string; amount: number }>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        date: { gte: startOfMonth, lte: now },
      },
      orderBy: { date: "asc" },
    });

    // Group by date
    const dailyMap = new Map<string, number>();
    transactions.forEach((tx) => {
      const dateKey = tx.date.toISOString().split("T")[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + Math.abs(tx.amount));
    });

    return Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  /**
   * Get savings rate
   */
  async getSavingsRate(
    userId: string
  ): Promise<{ rate: number; saved: number; target: number }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
    });

    let income = 0,
      expense = 0;
    transactions.forEach((tx) => {
      if (tx.type === "income") income += Math.abs(tx.amount);
      else expense += Math.abs(tx.amount);
    });

    const saved = income - expense;
    const rate = income > 0 ? (saved / income) * 100 : 0;

    return {
      rate: Math.max(0, rate),
      saved: Math.max(0, saved),
      target: income * 0.2, // 20% savings target
    };
  }

  async getActionFeed(userId: string): Promise<ActionFeed> {
    const cacheKey = `analytics:action-feed:${userId}`;
    const cached = await this.redis.get<ActionFeed>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [monthTransactions, budgets, upcomingBills, subscriptions, savingsActions] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: monthStart, lte: now },
          },
        }),
        this.prisma.budget.findMany({
          where: { userId, isActive: true },
          orderBy: { categoryLabel: "asc" },
        }),
        this.prisma.bill.findMany({
          where: {
            userId,
            isPaid: false,
            dueDate: { gte: now, lte: nextWeek },
          },
          orderBy: { dueDate: "asc" },
        }),
        this.prisma.subscription.findMany({
          where: { userId, isActive: true },
          orderBy: { amount: "desc" },
        }),
        this.getSavingsActions(userId),
      ]);

    const items: ActionFeedItem[] = [
      ...this.buildCashFlowActionItems(monthTransactions, upcomingBills, monthEnd),
      ...this.buildBudgetActionItems(budgets, monthTransactions),
      ...this.buildBillActionItems(upcomingBills, now),
      ...this.buildSubscriptionActionItems(subscriptions),
      ...this.buildSavingsActionItems(savingsActions),
    ];

    const deduplicatedItems = Array.from(new Map(items.map((item) => [item.id, item])).values())
      .sort((left, right) => this.priorityWeight(right.priority) - this.priorityWeight(left.priority))
      .slice(0, 8);

    const attentionScore = Math.min(
      100,
      deduplicatedItems.reduce((score, item) => score + this.priorityWeight(item.priority), 0),
    );

    const feed = {
      generatedAt: now.toISOString(),
      attentionScore,
      items: deduplicatedItems,
    };

    await this.redis.set(cacheKey, feed, 120);
    return feed;
  }

  async getSavingsActions(userId: string): Promise<SavingsAction[]> {
    const cacheKey = `analytics:savings-actions:${userId}`;
    const cached = await this.redis.get<SavingsAction[]>(cacheKey);
    if (cached) return cached;

    const [subscriptions, currentMonthExpenses, previousMonthExpenses, recentExpenses, outcomes] =
      await Promise.all([
        this.prisma.subscription.findMany({
          where: { userId, isActive: true },
          orderBy: { amount: "desc" },
        }),
        this.getExpenseTransactionsForMonth(userId, 0),
        this.getExpenseTransactionsForMonth(userId, 1),
        this.prisma.transaction.findMany({
          where: {
            userId,
            type: "expense",
            date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { date: "desc" },
        }),
        this.prisma.savingsActionOutcome.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        }),
      ]);

    const outcomeMap = new Map(
      outcomes.map((outcome) => [outcome.actionId, outcome.status as SavingsAction["outcome"]]),
    );

    const actions: SavingsAction[] = [];

    subscriptions.slice(0, 3).forEach((subscription) => {
      const monthlyCost = this.toMonthlyCost(subscription.amount, subscription.billingCycle);
      const actionId = `cancel_subscription:${subscription.id}`;
      const outcome = outcomeMap.get(actionId);
      if (outcome === "dismissed" || outcome === "completed") {
        return;
      }

      actions.push({
        id: actionId,
        actionType: "cancel_subscription",
        estimatedMonthlySaving: Number(monthlyCost.toFixed(2)),
        confidence: Math.min(95, 70 + Math.round(monthlyCost / 20)),
        reason: `${subscription.name} aylik ${monthlyCost.toFixed(2)} TRY recurring yuk olusturuyor.`,
        outcome,
      });
    });

    const categoryActions = this.buildCategorySavingsActions(
      currentMonthExpenses,
      previousMonthExpenses,
      outcomeMap,
    );
    actions.push(...categoryActions);

    const recurringActions = this.buildRecurringReviewActions(
      recentExpenses,
      subscriptions.map((subscription) => subscription.name),
      outcomeMap,
    );
    actions.push(...recurringActions);

    const deduplicated = Array.from(new Map(actions.map((action) => [action.id, action])).values())
      .sort((left, right) => {
        const leftScore = left.estimatedMonthlySaving * (left.confidence / 100);
        const rightScore = right.estimatedMonthlySaving * (right.confidence / 100);
        return rightScore - leftScore;
      })
      .slice(0, 8);

    await this.redis.set(cacheKey, deduplicated, 300);
    return deduplicated;
  }

  async saveSavingsActionOutcome(
    userId: string,
    actionId: string,
    dto: SavingsActionOutcomeDto,
  ): Promise<{ success: boolean }> {
    if (!["accepted", "dismissed", "completed"].includes(dto.status)) {
      throw new BadRequestException("Savings action outcome is invalid");
    }

    const actionType = this.extractActionType(actionId);
    if (!actionType) {
      throw new BadRequestException("Savings action type could not be resolved");
    }

    await this.prisma.savingsActionOutcome.upsert({
      where: {
        userId_actionId: {
          userId,
          actionId,
        },
      },
      create: {
        userId,
        actionId,
        actionType,
        status: dto.status,
        reason: dto.reason || null,
        metadata: JSON.stringify({ updatedAt: new Date().toISOString() }),
      },
      update: {
        actionType,
        status: dto.status,
        reason: dto.reason || null,
        metadata: JSON.stringify({ updatedAt: new Date().toISOString() }),
      },
    });

    await this.redis.del(`analytics:savings-actions:${userId}`);
    await this.redis.del(`analytics:action-feed:${userId}`);
    return { success: true };
  }

  private buildCashFlowActionItems(
    monthTransactions: Array<{ amount: number; type: string; date: Date }>,
    upcomingBills: Array<{ amount: number }>,
    monthEnd: Date,
  ): ActionFeedItem[] {
    const currentBalance = monthTransactions.reduce((sum, transaction) => {
      return transaction.type === "income"
        ? sum + Math.abs(transaction.amount)
        : sum - Math.abs(transaction.amount);
    }, 0);
    const expenseTotal = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const elapsedDays = Math.max(
      1,
      new Set(monthTransactions.map((transaction) => transaction.date.toISOString().slice(0, 10))).size,
    );
    const averageDailyExpense = expenseTotal / elapsedDays;
    const remainingDays = Math.max(
      0,
      Math.ceil((monthEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    const upcomingBillTotal = upcomingBills.reduce((sum, bill) => sum + Math.abs(bill.amount), 0);
    const projectedBalance = currentBalance - upcomingBillTotal - averageDailyExpense * remainingDays;

    if (projectedBalance < 0) {
      return [{
        id: "cash_flow:negative_projection",
        type: "cash_flow",
        priority: "critical",
        title: "Ay sonu nakit baskisi",
        description: `Projeksiyon ${projectedBalance.toFixed(2)} TRY seviyesinde.`,
        impactAmount: Number(Math.abs(projectedBalance).toFixed(2)),
        href: "/dashboard",
      }];
    }

    if (averageDailyExpense > 0 && projectedBalance < averageDailyExpense * 7) {
      return [{
        id: "cash_flow:thin_buffer",
        type: "cash_flow",
        priority: "high",
        title: "Tampon zayifliyor",
        description: "Ay sonu projeksiyonu 7 gunluk gider tamponunun altina yaklasiyor.",
        impactAmount: Number(projectedBalance.toFixed(2)),
        href: "/dashboard",
      }];
    }

    return [];
  }

  private buildBudgetActionItems(
    budgets: Array<{
      categoryId: string;
      categoryLabel: string;
      limitAmount: number;
      alertThreshold: number;
    }>,
    monthTransactions: Array<{ categoryId: string; amount: number; type: string }>,
  ): ActionFeedItem[] {
    const spendingByCategory = new Map<string, number>();
    monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        spendingByCategory.set(
          transaction.categoryId,
          (spendingByCategory.get(transaction.categoryId) || 0) + Math.abs(transaction.amount),
        );
      });

    return budgets
      .map<ActionFeedItem | null>((budget) => {
        const spent = spendingByCategory.get(budget.categoryId) || 0;
        const percentage = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : spent > 0 ? 100 : 0;
        if (percentage < budget.alertThreshold) {
          return null;
        }

        const isOver = spent > budget.limitAmount;
        const overage = Math.max(0, spent - budget.limitAmount);
        return {
          id: `budget:${budget.categoryId}`,
          type: "budget" as const,
          priority: isOver ? "high" as const : "medium" as const,
          title: isOver ? `${budget.categoryLabel} butcesi asildi` : `${budget.categoryLabel} butcesi sinirda`,
          description: `%${Math.round(percentage)} kullanim gorunuyor.`,
          impactAmount: Number((isOver ? overage : Math.max(0, budget.limitAmount - spent)).toFixed(2)),
          href: "/dashboard/budgets",
        };
      })
      .filter((item): item is ActionFeedItem => item !== null);
  }

  private buildBillActionItems(
    bills: Array<{ id: string; name: string; amount: number; dueDate: Date }>,
    now: Date,
  ): ActionFeedItem[] {
    return bills.slice(0, 3).map((bill) => {
      const daysUntilDue = Math.max(
        0,
        Math.ceil((bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return {
        id: `bill:${bill.id}`,
        type: "bill",
        priority: daysUntilDue <= 2 ? "high" : "medium",
        title: bill.name,
        description: daysUntilDue === 0 ? "Bugun odeme gunu." : `${daysUntilDue} gun icinde odeme var.`,
        impactAmount: Math.abs(bill.amount),
        dueDate: bill.dueDate.toISOString(),
        href: "/dashboard",
      };
    });
  }

  private buildSubscriptionActionItems(
    subscriptions: Array<{
      id: string;
      name: string;
      amount: number;
      billingCycle: string;
      nextBillingDate: Date;
    }>,
  ): ActionFeedItem[] {
    return subscriptions
      .map<ActionFeedItem | null>((subscription) => {
        const monthlyCost = this.toMonthlyCost(subscription.amount, subscription.billingCycle);
        if (monthlyCost < 100) {
          return null;
        }

        return {
          id: `subscription:${subscription.id}`,
          type: "subscription" as const,
          priority: monthlyCost >= 500 ? "medium" as const : "low" as const,
          title: `${subscription.name} aboneligi`,
          description: "Recurring yuk azaltma adayi.",
          impactAmount: Number(monthlyCost.toFixed(2)),
          dueDate: subscription.nextBillingDate.toISOString(),
          href: "/dashboard/subscriptions",
        };
      })
      .filter((item): item is ActionFeedItem => item !== null)
      .slice(0, 2);
  }

  private buildSavingsActionItems(actions: SavingsAction[]): ActionFeedItem[] {
    return actions.slice(0, 3).map((action) => ({
      id: `savings:${action.id}`,
      type: "savings",
      priority: action.estimatedMonthlySaving >= 500 || action.confidence >= 85 ? "medium" : "low",
      title:
        action.actionType === "cancel_subscription"
          ? "Abonelik gozden gecir"
          : action.actionType === "reduce_category_spend"
            ? "Kategori kesintisi"
            : "Recurring charge kontrolu",
      description: action.reason,
      impactAmount: action.estimatedMonthlySaving,
      href: action.actionType === "cancel_subscription" ? "/dashboard/subscriptions" : "/dashboard/transactions",
    }));
  }

  private priorityWeight(priority: ActionFeedItem["priority"]) {
    if (priority === "critical") return 40;
    if (priority === "high") return 25;
    if (priority === "medium") return 12;
    return 5;
  }

  private async getExpenseTransactionsForMonth(userId: string, monthOffset: number) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0, 23, 59, 59);

    return this.prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        date: { gte: start, lte: end },
      },
    });
  }

  private buildCategorySavingsActions(
    currentMonthExpenses: Array<{ categoryId: string; categoryLabel: string; amount: number }>,
    previousMonthExpenses: Array<{ categoryId: string; amount: number }>,
    outcomeMap: Map<string, SavingsAction["outcome"]>,
  ): SavingsAction[] {
    const currentMap = new Map<string, { total: number; label: string }>();
    currentMonthExpenses.forEach((transaction) => {
      const existing = currentMap.get(transaction.categoryId) || {
        total: 0,
        label: transaction.categoryLabel,
      };
      existing.total += Math.abs(transaction.amount);
      currentMap.set(transaction.categoryId, existing);
    });

    const previousMap = new Map<string, number>();
    previousMonthExpenses.forEach((transaction) => {
      previousMap.set(
        transaction.categoryId,
        (previousMap.get(transaction.categoryId) || 0) + Math.abs(transaction.amount),
      );
    });

    return Array.from(currentMap.entries())
      .filter(([, data]) => data.total >= 800)
      .map(([categoryId, data]) => {
        const previousTotal = previousMap.get(categoryId) || 0;
        const growth = previousTotal > 0 ? ((data.total - previousTotal) / previousTotal) * 100 : 0;
        const estimatedMonthlySaving = Number((data.total * (growth > 10 ? 0.15 : 0.1)).toFixed(2));
        const actionId = `reduce_category_spend:${categoryId}`;
        const outcome = outcomeMap.get(actionId);

        return {
          id: actionId,
          actionType: "reduce_category_spend" as const,
          estimatedMonthlySaving,
          confidence: Math.min(90, Math.max(62, Math.round(60 + growth / 2))),
          reason:
            growth > 10
              ? `${data.label} harcamasi gecen aya gore %${growth.toFixed(1)} arttı.`
              : `${data.label} bu ay ${data.total.toFixed(2)} TRY seviyesinde seyrediyor.`,
          outcome,
        };
      })
      .filter((action) => action.outcome !== "dismissed" && action.outcome !== "completed")
      .sort((left, right) => right.estimatedMonthlySaving - left.estimatedMonthlySaving)
      .slice(0, 3);
  }

  private buildRecurringReviewActions(
    recentExpenses: Array<{ description: string; amount: number }>,
    subscriptionNames: string[],
    outcomeMap: Map<string, SavingsAction["outcome"]>,
  ): SavingsAction[] {
    const knownSubscriptionNames = new Set(subscriptionNames.map((name) => this.normalizeName(name)));
    const grouped = new Map<string, { label: string; amounts: number[]; count: number }>();

    recentExpenses.forEach((transaction) => {
      const normalized = this.normalizeName(transaction.description);
      if (!normalized || normalized.length < 4 || knownSubscriptionNames.has(normalized)) {
        return;
      }

      const existing = grouped.get(normalized) || {
        label: transaction.description,
        amounts: [],
        count: 0,
      };
      existing.amounts.push(Math.abs(transaction.amount));
      existing.count += 1;
      grouped.set(normalized, existing);
    });

    return Array.from(grouped.entries())
      .filter(([, data]) => data.count >= 2)
      .map(([normalized, data]) => {
        const averageAmount =
          data.amounts.reduce((sum, amount) => sum + amount, 0) / data.amounts.length;
        const actionId = `review_recurring_charge:${normalized}`;
        const outcome = outcomeMap.get(actionId);

        return {
          id: actionId,
          actionType: "review_recurring_charge" as const,
          estimatedMonthlySaving: Number(averageAmount.toFixed(2)),
          confidence: Math.min(88, 55 + data.count * 8),
          reason: `${data.label} son 90 gunde ${data.count} kez goruldu; recurring charge olabilir.`,
          outcome,
        };
      })
      .filter((action) => action.outcome !== "dismissed" && action.outcome !== "completed")
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, 2);
  }

  private toMonthlyCost(amount: number, billingCycle: string) {
    if (billingCycle === "weekly") {
      return amount * 4;
    }
    if (billingCycle === "yearly") {
      return amount / 12;
    }
    return amount;
  }

  private normalizeName(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private extractActionType(actionId: string): SavingsAction["actionType"] | null {
    if (actionId.startsWith("cancel_subscription:")) return "cancel_subscription";
    if (actionId.startsWith("reduce_category_spend:")) return "reduce_category_spend";
    if (actionId.startsWith("review_recurring_charge:")) return "review_recurring_charge";
    return null;
  }
}
