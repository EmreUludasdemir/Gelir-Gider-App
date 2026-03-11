/**
 * Spending Analyzer Service
 * Provides insights, predictions, and savings recommendations
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { maskPII } from './pii-masker';

export interface SpendingInsight {
  type: 'saving_tip' | 'spending_pattern' | 'prediction' | 'opportunity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  potentialSavings?: number;
  category?: string;
}

export interface SpendingPrediction {
  category: string;
  categoryLabel: string;
  currentMonthActual: number;
  projectedMonthEnd: number;
  nextMonthPrediction: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface SavingsOpportunity {
  category: string;
  categoryLabel: string;
  averageSpending: number;
  suggestedBudget: number;
  potentialMonthlySavings: number;
  advice: string;
}

@Injectable()
export class SpendingAnalyzerService {
  private readonly logger = new Logger(SpendingAnalyzerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate personalized spending insights
   */
  async generateInsights(userId: string): Promise<SpendingInsight[]> {
    const insights: SpendingInsight[] = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      orderBy: { date: 'desc' },
    });

    if (transactions.length < 20) {
      return [{
        type: 'spending_pattern',
        title: 'Daha Fazla Veri Gerekli',
        description: 'Detaylı analiz için en az 20 işlem gerekiyor.',
        impact: 'low',
      }];
    }

    // Analyze spending patterns
    const categorySpending = new Map<string, { total: number; count: number; label: string; amounts: number[] }>();
    const dayOfWeekSpending = new Map<number, number>();
    const hourlySpending = new Map<number, number>();
    let totalExpense = 0;
    let totalIncome = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        const amount = Math.abs(tx.amount);
        totalExpense += amount;

        // Category analysis
        const cat = categorySpending.get(tx.categoryId) || { total: 0, count: 0, label: tx.categoryLabel, amounts: [] };
        cat.total += amount;
        cat.count += 1;
        cat.amounts.push(amount);
        categorySpending.set(tx.categoryId, cat);

        // Day of week analysis
        const dayOfWeek = tx.date.getDay();
        dayOfWeekSpending.set(dayOfWeek, (dayOfWeekSpending.get(dayOfWeek) || 0) + amount);

        // Hourly analysis (if time available)
        const hour = tx.date.getHours();
        hourlySpending.set(hour, (hourlySpending.get(hour) || 0) + amount);
      }
    }

    // 1. Weekend spending pattern
    const weekendSpending = (dayOfWeekSpending.get(0) || 0) + (dayOfWeekSpending.get(6) || 0);
    const weekdaySpending = totalExpense - weekendSpending;
    const weekendRatio = weekendSpending / (weekdaySpending / 5 * 2);

    if (weekendRatio > 1.5) {
      insights.push({
        type: 'spending_pattern',
        title: 'Hafta Sonu Harcama Artışı',
        description: `Hafta sonları haftaiçine göre %${Math.round((weekendRatio - 1) * 100)} daha fazla harcıyorsun. Hafta sonu planları yaparken bütçe belirle.`,
        impact: weekendRatio > 2 ? 'high' : 'medium',
        potentialSavings: Math.round((weekendSpending - weekdaySpending / 5 * 2) / 6 * 0.3),
      });
    }

    // 2. Category-specific insights
    const sortedCategories = [...categorySpending.entries()]
      .sort((a, b) => b[1].total - a[1].total);

    // Top spending category
    if (sortedCategories.length > 0) {
      const [topCatId, topCat] = sortedCategories[0];
      const percentage = (topCat.total / totalExpense) * 100;

      if (percentage > 40) {
        insights.push({
          type: 'spending_pattern',
          title: `${topCat.label} Ağırlıklı Harcama`,
          description: `Harcamalarının %${Math.round(percentage)}'i ${topCat.label} kategorisinde. Bu kategoriyi gözden geçirmek tasarruf fırsatı yaratabilir.`,
          impact: 'high',
          category: topCatId,
        });
      }
    }

    // 3. Small frequent purchases
    const smallPurchases = transactions.filter(tx =>
      tx.type === 'expense' && Math.abs(tx.amount) < 50
    );
    const smallTotal = smallPurchases.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const smallPercentage = (smallTotal / totalExpense) * 100;

    if (smallPercentage > 25) {
      insights.push({
        type: 'saving_tip',
        title: 'Küçük Harcamalar Birikiyor',
        description: `50₺ altı harcamalar toplamda ${smallTotal.toLocaleString('tr-TR')}₺ (%${Math.round(smallPercentage)}). Küçük harcamaları takip etmek büyük tasarruf sağlayabilir.`,
        impact: 'medium',
        potentialSavings: Math.round(smallTotal * 0.2),
      });
    }

    // 4. Savings rate
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;

    if (savingsRate < 10 && totalIncome > 0) {
      insights.push({
        type: 'saving_tip',
        title: 'Tasarruf Oranı Düşük',
        description: `Gelirinin sadece %${Math.round(savingsRate)}'ini tasarruf ediyorsun. Hedef: %20. Otomatik tasarruf ayarlamayı düşün.`,
        impact: 'high',
        potentialSavings: Math.round(totalIncome * 0.1 / 6), // Monthly potential
      });
    } else if (savingsRate >= 20) {
      insights.push({
        type: 'opportunity',
        title: 'Harika Tasarruf Oranı!',
        description: `Gelirinin %${Math.round(savingsRate)}'ini tasarruf ediyorsun. Bu tasarrufları yatırıma yönlendirmeyi düşün.`,
        impact: 'low',
      });
    }

    // 5. Subscription detection hint
    const possibleSubscriptions = this.detectPossibleSubscriptions(transactions);
    if (possibleSubscriptions.length > 0) {
      const totalSubCost = possibleSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
      insights.push({
        type: 'saving_tip',
        title: 'Düzenli Ödemeler Tespit Edildi',
        description: `${possibleSubscriptions.length} düzenli ödeme tespit edildi (toplam ~${totalSubCost.toLocaleString('tr-TR')}₺/ay). Kullanmadıklarını iptal etmeyi düşün.`,
        impact: 'medium',
        potentialSavings: Math.round(totalSubCost * 0.2),
      });
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  /**
   * Generate spending predictions
   */
  async predictSpending(userId: string): Promise<SpendingPrediction[]> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: threeMonthsAgo } },
    });

    // Group by category and month
    const categoryMonthly = new Map<string, { label: string; months: Map<string, number> }>();

    for (const tx of transactions) {
      const monthKey = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
      const cat = categoryMonthly.get(tx.categoryId) || { label: tx.categoryLabel, months: new Map() };
      cat.months.set(monthKey, (cat.months.get(monthKey) || 0) + Math.abs(tx.amount));
      categoryMonthly.set(tx.categoryId, cat);
    }

    const predictions: SpendingPrediction[] = [];
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (const [categoryId, data] of categoryMonthly) {
      const monthlyTotals = [...data.months.entries()]
        .filter(([key]) => key !== currentMonthKey)
        .map(([, total]) => total);

      if (monthlyTotals.length < 2) continue;

      const avgMonthly = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;
      const currentActual = data.months.get(currentMonthKey) || 0;
      const projectedEnd = (currentActual / dayOfMonth) * daysInMonth;

      // Simple linear regression for next month
      const trend = monthlyTotals.length >= 3
        ? (monthlyTotals[monthlyTotals.length - 1] - monthlyTotals[0]) / monthlyTotals.length
        : 0;
      const nextMonthPrediction = Math.max(0, projectedEnd + trend);

      // Determine trend
      const change = ((projectedEnd - avgMonthly) / avgMonthly) * 100;
      let trendDir: 'increasing' | 'decreasing' | 'stable';
      if (change > 10) trendDir = 'increasing';
      else if (change < -10) trendDir = 'decreasing';
      else trendDir = 'stable';

      predictions.push({
        category: categoryId,
        categoryLabel: data.label,
        currentMonthActual: Math.round(currentActual),
        projectedMonthEnd: Math.round(projectedEnd),
        nextMonthPrediction: Math.round(nextMonthPrediction),
        confidence: Math.min(95, 60 + monthlyTotals.length * 10),
        trend: trendDir,
      });
    }

    return predictions.sort((a, b) => b.projectedMonthEnd - a.projectedMonthEnd);
  }

  /**
   * Find savings opportunities
   */
  async findSavingsOpportunities(userId: string): Promise<SavingsOpportunity[]> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: threeMonthsAgo } },
    });

    // Group by category
    const categoryData = new Map<string, { label: string; total: number; count: number }>();

    for (const tx of transactions) {
      const cat = categoryData.get(tx.categoryId) || { label: tx.categoryLabel, total: 0, count: 0 };
      cat.total += Math.abs(tx.amount);
      cat.count += 1;
      categoryData.set(tx.categoryId, cat);
    }

    const opportunities: SavingsOpportunity[] = [];

    // Category benchmarks (percentage of typical budget)
    const benchmarks: Record<string, { maxPercent: number; advice: string }> = {
      food: { maxPercent: 25, advice: 'Evde yemek yaparak tasarruf edebilirsin.' },
      transport: { maxPercent: 15, advice: 'Toplu taşıma veya carpool kullanmayı düşün.' },
      shopping: { maxPercent: 10, advice: 'Alışveriş öncesi liste yap ve 24 saat kuralı uygula.' },
      entertainment: { maxPercent: 10, advice: 'Ücretsiz etkinlikleri araştır.' },
      subscriptions: { maxPercent: 5, advice: 'Kullanmadığın abonelikleri iptal et.' },
    };

    const totalExpense = [...categoryData.values()].reduce((sum, cat) => sum + cat.total, 0);
    const monthlyAvg = totalExpense / 3;

    for (const [categoryId, data] of categoryData) {
      const monthlySpending = data.total / 3;
      const percentage = (monthlySpending / monthlyAvg) * 100;
      const benchmark = benchmarks[categoryId];

      if (benchmark && percentage > benchmark.maxPercent) {
        const suggestedBudget = monthlyAvg * (benchmark.maxPercent / 100);
        const potentialSavings = monthlySpending - suggestedBudget;

        if (potentialSavings > 50) {
          opportunities.push({
            category: categoryId,
            categoryLabel: data.label,
            averageSpending: Math.round(monthlySpending),
            suggestedBudget: Math.round(suggestedBudget),
            potentialMonthlySavings: Math.round(potentialSavings),
            advice: benchmark.advice,
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings);
  }

  /**
   * Mask sensitive data in transaction descriptions
   */
  maskTransactionData(description: string): string {
    return maskPII(description);
  }

  /**
   * Detect possible subscriptions from transaction patterns
   */
  private detectPossibleSubscriptions(
    transactions: { description: string; amount: number; date: Date; type: string }[]
  ): { description: string; amount: number }[] {
    const expenses = transactions.filter(tx => tx.type === 'expense');
    const descriptionMap = new Map<string, { amounts: number[]; dates: Date[] }>();

    for (const tx of expenses) {
      const key = tx.description.toLowerCase().trim();
      const existing = descriptionMap.get(key) || { amounts: [], dates: [] };
      existing.amounts.push(Math.abs(tx.amount));
      existing.dates.push(tx.date);
      descriptionMap.set(key, existing);
    }

    const subscriptions: { description: string; amount: number }[] = [];

    for (const [desc, data] of descriptionMap) {
      if (data.amounts.length >= 2) {
        // Check if amounts are similar (within 10%)
        const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
        const allSimilar = data.amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount < 0.1);

        if (allSimilar) {
          subscriptions.push({ description: desc, amount: avgAmount });
        }
      }
    }

    return subscriptions;
  }
}
