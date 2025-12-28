import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';

export interface YearlyComparisonData {
  currentYear: number;
  previousYear: number;
  comparison: {
    month: number;
    monthName: string;
    currentYearIncome: number;
    currentYearExpense: number;
    previousYearIncome: number;
    previousYearExpense: number;
    incomeChange: number;
    expenseChange: number;
    incomeChangePercent: number;
    expenseChangePercent: number;
  }[];
  totals: {
    currentYearIncome: number;
    currentYearExpense: number;
    previousYearIncome: number;
    previousYearExpense: number;
    incomeGrowth: number;
    expenseGrowth: number;
    savingsRateCurrent: number;
    savingsRatePrevious: number;
  };
}

export interface CategoryTrend {
  categoryId: string;
  categoryLabel: string;
  months: {
    month: string;
    year: number;
    amount: number;
    transactionCount: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  averageMonthly: number;
  totalAmount: number;
  percentOfTotal: number;
}

export interface TrendAnalysisResult {
  period: string;
  startDate: Date;
  endDate: Date;
  categories: CategoryTrend[];
  topGrowingCategories: CategoryTrend[];
  topDecliningCategories: CategoryTrend[];
  overallTrend: {
    averageMonthlyExpense: number;
    averageMonthlyIncome: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export interface ScheduledReportConfig {
  userId: string;
  email: string;
  frequency: 'weekly' | 'monthly';
  enabled: boolean;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

@Injectable()
export class AdvancedReportsService {
  private readonly logger = new Logger(AdvancedReportsService.name);
  private scheduledReports: Map<string, ScheduledReportConfig> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Get yearly comparison report (this year vs last year)
   */
  async getYearlyComparison(userId: string, year?: number): Promise<YearlyComparisonData> {
    const currentYear = year || new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Fetch transactions for both years
    const [currentYearTx, previousYearTx] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: new Date(previousYear, 0, 1),
            lt: new Date(previousYear + 1, 0, 1),
          },
        },
      }),
    ]);

    // Group by month
    const currentYearByMonth = this.groupByMonth(currentYearTx);
    const previousYearByMonth = this.groupByMonth(previousYearTx);

    const comparison = [];
    for (let month = 0; month < 12; month++) {
      const current = currentYearByMonth[month] || { income: 0, expense: 0 };
      const previous = previousYearByMonth[month] || { income: 0, expense: 0 };

      const incomeChange = current.income - previous.income;
      const expenseChange = current.expense - previous.expense;

      comparison.push({
        month: month + 1,
        monthName: MONTH_NAMES_TR[month],
        currentYearIncome: current.income,
        currentYearExpense: current.expense,
        previousYearIncome: previous.income,
        previousYearExpense: previous.expense,
        incomeChange,
        expenseChange,
        incomeChangePercent: previous.income > 0 ? (incomeChange / previous.income) * 100 : 0,
        expenseChangePercent: previous.expense > 0 ? (expenseChange / previous.expense) * 100 : 0,
      });
    }

    // Calculate totals
    const currentTotals = this.calculateTotals(currentYearTx);
    const previousTotals = this.calculateTotals(previousYearTx);

    return {
      currentYear,
      previousYear,
      comparison,
      totals: {
        currentYearIncome: currentTotals.income,
        currentYearExpense: currentTotals.expense,
        previousYearIncome: previousTotals.income,
        previousYearExpense: previousTotals.expense,
        incomeGrowth: previousTotals.income > 0
          ? ((currentTotals.income - previousTotals.income) / previousTotals.income) * 100
          : 0,
        expenseGrowth: previousTotals.expense > 0
          ? ((currentTotals.expense - previousTotals.expense) / previousTotals.expense) * 100
          : 0,
        savingsRateCurrent: currentTotals.income > 0
          ? ((currentTotals.income - currentTotals.expense) / currentTotals.income) * 100
          : 0,
        savingsRatePrevious: previousTotals.income > 0
          ? ((previousTotals.income - previousTotals.expense) / previousTotals.income) * 100
          : 0,
      },
    };
  }

  /**
   * Get category trend analysis for the last N months
   */
  async getCategoryTrends(
    userId: string,
    months: number = 6,
    type: 'expense' | 'income' | 'all' = 'expense'
  ): Promise<TrendAnalysisResult> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const whereClause: Record<string, unknown> = {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (type !== 'all') {
      whereClause.type = type;
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    // Group by category and month
    const categoryData = new Map<string, CategoryTrend>();

    for (const tx of transactions) {
      const key = tx.categoryId || 'uncategorized';
      const txDate = new Date(tx.date);
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

      if (!categoryData.has(key)) {
        categoryData.set(key, {
          categoryId: tx.categoryId || 'uncategorized',
          categoryLabel: tx.categoryLabel || 'Kategorisiz',
          months: [],
          trend: 'stable',
          averageMonthly: 0,
          totalAmount: 0,
          percentOfTotal: 0,
        });
      }

      const category = categoryData.get(key)!;
      let monthData = category.months.find(m => `${m.year}-${String(m.month).padStart(2, '0')}` === monthKey);

      if (!monthData) {
        monthData = {
          month: MONTH_NAMES_TR[txDate.getMonth()],
          year: txDate.getFullYear(),
          amount: 0,
          transactionCount: 0,
        };
        category.months.push(monthData);
      }

      monthData.amount += Math.abs(tx.amount);
      monthData.transactionCount++;
      category.totalAmount += Math.abs(tx.amount);
    }

    // Calculate trends and averages
    const grandTotal = Array.from(categoryData.values()).reduce((sum, c) => sum + c.totalAmount, 0);

    const categories: CategoryTrend[] = [];
    for (const [, category] of categoryData) {
      category.averageMonthly = category.totalAmount / months;
      category.percentOfTotal = grandTotal > 0 ? (category.totalAmount / grandTotal) * 100 : 0;
      category.trend = this.calculateTrend(category.months);
      categories.push(category);
    }

    // Sort by total amount
    categories.sort((a, b) => b.totalAmount - a.totalAmount);

    // Get top growing and declining
    const growingCategories = categories
      .filter(c => c.trend === 'increasing')
      .slice(0, 5);

    const decliningCategories = categories
      .filter(c => c.trend === 'decreasing')
      .slice(0, 5);

    // Calculate overall trend
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const avgMonthlyExpense = totalExpense / months;
    const avgMonthlyIncome = totalIncome / months;

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    const savingsRate = avgMonthlyIncome > 0 ? (avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome : 0;
    if (savingsRate > 0.2) overallTrend = 'improving';
    else if (savingsRate < 0) overallTrend = 'declining';

    return {
      period: `Son ${months} ay`,
      startDate,
      endDate,
      categories,
      topGrowingCategories: growingCategories,
      topDecliningCategories: decliningCategories,
      overallTrend: {
        averageMonthlyExpense: avgMonthlyExpense,
        averageMonthlyIncome: avgMonthlyIncome,
        trend: overallTrend,
      },
    };
  }

  /**
   * Schedule email reports
   */
  async scheduleEmailReport(config: ScheduledReportConfig): Promise<{ success: boolean; message: string }> {
    this.scheduledReports.set(config.userId, config);
    this.logger.log(`Scheduled ${config.frequency} email report for user ${config.userId}`);

    return {
      success: true,
      message: `${config.frequency === 'weekly' ? 'Haftalık' : 'Aylık'} rapor ${config.email} adresine gönderilmek üzere planlandı.`,
    };
  }

  /**
   * Cancel scheduled email report
   */
  async cancelScheduledReport(userId: string): Promise<{ success: boolean; message: string }> {
    this.scheduledReports.delete(userId);
    this.logger.log(`Cancelled scheduled report for user ${userId}`);

    return {
      success: true,
      message: 'Planlanmış rapor iptal edildi.',
    };
  }

  /**
   * Get scheduled report config
   */
  async getScheduledReportConfig(userId: string): Promise<ScheduledReportConfig | null> {
    return this.scheduledReports.get(userId) || null;
  }

  /**
   * Weekly digest cron job (every Monday at 9 AM)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyDigests(): Promise<void> {
    this.logger.log('Running weekly digest job');

    for (const [userId, config] of this.scheduledReports) {
      if (config.enabled && config.frequency === 'weekly') {
        try {
          await this.generateAndSendDigest(userId, config.email, 'weekly');
        } catch (error) {
          this.logger.error(`Failed to send weekly digest to ${config.email}`, error);
        }
      }
    }
  }

  /**
   * Monthly digest cron job (1st of every month at 9 AM)
   */
  @Cron('0 9 1 * *')
  async sendMonthlyDigests(): Promise<void> {
    this.logger.log('Running monthly digest job');

    for (const [userId, config] of this.scheduledReports) {
      if (config.enabled && config.frequency === 'monthly') {
        try {
          await this.generateAndSendDigest(userId, config.email, 'monthly');
        } catch (error) {
          this.logger.error(`Failed to send monthly digest to ${config.email}`, error);
        }
      }
    }
  }

  /**
   * Generate and send digest email
   */
  private async generateAndSendDigest(
    userId: string,
    email: string,
    type: 'weekly' | 'monthly'
  ): Promise<void> {
    const endDate = new Date();
    const startDate = new Date();

    if (type === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totals = this.calculateTotals(transactions);

    // In a real implementation, this would use an email service
    this.logger.log(`Digest for ${email}:
      Period: ${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}
      Income: ${totals.income.toFixed(2)} TRY
      Expense: ${totals.expense.toFixed(2)} TRY
      Balance: ${(totals.income - totals.expense).toFixed(2)} TRY
      Transactions: ${transactions.length}
    `);

    // TODO: Integrate with actual email service (e.g., SendGrid, Nodemailer)
  }

  /**
   * Get digest summary data (for preview)
   */
  async getDigestPreview(userId: string, type: 'weekly' | 'monthly'): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalIncome: number;
      totalExpense: number;
      netBalance: number;
      transactionCount: number;
      topCategories: { label: string; amount: number }[];
    };
  }> {
    const endDate = new Date();
    const startDate = new Date();

    if (type === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totals = this.calculateTotals(transactions);

    // Calculate top expense categories
    const categoryTotals = new Map<string, number>();
    for (const tx of transactions.filter(t => t.type === 'expense')) {
      const label = tx.categoryLabel || 'Diğer';
      categoryTotals.set(label, (categoryTotals.get(label) || 0) + Math.abs(tx.amount));
    }

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, amount]) => ({ label, amount }));

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalIncome: totals.income,
        totalExpense: totals.expense,
        netBalance: totals.income - totals.expense,
        transactionCount: transactions.length,
        topCategories,
      },
    };
  }

  // Helper methods
  private groupByMonth(transactions: Array<{ date: Date; type: string; amount: number }>): Record<number, { income: number; expense: number }> {
    const grouped: Record<number, { income: number; expense: number }> = {};

    for (const tx of transactions) {
      const month = new Date(tx.date).getMonth();
      if (!grouped[month]) {
        grouped[month] = { income: 0, expense: 0 };
      }

      if (tx.type === 'income') {
        grouped[month].income += tx.amount;
      } else {
        grouped[month].expense += Math.abs(tx.amount);
      }
    }

    return grouped;
  }

  private calculateTotals(transactions: Array<{ type: string; amount: number }>): { income: number; expense: number } {
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += Math.abs(tx.amount);
      }
    }

    return { income, expense };
  }

  private calculateTrend(months: Array<{ amount: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (months.length < 2) return 'stable';

    // Simple linear regression
    const n = months.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += months[i].amount;
      sumXY += i * months[i].amount;
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgAmount = sumY / n;

    // Determine trend based on slope relative to average
    const threshold = avgAmount * 0.05; // 5% threshold

    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }
}
