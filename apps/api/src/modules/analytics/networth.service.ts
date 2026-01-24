import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

interface AssetItem {
  id: string;
  name: string;
  type: 'savings_goal' | 'receivable';
  amount: number;
  currency: string;
  icon?: string;
}

interface LiabilityItem {
  id: string;
  name: string;
  type: 'debt' | 'bill';
  amount: number;
  currency: string;
  dueDate?: string;
}

interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
  assets: {
    savingsGoals: number;
    receivables: number;
    items: AssetItem[];
  };
  liabilities: {
    debts: number;
    unpaidBills: number;
    items: LiabilityItem[];
  };
  history: {
    date: string;
    netWorth: number;
  }[];
  change: {
    amount: number;
    percentage: number;
    period: string;
  };
}

@Injectable()
export class NetWorthService {
  private readonly logger = new Logger(NetWorthService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate user's net worth
   */
  async getNetWorth(userId: string, language: 'tr' | 'en' = 'tr'): Promise<NetWorthSummary> {
    const [savingsGoals, debts, unpaidBills] = await Promise.all([
      this.getSavingsGoals(userId),
      this.getDebts(userId),
      this.getUnpaidBills(userId),
    ]);

    // Calculate assets
    const savingsTotal = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const receivablesTotal = debts
      .filter((d) => d.type === 'owed_to_me' && !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0);
    const totalAssets = savingsTotal + receivablesTotal;

    // Calculate liabilities
    const debtsTotal = debts
      .filter((d) => d.type === 'i_owe' && !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0);
    const billsTotal = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
    const totalLiabilities = debtsTotal + billsTotal;

    // Calculate net worth
    const netWorth = totalAssets - totalLiabilities;

    // Build asset items
    const assetItems: AssetItem[] = [
      ...savingsGoals.map((g) => ({
        id: g.id,
        name: g.name,
        type: 'savings_goal' as const,
        amount: g.currentAmount,
        currency: 'TRY',
        icon: g.icon,
      })),
      ...debts
        .filter((d) => d.type === 'owed_to_me' && !d.isPaid)
        .map((d) => ({
          id: d.id,
          name: d.personName,
          type: 'receivable' as const,
          amount: d.amount,
          currency: d.currency,
        })),
    ];

    // Build liability items
    const liabilityItems: LiabilityItem[] = [
      ...debts
        .filter((d) => d.type === 'i_owe' && !d.isPaid)
        .map((d) => ({
          id: d.id,
          name: d.personName,
          type: 'debt' as const,
          amount: d.amount,
          currency: d.currency,
          dueDate: d.dueDate?.toISOString().split('T')[0],
        })),
      ...unpaidBills.map((b) => ({
        id: b.id,
        name: b.name,
        type: 'bill' as const,
        amount: b.amount,
        currency: 'TRY',
        dueDate: b.dueDate.toISOString().split('T')[0],
      })),
    ];

    // Get historical data (simple approximation from transactions)
    const history = await this.getNetWorthHistory(userId);

    // Calculate change from last month
    const change = this.calculateChange(history, netWorth);

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      currency: 'TRY',
      assets: {
        savingsGoals: savingsTotal,
        receivables: receivablesTotal,
        items: assetItems.sort((a, b) => b.amount - a.amount),
      },
      liabilities: {
        debts: debtsTotal,
        unpaidBills: billsTotal,
        items: liabilityItems.sort((a, b) => b.amount - a.amount),
      },
      history,
      change,
    };
  }

  private async getSavingsGoals(userId: string) {
    return this.prisma.savingsGoal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        currentAmount: true,
        icon: true,
      },
    });
  }

  private async getDebts(userId: string) {
    return this.prisma.debt.findMany({
      where: { userId },
      select: {
        id: true,
        personName: true,
        amount: true,
        currency: true,
        type: true,
        isPaid: true,
        dueDate: true,
      },
    });
  }

  private async getUnpaidBills(userId: string) {
    const now = new Date();
    return this.prisma.bill.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }, // Next 30 days
      },
      select: {
        id: true,
        name: true,
        amount: true,
        dueDate: true,
      },
    });
  }

  private async getNetWorthHistory(userId: string) {
    // Generate monthly net worth history from transactions
    const history: { date: string; netWorth: number }[] = [];
    const now = new Date();

    // Get last 6 months of transaction summaries
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { lte: monthEnd },
        },
        select: {
          amount: true,
          type: true,
        },
      });

      // Simple calculation: sum of all transactions up to that month
      const netWorth = transactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - Math.abs(t.amount);
      }, 0);

      history.push({
        date: monthStart.toISOString().split('T')[0],
        netWorth: Math.round(netWorth * 100) / 100,
      });
    }

    return history;
  }

  private calculateChange(
    history: { date: string; netWorth: number }[],
    currentNetWorth: number,
  ) {
    if (history.length < 2) {
      return { amount: 0, percentage: 0, period: 'son ay' };
    }

    const lastMonth = history[history.length - 2]?.netWorth || 0;
    const amount = currentNetWorth - lastMonth;
    const percentage =
      lastMonth !== 0 ? Math.round((amount / Math.abs(lastMonth)) * 100) : 0;

    return {
      amount: Math.round(amount * 100) / 100,
      percentage,
      period: 'son ay',
    };
  }
}
