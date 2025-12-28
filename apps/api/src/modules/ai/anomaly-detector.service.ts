/**
 * Anomaly Detector Service
 * Detects unusual transactions with PII masking
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { maskPII, containsPII } from './pii-masker';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TransactionAnomaly {
  transactionId: string;
  type: 'amount' | 'frequency' | 'timing' | 'category' | 'merchant' | 'duplicate';
  severity: AnomalySeverity;
  score: number; // 0-100
  title: string;
  description: string;
  maskedDescription: string;
  amount?: number;
  expectedRange?: { min: number; max: number };
  detectedAt: Date;
  suggestedAction?: string;
}

interface TransactionStats {
  mean: number;
  stdDev: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
}

@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Detect anomalies in user's transactions
   */
  async detectAnomalies(userId: string): Promise<TransactionAnomaly[]> {
    const anomalies: TransactionAnomaly[] = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [historicalTransactions, recentTransactions] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, type: 'expense', date: { gte: sixMonthsAgo, lt: oneWeekAgo } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where: { userId, date: { gte: oneWeekAgo } },
        orderBy: { date: 'desc' },
      }),
    ]);

    if (historicalTransactions.length < 30) {
      return []; // Not enough data
    }

    // Calculate statistics
    const amounts = historicalTransactions.map(tx => Math.abs(tx.amount));
    const stats = this.calculateStats(amounts);

    // Category-specific stats
    const categoryStats = new Map<string, TransactionStats>();
    const categoryTransactions = new Map<string, { amount: number; date: Date }[]>();

    for (const tx of historicalTransactions) {
      const catTxs = categoryTransactions.get(tx.categoryId) || [];
      catTxs.push({ amount: Math.abs(tx.amount), date: tx.date });
      categoryTransactions.set(tx.categoryId, catTxs);
    }

    for (const [catId, txs] of categoryTransactions) {
      if (txs.length >= 5) {
        categoryStats.set(catId, this.calculateStats(txs.map(t => t.amount)));
      }
    }

    // Check recent transactions for anomalies
    for (const tx of recentTransactions) {
      if (tx.type !== 'expense') continue;

      const amount = Math.abs(tx.amount);
      const maskedDesc = maskPII(tx.description);
      const hasPII = containsPII(tx.description);

      // 1. Amount anomaly (overall)
      if (amount > stats.q3 + 2 * stats.iqr) {
        const score = Math.min(100, Math.round(((amount - stats.mean) / stats.stdDev) * 20));
        anomalies.push({
          transactionId: tx.id,
          type: 'amount',
          severity: this.getSeverity(score),
          score,
          title: 'Olağandışı Yüksek Harcama',
          description: `${tx.description}: ${amount.toLocaleString('tr-TR')}₺ - Normal aralık: ${Math.round(stats.q1)}-${Math.round(stats.q3)}₺`,
          maskedDescription: hasPII
            ? `${maskedDesc}: ${amount.toLocaleString('tr-TR')}₺`
            : `${tx.description}: ${amount.toLocaleString('tr-TR')}₺`,
          amount,
          expectedRange: { min: Math.round(stats.q1), max: Math.round(stats.q3) },
          detectedAt: now,
          suggestedAction: 'Bu işlemi kontrol edin ve onaylayın.',
        });
      }

      // 2. Category-specific anomaly
      const catStats = categoryStats.get(tx.categoryId);
      if (catStats && amount > catStats.mean + 2 * catStats.stdDev) {
        const score = Math.min(100, Math.round(((amount - catStats.mean) / catStats.stdDev) * 15));
        if (score >= 30) {
          anomalies.push({
            transactionId: tx.id,
            type: 'category',
            severity: this.getSeverity(score),
            score,
            title: `${tx.categoryLabel} Kategorisinde Yüksek Harcama`,
            description: `${tx.description}: ${amount.toLocaleString('tr-TR')}₺ - Bu kategoride ortalama: ${Math.round(catStats.mean)}₺`,
            maskedDescription: hasPII
              ? `${maskedDesc}: ${amount.toLocaleString('tr-TR')}₺`
              : `${tx.description}: ${amount.toLocaleString('tr-TR')}₺`,
            amount,
            expectedRange: { min: Math.round(catStats.q1), max: Math.round(catStats.q3) },
            detectedAt: now,
          });
        }
      }

      // 3. Timing anomaly (unusual hour)
      const hour = tx.date.getHours();
      if ((hour >= 2 && hour <= 5) && amount > 100) {
        anomalies.push({
          transactionId: tx.id,
          type: 'timing',
          severity: 'low',
          score: 25,
          title: 'Gece Saatlerinde İşlem',
          description: `${tx.description} - Saat ${hour}:${tx.date.getMinutes().toString().padStart(2, '0')}`,
          maskedDescription: hasPII ? maskedDesc : tx.description,
          amount,
          detectedAt: now,
          suggestedAction: 'Bu saatte işlem yapmanız normal mi?',
        });
      }
    }

    // 4. Check for duplicates
    const duplicates = this.findDuplicates(recentTransactions);
    for (const dup of duplicates) {
      anomalies.push({
        transactionId: dup.id,
        type: 'duplicate',
        severity: 'medium',
        score: 50,
        title: 'Olası Mükerrer İşlem',
        description: `${dup.description} - Aynı tutarda başka bir işlem var`,
        maskedDescription: maskPII(dup.description),
        amount: Math.abs(dup.amount),
        detectedAt: now,
        suggestedAction: 'İşlemin mükerrer olup olmadığını kontrol edin.',
      });
    }

    // 5. Frequency anomaly (too many transactions in short period)
    const last24h = recentTransactions.filter(tx =>
      tx.date.getTime() > now.getTime() - 24 * 60 * 60 * 1000
    );
    if (last24h.length > 10) {
      const avgDaily = historicalTransactions.length / 180; // 6 months
      if (last24h.length > avgDaily * 3) {
        anomalies.push({
          transactionId: last24h[0].id,
          type: 'frequency',
          severity: 'medium',
          score: 45,
          title: 'Yoğun İşlem Aktivitesi',
          description: `Son 24 saatte ${last24h.length} işlem (günlük ortalama: ${Math.round(avgDaily)})`,
          maskedDescription: `Son 24 saatte ${last24h.length} işlem`,
          detectedAt: now,
          suggestedAction: 'Hesabınızda olağandışı aktivite olabilir.',
        });
      }
    }

    // Sort by severity and score
    return anomalies
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Analyze a single transaction for anomalies
   */
  async analyzeTransaction(
    userId: string,
    transactionId: string
  ): Promise<TransactionAnomaly | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) return null;

    // Get user's historical data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historical = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: transaction.type,
        categoryId: transaction.categoryId,
        date: { gte: sixMonthsAgo },
        id: { not: transactionId },
      },
    });

    if (historical.length < 5) return null;

    const amounts = historical.map(tx => Math.abs(tx.amount));
    const stats = this.calculateStats(amounts);
    const txAmount = Math.abs(transaction.amount);

    // Check if anomalous
    const zScore = Math.abs((txAmount - stats.mean) / stats.stdDev);

    if (zScore >= 2) {
      const score = Math.min(100, Math.round(zScore * 25));
      const hasPII = containsPII(transaction.description);

      return {
        transactionId,
        type: 'amount',
        severity: this.getSeverity(score),
        score,
        title: 'Olağandışı İşlem Tutarı',
        description: `${transaction.description}: ${txAmount.toLocaleString('tr-TR')}₺`,
        maskedDescription: hasPII
          ? `${maskPII(transaction.description)}: ${txAmount.toLocaleString('tr-TR')}₺`
          : `${transaction.description}: ${txAmount.toLocaleString('tr-TR')}₺`,
        amount: txAmount,
        expectedRange: { min: Math.round(stats.q1), max: Math.round(stats.q3) },
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Get anomaly summary for dashboard
   */
  async getAnomalySummary(userId: string): Promise<{
    totalAnomalies: number;
    bySeverity: Record<AnomalySeverity, number>;
    recentAnomalies: TransactionAnomaly[];
    riskScore: number;
  }> {
    const anomalies = await this.detectAnomalies(userId);

    const bySeverity: Record<AnomalySeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const anomaly of anomalies) {
      bySeverity[anomaly.severity]++;
    }

    // Calculate risk score (0-100)
    const riskScore = Math.min(100,
      bySeverity.critical * 30 +
      bySeverity.high * 15 +
      bySeverity.medium * 5 +
      bySeverity.low * 2
    );

    return {
      totalAnomalies: anomalies.length,
      bySeverity,
      recentAnomalies: anomalies.slice(0, 5),
      riskScore,
    };
  }

  /**
   * Calculate statistical measures
   */
  private calculateStats(values: number[]): TransactionStats {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0, median: 0, q1: 0, q3: 0, iqr: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    // Mean
    const mean = values.reduce((a, b) => a + b, 0) / n;

    // Standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / n);

    // Median
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    return { mean, stdDev, median, q1, q3, iqr };
  }

  /**
   * Find duplicate transactions
   */
  private findDuplicates(
    transactions: { id: string; description: string; amount: number; date: Date }[]
  ): { id: string; description: string; amount: number }[] {
    const duplicates: { id: string; description: string; amount: number }[] = [];
    const seen = new Map<string, { id: string; date: Date }>();

    for (const tx of transactions) {
      // Key based on description + amount
      const key = `${tx.description.toLowerCase().trim()}_${Math.abs(tx.amount)}`;
      const existing = seen.get(key);

      if (existing) {
        // Check if within 24 hours
        const timeDiff = Math.abs(tx.date.getTime() - existing.date.getTime());
        if (timeDiff < 24 * 60 * 60 * 1000 && tx.id !== existing.id) {
          duplicates.push({ id: tx.id, description: tx.description, amount: tx.amount });
        }
      } else {
        seen.set(key, { id: tx.id, date: tx.date });
      }
    }

    return duplicates;
  }

  /**
   * Convert score to severity
   */
  private getSeverity(score: number): AnomalySeverity {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
