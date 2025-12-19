import { Injectable } from "@nestjs/common";
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
}
