import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

interface DailyForecast {
  date: string;
  predictedIncome: number;
  predictedExpense: number;
  predictedBalance: number;
  bills: { name: string; amount: number }[];
  subscriptions: { name: string; amount: number }[];
  confidence: number;
}

interface CashflowForecast {
  startDate: string;
  endDate: string;
  currentBalance: number;
  projectedEndBalance: number;
  totalPredictedIncome: number;
  totalPredictedExpense: number;
  dailyForecasts: DailyForecast[];
  insights: string[];
  warnings: string[];
}

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate 30-day cashflow forecast
   */
  async generateForecast(
    userId: string,
    days: number = 30,
    language: 'tr' | 'en' = 'tr',
  ): Promise<CashflowForecast> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Get historical data for pattern analysis (last 90 days)
    const historicalStartDate = new Date(now);
    historicalStartDate.setDate(historicalStartDate.getDate() - 90);

    const [
      historicalTransactions,
      upcomingBills,
      activeSubscriptions,
      currentMonthSummary,
    ] = await Promise.all([
      this.getHistoricalTransactions(userId, historicalStartDate, now),
      this.getUpcomingBills(userId, endDate),
      this.getActiveSubscriptions(userId),
      this.getCurrentMonthSummary(userId),
    ]);

    // Calculate patterns
    const patterns = this.analyzePatterns(historicalTransactions);
    const dailyForecasts: DailyForecast[] = [];

    let runningBalance = currentMonthSummary.balance;
    let totalPredictedIncome = 0;
    let totalPredictedExpense = 0;

    // Generate daily forecasts
    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];
      const dayOfMonth = forecastDate.getDate();
      const dayOfWeek = forecastDate.getDay();

      // Predict income based on patterns
      let predictedIncome = 0;
      const incomePatterns = patterns.income.filter(
        (p) => p.dayOfMonth === dayOfMonth,
      );
      for (const pattern of incomePatterns) {
        predictedIncome += pattern.averageAmount * pattern.probability;
      }

      // Predict expense based on patterns and day of week
      let predictedExpense = 0;
      const expensePatterns = patterns.expense.filter(
        (p) =>
          p.dayOfMonth === dayOfMonth ||
          (p.dayOfWeek !== undefined && p.dayOfWeek === dayOfWeek),
      );
      for (const pattern of expensePatterns) {
        predictedExpense += pattern.averageAmount * pattern.probability;
      }

      // Add baseline daily spending
      predictedExpense += patterns.dailyAverageExpense;

      // Add bills due on this date
      const billsDue = upcomingBills.filter((b) => {
        const dueDate = new Date(b.dueDate);
        return dueDate.toISOString().split('T')[0] === dateStr;
      });

      for (const bill of billsDue) {
        predictedExpense += bill.amount;
      }

      // Add subscriptions due on this date
      const subscriptionsDue = activeSubscriptions.filter((s) => {
        const nextBilling = new Date(s.nextBillingDate);
        if (nextBilling.toISOString().split('T')[0] === dateStr) return true;

        // Check if subscription renews on this date
        if (s.billingCycle === 'monthly' && dayOfMonth === nextBilling.getDate()) {
          return true;
        }
        return false;
      });

      for (const sub of subscriptionsDue) {
        predictedExpense += sub.amount;
      }

      runningBalance += predictedIncome - predictedExpense;
      totalPredictedIncome += predictedIncome;
      totalPredictedExpense += predictedExpense;

      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(
        historicalTransactions.length,
        billsDue.length,
        subscriptionsDue.length,
      );

      dailyForecasts.push({
        date: dateStr,
        predictedIncome: Math.round(predictedIncome * 100) / 100,
        predictedExpense: Math.round(predictedExpense * 100) / 100,
        predictedBalance: Math.round(runningBalance * 100) / 100,
        bills: billsDue.map((b) => ({ name: b.name, amount: b.amount })),
        subscriptions: subscriptionsDue.map((s) => ({
          name: s.name,
          amount: s.amount,
        })),
        confidence,
      });
    }

    // Generate insights and warnings
    const insights = this.generateInsights(
      dailyForecasts,
      patterns,
      language,
    );
    const warnings = this.generateWarnings(
      dailyForecasts,
      currentMonthSummary.balance,
      language,
    );

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      currentBalance: currentMonthSummary.balance,
      projectedEndBalance: Math.round(runningBalance * 100) / 100,
      totalPredictedIncome: Math.round(totalPredictedIncome * 100) / 100,
      totalPredictedExpense: Math.round(totalPredictedExpense * 100) / 100,
      dailyForecasts,
      insights,
      warnings,
    };
  }

  private async getHistoricalTransactions(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  private async getUpcomingBills(userId: string, endDate: Date) {
    const now = new Date();
    return this.prisma.bill.findMany({
      where: {
        userId,
        dueDate: { gte: now, lte: endDate },
        isPaid: false,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private async getActiveSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  private async getCurrentMonthSummary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  private analyzePatterns(transactions: any[]) {
    const incomePatterns: {
      dayOfMonth: number;
      averageAmount: number;
      probability: number;
    }[] = [];
    const expensePatterns: {
      dayOfMonth: number;
      dayOfWeek?: number;
      averageAmount: number;
      probability: number;
      category?: string;
    }[] = [];

    // Group transactions by day of month
    const incomeByDay: Record<number, number[]> = {};
    const expenseByDay: Record<number, number[]> = {};
    const expenseByDayOfWeek: Record<number, number[]> = {};

    let totalExpense = 0;
    let expenseCount = 0;

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const dayOfMonth = date.getDate();
      const dayOfWeek = date.getDay();

      if (tx.type === 'income') {
        if (!incomeByDay[dayOfMonth]) incomeByDay[dayOfMonth] = [];
        incomeByDay[dayOfMonth].push(tx.amount);
      } else {
        if (!expenseByDay[dayOfMonth]) expenseByDay[dayOfMonth] = [];
        expenseByDay[dayOfMonth].push(Math.abs(tx.amount));

        if (!expenseByDayOfWeek[dayOfWeek]) expenseByDayOfWeek[dayOfWeek] = [];
        expenseByDayOfWeek[dayOfWeek].push(Math.abs(tx.amount));

        totalExpense += Math.abs(tx.amount);
        expenseCount++;
      }
    }

    // Calculate income patterns (e.g., salary on specific days)
    for (const [day, amounts] of Object.entries(incomeByDay)) {
      const dayNum = parseInt(day);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      // Probability based on consistency (appeared in how many months)
      const probability = Math.min(amounts.length / 3, 1); // Normalize to max 1

      if (avgAmount > 100 && probability >= 0.5) {
        incomePatterns.push({
          dayOfMonth: dayNum,
          averageAmount: avgAmount,
          probability,
        });
      }
    }

    // Calculate expense patterns
    for (const [day, amounts] of Object.entries(expenseByDay)) {
      const dayNum = parseInt(day);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const probability = Math.min(amounts.length / 3, 1);

      if (avgAmount > 50 && probability >= 0.3) {
        expensePatterns.push({
          dayOfMonth: dayNum,
          averageAmount: avgAmount,
          probability,
        });
      }
    }

    // Calculate daily average expense
    const dailyAverageExpense = expenseCount > 0 ? totalExpense / 90 : 0;

    return {
      income: incomePatterns,
      expense: expensePatterns,
      dailyAverageExpense,
    };
  }

  private calculateConfidence(
    historicalCount: number,
    billCount: number,
    subscriptionCount: number,
  ): number {
    // More data = higher confidence
    let confidence = 50; // Base confidence

    if (historicalCount > 100) confidence += 20;
    else if (historicalCount > 50) confidence += 15;
    else if (historicalCount > 20) confidence += 10;

    // Bills and subscriptions are more predictable
    confidence += billCount * 5;
    confidence += subscriptionCount * 3;

    return Math.min(confidence, 95); // Cap at 95%
  }

  private generateInsights(
    forecasts: DailyForecast[],
    patterns: any,
    language: 'tr' | 'en',
  ): string[] {
    const insights: string[] = [];

    // Check for income days
    const incomeDays = patterns.income.map((p: any) => p.dayOfMonth);
    if (incomeDays.length > 0) {
      insights.push(
        language === 'tr'
          ? `Gelir günleriniz genellikle ayın ${incomeDays.join(', ')}. günlerinde.`
          : `Your income typically arrives on day ${incomeDays.join(', ')} of the month.`,
      );
    }

    // Check projected balance trend
    const firstWeekAvg =
      forecasts.slice(0, 7).reduce((sum, f) => sum + f.predictedBalance, 0) / 7;
    const lastWeekAvg =
      forecasts.slice(-7).reduce((sum, f) => sum + f.predictedBalance, 0) / 7;

    if (lastWeekAvg > firstWeekAvg * 1.1) {
      insights.push(
        language === 'tr'
          ? 'Bakiyeniz önümüzdeki 30 gün içinde artış eğiliminde.'
          : 'Your balance is trending upward over the next 30 days.',
      );
    } else if (lastWeekAvg < firstWeekAvg * 0.9) {
      insights.push(
        language === 'tr'
          ? 'Bakiyeniz önümüzdeki 30 gün içinde düşüş eğiliminde.'
          : 'Your balance is trending downward over the next 30 days.',
      );
    }

    // Total bills and subscriptions
    const totalBills = forecasts.reduce((sum, f) => sum + f.bills.length, 0);
    const totalSubs = forecasts.reduce(
      (sum, f) => sum + f.subscriptions.length,
      0,
    );

    if (totalBills > 0) {
      insights.push(
        language === 'tr'
          ? `Önümüzdeki ${forecasts.length} gün içinde ${totalBills} fatura ödemeniz var.`
          : `You have ${totalBills} bills due in the next ${forecasts.length} days.`,
      );
    }

    return insights;
  }

  private generateWarnings(
    forecasts: DailyForecast[],
    currentBalance: number,
    language: 'tr' | 'en',
  ): string[] {
    const warnings: string[] = [];

    // Check for negative balance days
    const negativeDays = forecasts.filter((f) => f.predictedBalance < 0);
    if (negativeDays.length > 0) {
      const firstNegative = negativeDays[0];
      warnings.push(
        language === 'tr'
          ? `⚠️ ${firstNegative.date} tarihinde bakiyeniz negatife düşebilir.`
          : `⚠️ Your balance may go negative on ${firstNegative.date}.`,
      );
    }

    // Check for low balance days (< 20% of current)
    const lowThreshold = currentBalance * 0.2;
    const lowDays = forecasts.filter(
      (f) => f.predictedBalance < lowThreshold && f.predictedBalance > 0,
    );
    if (lowDays.length > 0 && negativeDays.length === 0) {
      warnings.push(
        language === 'tr'
          ? `⚠️ Bakiyeniz bazı günlerde düşük olabilir. Dikkatli olun.`
          : `⚠️ Your balance may be low on some days. Be cautious.`,
      );
    }

    // Check for high expense days
    const avgDailyExpense =
      forecasts.reduce((sum, f) => sum + f.predictedExpense, 0) /
      forecasts.length;
    const highExpenseDays = forecasts.filter(
      (f) => f.predictedExpense > avgDailyExpense * 3,
    );

    for (const day of highExpenseDays.slice(0, 3)) {
      warnings.push(
        language === 'tr'
          ? `📅 ${day.date}: Yüksek harcama bekleniyor (${day.predictedExpense.toFixed(0)} ₺)`
          : `📅 ${day.date}: High spending expected ($${day.predictedExpense.toFixed(0)})`,
      );
    }

    return warnings;
  }

  /**
   * Get weekly forecast summary
   */
  async getWeeklyForecast(userId: string, language: 'tr' | 'en' = 'tr') {
    const forecast = await this.generateForecast(userId, 7, language);

    const weeklyTotals = {
      income: forecast.totalPredictedIncome,
      expense: forecast.totalPredictedExpense,
      netChange: forecast.totalPredictedIncome - forecast.totalPredictedExpense,
      billsCount: forecast.dailyForecasts.reduce(
        (sum, f) => sum + f.bills.length,
        0,
      ),
      billsTotal: forecast.dailyForecasts.reduce(
        (sum, f) => sum + f.bills.reduce((s, b) => s + b.amount, 0),
        0,
      ),
    };

    return {
      ...forecast,
      weeklyTotals,
    };
  }
}
