import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export interface DetectedSubscription {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  category: string;
  lastPayment: Date;
  nextPayment: Date;
  isActive: boolean;
  totalSpentYear: number;
}

// Known subscription patterns
const KNOWN_SUBSCRIPTIONS = [
  { patterns: ["netflix", "netflıx"], name: "Netflix", category: "Eğlence" },
  { patterns: ["spotify"], name: "Spotify", category: "Eğlence" },
  {
    patterns: ["youtube premium", "youtube music"],
    name: "YouTube Premium",
    category: "Eğlence",
  },
  { patterns: ["amazon prime"], name: "Amazon Prime", category: "Eğlence" },
  {
    patterns: ["disney+", "disney plus"],
    name: "Disney+",
    category: "Eğlence",
  },
  {
    patterns: ["apple music", "icloud", "apple one"],
    name: "Apple Services",
    category: "Teknoloji",
  },
  {
    patterns: ["google one", "google storage"],
    name: "Google One",
    category: "Teknoloji",
  },
  {
    patterns: ["microsoft 365", "office 365"],
    name: "Microsoft 365",
    category: "İş",
  },
  { patterns: ["adobe", "creative cloud"], name: "Adobe CC", category: "İş" },
  {
    patterns: ["chatgpt", "openai"],
    name: "ChatGPT Plus",
    category: "Teknoloji",
  },
  { patterns: ["github"], name: "GitHub", category: "Teknoloji" },
  { patterns: ["linkedin premium"], name: "LinkedIn Premium", category: "İş" },
  {
    patterns: ["gym", "fitness", "spor salonu"],
    name: "Spor Salonu",
    category: "Sağlık",
  },
  {
    patterns: ["turkcell", "vodafone", "türk telekom"],
    name: "Telefon Faturası",
    category: "Faturalar",
  },
  {
    patterns: ["exxen", "gain", "blutv", "puhutv"],
    name: "Dijital TV",
    category: "Eğlence",
  },
];

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Detect subscriptions from transaction history
  async detectSubscriptions(userId: string): Promise<DetectedSubscription[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    const subscriptions: DetectedSubscription[] = [];
    const processedPatterns = new Set<string>();

    for (const tx of transactions) {
      const description = tx.description.toLowerCase();

      // Check against known subscriptions
      for (const known of KNOWN_SUBSCRIPTIONS) {
        if (processedPatterns.has(known.name)) continue;

        const matches = known.patterns.some((p) => description.includes(p));
        if (matches) {
          const relatedTxs = transactions.filter((t) =>
            known.patterns.some((p) => t.description.toLowerCase().includes(p))
          );

          if (relatedTxs.length >= 2) {
            const subscription = this.analyzeSubscription(
              known.name,
              known.category,
              relatedTxs
            );
            if (subscription) {
              subscriptions.push(subscription);
              processedPatterns.add(known.name);
            }
          }
        }
      }
    }

    // Also detect unknown recurring payments
    const unknownRecurring = await this.detectUnknownRecurring(
      userId,
      transactions
    );
    subscriptions.push(...unknownRecurring);

    return subscriptions.sort((a, b) => b.amount - a.amount);
  }

  // Analyze subscription details
  private analyzeSubscription(
    name: string,
    category: string,
    transactions: Array<{ amount: number; createdAt: Date; id: string }>
  ): DetectedSubscription | null {
    if (transactions.length < 2) return null;

    const amounts = transactions.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Check if amounts are consistent (within 10% variance)
    const isConsistent = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < 0.1
    );
    if (!isConsistent) return null;

    // Determine frequency
    const sortedDates = transactions
      .map((t) => new Date(t.createdAt).getTime())
      .sort((a, b) => b - a);

    const intervals: number[] = [];
    for (let i = 0; i < sortedDates.length - 1; i++) {
      intervals.push(
        (sortedDates[i] - sortedDates[i + 1]) / (24 * 60 * 60 * 1000)
      );
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    let frequency: "weekly" | "monthly" | "yearly";
    if (avgInterval <= 10) frequency = "weekly";
    else if (avgInterval <= 45) frequency = "monthly";
    else frequency = "yearly";

    const lastPayment = new Date(sortedDates[0]);
    const nextPayment = new Date(lastPayment);

    if (frequency === "weekly") nextPayment.setDate(nextPayment.getDate() + 7);
    else if (frequency === "monthly")
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    else nextPayment.setFullYear(nextPayment.getFullYear() + 1);

    return {
      id: `sub_${name.toLowerCase().replace(/\s/g, "_")}`,
      name,
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      category,
      lastPayment,
      nextPayment,
      isActive:
        Date.now() - lastPayment.getTime() <
        (avgInterval + 15) * 24 * 60 * 60 * 1000,
      totalSpentYear: transactions.reduce((sum, t) => sum + t.amount, 0),
    };
  }

  // Detect unknown recurring payments
  private async detectUnknownRecurring(
    userId: string,
    transactions: Array<{
      description: string;
      amount: number;
      createdAt: Date;
      id: string;
    }>
  ): Promise<DetectedSubscription[]> {
    const descriptionGroups = new Map<string, typeof transactions>();

    for (const tx of transactions) {
      // Normalize description
      const normalized = tx.description
        .toLowerCase()
        .replace(/[0-9]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (normalized.length < 3) continue;

      if (!descriptionGroups.has(normalized)) {
        descriptionGroups.set(normalized, []);
      }
      descriptionGroups.get(normalized)!.push(tx);
    }

    const unknownSubs: DetectedSubscription[] = [];

    for (const [description, txs] of descriptionGroups) {
      if (txs.length >= 3) {
        const sub = this.analyzeSubscription(
          this.capitalizeFirst(description),
          "Diğer",
          txs
        );
        if (sub && sub.isActive) {
          // Skip if already detected as known subscription
          unknownSubs.push(sub);
        }
      }
    }

    return unknownSubs;
  }

  // Get subscription summary
  async getSubscriptionSummary(userId: string): Promise<{
    subscriptions: DetectedSubscription[];
    totalMonthly: number;
    totalYearly: number;
    activeCount: number;
    upcomingPayments: Array<{ name: string; amount: number; date: Date }>;
  }> {
    const subscriptions = await this.detectSubscriptions(userId);
    const active = subscriptions.filter((s) => s.isActive);

    let totalMonthly = 0;
    for (const sub of active) {
      if (sub.frequency === "weekly") totalMonthly += sub.amount * 4;
      else if (sub.frequency === "monthly") totalMonthly += sub.amount;
      else totalMonthly += sub.amount / 12;
    }

    const upcoming = active
      .filter((s) => s.nextPayment.getTime() > Date.now())
      .sort((a, b) => a.nextPayment.getTime() - b.nextPayment.getTime())
      .slice(0, 5)
      .map((s) => ({ name: s.name, amount: s.amount, date: s.nextPayment }));

    return {
      subscriptions,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalYearly: Math.round(totalMonthly * 12 * 100) / 100,
      activeCount: active.length,
      upcomingPayments: upcoming,
    };
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
