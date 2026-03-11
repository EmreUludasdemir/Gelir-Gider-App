import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface SpendingAnomaly {
  type: 'high_spending' | 'unusual_category' | 'frequency_spike' | 'large_transaction';
  severity: 'low' | 'medium' | 'high';
  message: string;
  categoryId?: string;
  categoryLabel?: string;
  amount?: number;
  percentageAboveNormal?: number;
  detectedAt: Date;
}

interface SpendingTrend {
  categoryId: string;
  categoryLabel: string;
  currentMonthSpending: number;
  previousMonthSpending: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  prediction: number;
}

interface FinancialHealth {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    name: string;
    score: number;
    status: 'good' | 'warning' | 'critical';
    advice: string;
  }[];
  savingsRate: number;
  expenseToIncomeRatio: number;
  budgetAdherence: number;
}

interface CategoryInsight {
  categoryId: string;
  categoryLabel: string;
  totalSpent: number;
  averageTransaction: number;
  transactionCount: number;
  percentageOfTotal: number;
  comparedToAverage: 'above' | 'below' | 'normal';
  suggestion?: string;
}

@Injectable()
export class AiAnalyticsService {
  private readonly logger = new Logger(AiAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Detect spending anomalies for a user
   */
  async detectAnomalies(userId: string): Promise<SpendingAnomaly[]> {
    const anomalies: SpendingAnomaly[] = [];
    const now = new Date();

    // Get last 3 months of transactions for baseline
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [historicalTransactions, recentTransactions] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          date: { gte: threeMonthsAgo, lt: startOfMonth },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          date: { gte: startOfMonth },
        },
      }),
    ]);

    if (historicalTransactions.length < 10) {
      return []; // Not enough data for analysis
    }

    // Calculate historical averages
    const historicalByCategory = new Map<string, { total: number; count: number; label: string }>();
    let historicalTotal = 0;
    const historicalAmounts: number[] = [];

    for (const tx of historicalTransactions) {
      const abs = Math.abs(tx.amount);
      historicalTotal += abs;
      historicalAmounts.push(abs);

      const existing = historicalByCategory.get(tx.categoryId) || { total: 0, count: 0, label: tx.categoryLabel };
      existing.total += abs;
      existing.count += 1;
      historicalByCategory.set(tx.categoryId, existing);
    }

    const monthsInHistory = 3;
    const avgMonthlySpending = historicalTotal / monthsInHistory;
    const avgTransactionAmount = historicalTotal / historicalTransactions.length;
    const stdDev = this.calculateStdDev(historicalAmounts);

    // 1. Check for high spending this month
    let currentMonthTotal = 0;
    for (const tx of recentTransactions) {
      currentMonthTotal += Math.abs(tx.amount);
    }

    const dayOfMonth = now.getDate();
    const projectedMonthlySpending = (currentMonthTotal / dayOfMonth) * 30;

    if (projectedMonthlySpending > avgMonthlySpending * 1.3) {
      const percentOver = Math.round(((projectedMonthlySpending / avgMonthlySpending) - 1) * 100);
      anomalies.push({
        type: 'high_spending',
        severity: percentOver > 50 ? 'high' : percentOver > 25 ? 'medium' : 'low',
        message: `Bu ay harcamalarınız ortalamadan %${percentOver} daha yüksek seyrediyor`,
        percentageAboveNormal: percentOver,
        detectedAt: now,
      });
    }

    // 2. Check for unusual category spending
    const currentByCategory = new Map<string, { total: number; label: string }>();
    for (const tx of recentTransactions) {
      const existing = currentByCategory.get(tx.categoryId) || { total: 0, label: tx.categoryLabel };
      existing.total += Math.abs(tx.amount);
      currentByCategory.set(tx.categoryId, existing);
    }

    for (const [categoryId, current] of currentByCategory) {
      const historical = historicalByCategory.get(categoryId);
      if (!historical) continue;

      const avgMonthlyCategory = historical.total / monthsInHistory;
      const projectedCategory = (current.total / dayOfMonth) * 30;

      if (projectedCategory > avgMonthlyCategory * 1.5 && projectedCategory > 100) {
        const percentOver = Math.round(((projectedCategory / avgMonthlyCategory) - 1) * 100);
        anomalies.push({
          type: 'unusual_category',
          severity: percentOver > 100 ? 'high' : percentOver > 50 ? 'medium' : 'low',
          message: `${current.label} kategorisinde normalden %${percentOver} daha fazla harcama`,
          categoryId,
          categoryLabel: current.label,
          percentageAboveNormal: percentOver,
          detectedAt: now,
        });
      }
    }

    // 3. Check for large individual transactions (> 2 std deviations)
    const largeThreshold = avgTransactionAmount + (2 * stdDev);
    for (const tx of recentTransactions) {
      const abs = Math.abs(tx.amount);
      if (abs > largeThreshold && abs > 500) {
        anomalies.push({
          type: 'large_transaction',
          severity: abs > largeThreshold * 2 ? 'high' : 'medium',
          message: `Büyük işlem tespit edildi: ${tx.description} - ${abs.toLocaleString('tr-TR')} ₺`,
          amount: abs,
          categoryLabel: tx.categoryLabel,
          detectedAt: now,
        });
      }
    }

    // 4. Check for frequency spike
    const avgDailyTransactions = historicalTransactions.length / 90; // 3 months
    const currentDailyTransactions = recentTransactions.length / dayOfMonth;

    if (currentDailyTransactions > avgDailyTransactions * 2 && recentTransactions.length > 10) {
      anomalies.push({
        type: 'frequency_spike',
        severity: 'low',
        message: `İşlem sıklığı normalin ${Math.round(currentDailyTransactions / avgDailyTransactions)}x üzerinde`,
        detectedAt: now,
      });
    }

    return anomalies;
  }

  /**
   * Analyze spending trends by category
   */
  async analyzeTrends(userId: string): Promise<SpendingTrend[]> {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [currentMonth, previousMonth, twoMonthsAgo] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, type: 'expense', date: { gte: startOfCurrentMonth } },
      }),
      this.prisma.transaction.findMany({
        where: { userId, type: 'expense', date: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } },
      }),
      this.prisma.transaction.findMany({
        where: { userId, type: 'expense', date: { gte: startOfTwoMonthsAgo, lt: startOfPreviousMonth } },
      }),
    ]);

    // Group by category
    const categoryMap = new Map<string, { label: string; current: number; previous: number; twoMonths: number }>();

    for (const tx of currentMonth) {
      const existing = categoryMap.get(tx.categoryId) || { label: tx.categoryLabel, current: 0, previous: 0, twoMonths: 0 };
      existing.current += Math.abs(tx.amount);
      categoryMap.set(tx.categoryId, existing);
    }

    for (const tx of previousMonth) {
      const existing = categoryMap.get(tx.categoryId) || { label: tx.categoryLabel, current: 0, previous: 0, twoMonths: 0 };
      existing.previous += Math.abs(tx.amount);
      categoryMap.set(tx.categoryId, existing);
    }

    for (const tx of twoMonthsAgo) {
      const existing = categoryMap.get(tx.categoryId) || { label: tx.categoryLabel, current: 0, previous: 0, twoMonths: 0 };
      existing.twoMonths += Math.abs(tx.amount);
      categoryMap.set(tx.categoryId, existing);
    }

    const trends: SpendingTrend[] = [];
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (const [categoryId, data] of categoryMap) {
      if (data.previous === 0 && data.current === 0) continue;

      // Project current month based on days passed
      const projectedCurrent = (data.current / dayOfMonth) * daysInMonth;
      const percentageChange = data.previous > 0
        ? ((projectedCurrent - data.previous) / data.previous) * 100
        : 100;

      // Simple linear prediction for next month
      const trend = data.twoMonths > 0
        ? (data.previous - data.twoMonths + projectedCurrent - data.previous) / 2
        : projectedCurrent - data.previous;
      const prediction = Math.max(0, projectedCurrent + trend);

      trends.push({
        categoryId,
        categoryLabel: data.label,
        currentMonthSpending: Math.round(projectedCurrent),
        previousMonthSpending: Math.round(data.previous),
        trend: percentageChange > 10 ? 'increasing' : percentageChange < -10 ? 'decreasing' : 'stable',
        percentageChange: Math.round(percentageChange),
        prediction: Math.round(prediction),
      });
    }

    return trends.sort((a, b) => b.currentMonthSpending - a.currentMonthSpending);
  }

  /**
   * Calculate overall financial health score
   */
  async calculateFinancialHealth(userId: string): Promise<FinancialHealth> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [transactions, budgets, savingsGoals] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, date: { gte: threeMonthsAgo } },
      }),
      this.prisma.budget.findMany({
        where: { userId, isActive: true },
      }),
      this.prisma.savingsGoal.findMany({
        where: { userId, isCompleted: false },
      }),
    ]);

    // Calculate income and expenses
    let totalIncome = 0;
    let totalExpense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += Math.abs(tx.amount);
      }
    }

    const monthlyAvgIncome = totalIncome / 3;
    const monthlyAvgExpense = totalExpense / 3;

    // Factor 1: Savings Rate (0-25 points)
    const savingsRate = monthlyAvgIncome > 0
      ? ((monthlyAvgIncome - monthlyAvgExpense) / monthlyAvgIncome) * 100
      : 0;
    const savingsScore = Math.min(25, Math.max(0, savingsRate / 2));

    // Factor 2: Expense to Income Ratio (0-25 points)
    const expenseRatio = monthlyAvgIncome > 0 ? monthlyAvgExpense / monthlyAvgIncome : 1;
    const ratioScore = Math.min(25, Math.max(0, (1 - expenseRatio) * 50));

    // Factor 3: Budget Adherence (0-25 points)
    let budgetAdherence = 100;
    if (budgets.length > 0) {
      const expenseByCategory = new Map<string, number>();
      for (const tx of transactions.filter(t => t.type === 'expense' && t.date >= startOfMonth)) {
        const existing = expenseByCategory.get(tx.categoryId) || 0;
        expenseByCategory.set(tx.categoryId, existing + Math.abs(tx.amount));
      }

      let totalAdherence = 0;
      for (const budget of budgets) {
        const spent = expenseByCategory.get(budget.categoryId) || 0;
        const adherence = Math.min(100, (1 - (spent - budget.limitAmount) / budget.limitAmount) * 100);
        totalAdherence += Math.max(0, adherence);
      }
      budgetAdherence = totalAdherence / budgets.length;
    }
    const budgetScore = budgetAdherence / 4;

    // Factor 4: Savings Goals Progress (0-25 points)
    let goalsScore = 12.5; // Default if no goals
    if (savingsGoals.length > 0) {
      let totalProgress = 0;
      for (const goal of savingsGoals) {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        totalProgress += Math.min(100, progress);
      }
      goalsScore = (totalProgress / savingsGoals.length) / 4;
    }

    const totalScore = Math.round(savingsScore + ratioScore + budgetScore + goalsScore);

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (totalScore >= 85) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 55) grade = 'C';
    else if (totalScore >= 40) grade = 'D';
    else grade = 'F';

    return {
      score: totalScore,
      grade,
      factors: [
        {
          name: 'Tasarruf Oranı',
          score: Math.round(savingsScore * 4),
          status: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'critical',
          advice: savingsRate >= 20
            ? 'Harika! Gelirin önemli bir kısmını tasarruf ediyorsun.'
            : savingsRate >= 10
              ? 'Tasarruf oranını %20\'ye çıkarmayı hedefle.'
              : 'Acil tasarruf planı oluşturmalısın.',
        },
        {
          name: 'Gelir/Gider Dengesi',
          score: Math.round(ratioScore * 4),
          status: expenseRatio <= 0.7 ? 'good' : expenseRatio <= 0.9 ? 'warning' : 'critical',
          advice: expenseRatio <= 0.7
            ? 'Giderlerin kontrol altında.'
            : expenseRatio <= 0.9
              ? 'Harcamaları biraz kısabilirsin.'
              : 'Harcamalar geliri aşıyor, dikkat!',
        },
        {
          name: 'Bütçe Uyumu',
          score: Math.round(budgetScore * 4),
          status: budgetAdherence >= 90 ? 'good' : budgetAdherence >= 70 ? 'warning' : 'critical',
          advice: budgetAdherence >= 90
            ? 'Bütçelere uyum mükemmel!'
            : budgetAdherence >= 70
              ? 'Bazı kategorilerde bütçeyi aşıyorsun.'
              : 'Bütçeleri gözden geçir ve sıkılaştır.',
        },
        {
          name: 'Hedef İlerlemesi',
          score: Math.round(goalsScore * 4),
          status: goalsScore >= 20 ? 'good' : goalsScore >= 10 ? 'warning' : 'critical',
          advice: savingsGoals.length === 0
            ? 'Tasarruf hedefleri belirle!'
            : goalsScore >= 20
              ? 'Hedeflere doğru ilerliyorsun.'
              : 'Hedefler için daha fazla birikim yap.',
        },
      ],
      savingsRate: Math.round(savingsRate),
      expenseToIncomeRatio: Math.round(expenseRatio * 100),
      budgetAdherence: Math.round(budgetAdherence),
    };
  }

  /**
   * Get detailed category insights
   */
  async getCategoryInsights(userId: string): Promise<CategoryInsight[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: startOfMonth } },
    });

    const categoryMap = new Map<string, { label: string; total: number; count: number; amounts: number[] }>();
    let grandTotal = 0;

    for (const tx of transactions) {
      const abs = Math.abs(tx.amount);
      grandTotal += abs;

      const existing = categoryMap.get(tx.categoryId) || { label: tx.categoryLabel, total: 0, count: 0, amounts: [] };
      existing.total += abs;
      existing.count += 1;
      existing.amounts.push(abs);
      categoryMap.set(tx.categoryId, existing);
    }

    // Average spending suggestions by category
    const categoryBenchmarks: Record<string, { max: number; suggestion: string }> = {
      food: { max: 25, suggestion: 'Yemek harcaması idealin üzerinde. Evde yemek yapmayı dene.' },
      transport: { max: 15, suggestion: 'Ulaşım giderlerini azaltmak için toplu taşıma kullan.' },
      shopping: { max: 15, suggestion: 'Alışverişlerde liste yap ve bütçe belirle.' },
      entertainment: { max: 10, suggestion: 'Eğlence için daha uygun alternatifler bul.' },
      bills: { max: 25, suggestion: 'Faturalar için tasarruf yöntemlerini araştır.' },
    };

    const insights: CategoryInsight[] = [];

    for (const [categoryId, data] of categoryMap) {
      const percentageOfTotal = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0;
      const benchmark = categoryBenchmarks[categoryId];

      let comparedToAverage: 'above' | 'below' | 'normal' = 'normal';
      let suggestion: string | undefined;

      if (benchmark) {
        if (percentageOfTotal > benchmark.max * 1.2) {
          comparedToAverage = 'above';
          suggestion = benchmark.suggestion;
        } else if (percentageOfTotal < benchmark.max * 0.5) {
          comparedToAverage = 'below';
        }
      }

      insights.push({
        categoryId,
        categoryLabel: data.label,
        totalSpent: Math.round(data.total),
        averageTransaction: Math.round(data.total / data.count),
        transactionCount: data.count,
        percentageOfTotal: Math.round(percentageOfTotal),
        comparedToAverage,
        suggestion,
      });
    }

    return insights.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  /**
   * Generate smart notifications based on analysis
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async generateDailyNotifications() {
    this.logger.log('Running daily AI analysis...');

    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      try {
        const anomalies = await this.detectAnomalies(user.id);

        // Log high severity anomalies for notification system to pick up
        for (const anomaly of anomalies.filter(a => a.severity === 'high')) {
          this.logger.log(`High severity anomaly for user ${user.id}: ${anomaly.message}`);
          // In production, this would trigger push notifications via NotificationsService
        }
      } catch (error) {
        this.logger.error(`Failed to analyze user ${user.id}:`, error);
      }
    }
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}
