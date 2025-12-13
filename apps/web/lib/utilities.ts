"use client";

import useSWR from "swr";

interface ExchangeRates {
  TRY: number;
  USD: number;
  EUR: number;
}

// Exchange rate fetcher (using free API)
const fetchRates = async (): Promise<ExchangeRates> => {
  try {
    // Using exchangerate-api.com free tier
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    if (!response.ok) throw new Error("Failed to fetch rates");

    const data = await response.json();
    return {
      TRY: data.rates.TRY || 32.5,
      USD: 1,
      EUR: data.rates.EUR || 0.92,
    };
  } catch {
    // Fallback rates if API fails
    return { TRY: 32.5, USD: 1, EUR: 0.92 };
  }
};

export function useCurrencyRates() {
  const { data, error, isLoading } = useSWR("exchange-rates", fetchRates, {
    refreshInterval: 1000 * 60 * 60, // Refresh every hour
    revalidateOnFocus: false,
  });

  const convert = (
    amount: number,
    from: keyof ExchangeRates,
    to: keyof ExchangeRates
  ): number => {
    if (!data) return amount;

    // Convert to USD first, then to target currency
    const inUsd = amount / data[from];
    return inUsd * data[to];
  };

  return {
    rates: data,
    isLoading,
    error,
    convert,
  };
}

// Recurring payment detection utility
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

export interface RecurringPattern {
  description: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "yearly";
  transactions: Transaction[];
  nextExpected?: Date;
}

export function detectRecurringPayments(
  transactions: Transaction[]
): RecurringPattern[] {
  const patterns: Map<string, Transaction[]> = new Map();

  // Group by normalized description
  transactions.forEach((tx) => {
    const normalized = normalizeDescription(tx.description);
    const key = `${normalized}_${Math.floor(tx.amount / 10) * 10}`; // Group by description and approximate amount

    if (!patterns.has(key)) {
      patterns.set(key, []);
    }
    patterns.get(key)!.push(tx);
  });

  const recurring: RecurringPattern[] = [];

  patterns.forEach((txList, key) => {
    // Need at least 2 occurrences to detect pattern
    if (txList.length < 2) return;

    // Sort by date
    const sorted = txList.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate intervals between transactions
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const daysDiff = Math.round(
        (new Date(sorted[i].date).getTime() -
          new Date(sorted[i - 1].date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      intervals.push(daysDiff);
    }

    // Determine frequency
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    let frequency: RecurringPattern["frequency"] | null = null;

    if (avgInterval >= 5 && avgInterval <= 9) {
      frequency = "weekly";
    } else if (avgInterval >= 12 && avgInterval <= 18) {
      frequency = "biweekly";
    } else if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = "monthly";
    } else if (avgInterval >= 350 && avgInterval <= 380) {
      frequency = "yearly";
    }

    if (frequency) {
      const lastTx = sorted[sorted.length - 1];
      const lastDate = new Date(lastTx.date);
      let nextExpected = new Date(lastDate);

      switch (frequency) {
        case "weekly":
          nextExpected.setDate(nextExpected.getDate() + 7);
          break;
        case "biweekly":
          nextExpected.setDate(nextExpected.getDate() + 14);
          break;
        case "monthly":
          nextExpected.setMonth(nextExpected.getMonth() + 1);
          break;
        case "yearly":
          nextExpected.setFullYear(nextExpected.getFullYear() + 1);
          break;
      }

      recurring.push({
        description: lastTx.description,
        amount: lastTx.amount,
        frequency,
        transactions: sorted,
        nextExpected,
      });
    }
  });

  return recurring;
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[0-9]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30);
}

// Budget alert checker
interface Budget {
  categoryId: string;
  categoryLabel: string;
  limitAmount: number;
  alertThreshold: number;
  spent: number;
}

export interface BudgetAlert {
  type: "warning" | "exceeded";
  budget: Budget;
  message: string;
  percentage: number;
}

export function checkBudgetAlerts(budgets: Budget[]): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  budgets.forEach((budget) => {
    const percentage = Math.round((budget.spent / budget.limitAmount) * 100);

    if (percentage >= 100) {
      alerts.push({
        type: "exceeded",
        budget,
        percentage,
        message: `${budget.categoryLabel} bütçesi aşıldı! (%${percentage})`,
      });
    } else if (percentage >= budget.alertThreshold) {
      alerts.push({
        type: "warning",
        budget,
        percentage,
        message: `${budget.categoryLabel} bütçesinin %${percentage}'i kullanıldı`,
      });
    }
  });

  return alerts;
}
