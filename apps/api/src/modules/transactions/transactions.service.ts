import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  TransactionEntity,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQuery,
  DashboardSummary,
  Suggestion,
  RecurringPayment,
  CategorySummary,
  WeeklyData,
} from '../../shared/types';
import { TransactionStorageService } from '../../shared/transaction-storage.service';
import { classifyTransaction } from '../../shared/categories';

@Injectable()
export class TransactionsService {
  constructor(private readonly storage: TransactionStorageService) {}

  findAll(query?: TransactionQuery): TransactionEntity[] {
    return this.storage.findAll(query);
  }

  findOne(id: string): TransactionEntity {
    const transaction = this.storage.findOne(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  create(dto: CreateTransactionDto): TransactionEntity {
    const now = new Date().toISOString();

    // Auto-classify if category not provided
    let categoryId = dto.categoryId;
    let categoryLabel = dto.categoryLabel;
    let confidence = 100;

    if (!categoryId || !categoryLabel) {
      const classification = classifyTransaction(dto.description);
      categoryId = classification.categoryId;
      categoryLabel = classification.categoryLabel;
      confidence = classification.confidence;
    }

    const transaction: TransactionEntity = {
      id: uuidv4(),
      userId: 'demo-user',
      accountId: 'manual-account',
      date: dto.date,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency || 'TRY',
      source: 'manual',
      type: dto.type,
      categoryId,
      categoryLabel,
      confidence,
      tags: dto.tags || [],
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };

    return this.storage.create(transaction);
  }

  update(id: string, dto: UpdateTransactionDto): TransactionEntity {
    const existing = this.findOne(id);

    const updates: Partial<TransactionEntity> = {};

    if (dto.description !== undefined) {
      updates.description = dto.description;
    }

    if (dto.amount !== undefined) {
      updates.amount = dto.amount;
    }

    if (dto.categoryId !== undefined) {
      updates.categoryId = dto.categoryId;
    }

    if (dto.categoryLabel !== undefined) {
      updates.categoryLabel = dto.categoryLabel;
    }

    if (dto.tags !== undefined) {
      updates.tags = dto.tags;
    }

    if (dto.notes !== undefined) {
      updates.notes = dto.notes;
    }

    const updated = this.storage.update(id, updates);
    if (!updated) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return updated;
  }

  delete(id: string): { success: boolean } {
    const deleted = this.storage.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return { success: true };
  }

  getSummary(): DashboardSummary {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get current month transactions
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

    const currentTransactions = this.storage.findAll({
      dateFrom: startOfMonth,
      dateTo: endOfMonth,
    });

    // Get previous month transactions
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

    const prevTransactions = this.storage.findAll({
      dateFrom: prevMonthStart,
      dateTo: prevMonthEnd,
    });

    // Calculate totals
    const totals = {
      income: 0,
      expense: 0,
      balance: 0,
      transactionCount: currentTransactions.length,
    };

    currentTransactions.forEach(tx => {
      if (tx.type === 'income') {
        totals.income += Math.abs(tx.amount);
      } else {
        totals.expense += Math.abs(tx.amount);
      }
    });

    totals.balance = totals.income - totals.expense;

    // Previous month totals
    const prevTotals = {
      income: 0,
      expense: 0,
    };

    prevTransactions.forEach(tx => {
      if (tx.type === 'income') {
        prevTotals.income += Math.abs(tx.amount);
      } else {
        prevTotals.expense += Math.abs(tx.amount);
      }
    });

    // Calculate change percentage
    const comparison = {
      previousMonth: prevTotals,
      changePercentage: {
        income: prevTotals.income > 0
          ? ((totals.income - prevTotals.income) / prevTotals.income) * 100
          : 0,
        expense: prevTotals.expense > 0
          ? ((totals.expense - prevTotals.expense) / prevTotals.expense) * 100
          : 0,
      },
    };

    // Top categories
    const categoryMap = new Map<string, { total: number; count: number; label: string }>();

    currentTransactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const existing = categoryMap.get(tx.categoryId) || { total: 0, count: 0, label: tx.categoryLabel };
        existing.total += Math.abs(tx.amount);
        existing.count += 1;
        categoryMap.set(tx.categoryId, existing);
      });

    const topCategories: CategorySummary[] = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryLabel: data.label,
        total: data.total,
        percentage: totals.expense > 0 ? (data.total / totals.expense) * 100 : 0,
        transactionCount: data.count,
        trend: 'stable' as 'up' | 'down' | 'stable', // Simplified for demo
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Weekly trend (last 4 weeks)
    const weeklyTrend: WeeklyData[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekTransactions = this.storage.findAll({
        dateFrom: weekStart.toISOString(),
        dateTo: weekEnd.toISOString(),
      });

      let weekIncome = 0;
      let weekExpense = 0;

      weekTransactions.forEach(tx => {
        if (tx.type === 'income') {
          weekIncome += Math.abs(tx.amount);
        } else {
          weekExpense += Math.abs(tx.amount);
        }
      });

      weeklyTrend.push({
        week: `Week ${4 - i}`,
        income: weekIncome,
        expense: weekExpense,
      });
    }

    // Recurring payments (simplified - same amount/description pattern)
    const recurringPayments: RecurringPayment[] = this.findRecurringPayments();

    return {
      period: {
        month: now.toLocaleString('tr-TR', { month: 'long' }),
        year: currentYear,
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
      totals,
      comparison,
      topCategories,
      weeklyTrend,
      recurringPayments,
    };
  }

  getSuggestions(): Suggestion[] {
    const transactions = this.storage.findAll();
    const suggestions: Suggestion[] = [];

    // Find transactions with low confidence (< 60)
    transactions
      .filter(tx => tx.confidence < 60)
      .forEach(tx => {
        suggestions.push({
          id: uuidv4(),
          transactionId: tx.id,
          description: tx.description,
          amount: tx.amount,
          currency: tx.currency,
          currentCategory: tx.categoryLabel,
          suggestedCategories: [
            { categoryId: 'other', categoryLabel: 'Diğer', confidence: 30 },
          ],
          createdAt: new Date().toISOString(),
        });
      });

    return suggestions.slice(0, 10);
  }

  getRecurringPayments(): RecurringPayment[] {
    const transactions = this.storage.findAll();
    const recurringMap = new Map<string, TransactionEntity[]>();

    // Group by similar descriptions
    transactions.forEach(tx => {
      const key = tx.description.toLowerCase().trim();
      const existing = recurringMap.get(key) || [];
      existing.push(tx);
      recurringMap.set(key, existing);
    });

    const recurring: RecurringPayment[] = [];

    // Find patterns (2+ occurrences)
    recurringMap.forEach((txs, key) => {
      if (txs.length >= 2) {
        const latest = txs.sort((a, b) => b.date.localeCompare(a.date))[0];
        const nextDate = new Date(latest.date);
        nextDate.setMonth(nextDate.getMonth() + 1);

        recurring.push({
          id: uuidv4(),
          description: latest.description,
          amount: Math.abs(latest.amount),
          currency: latest.currency,
          frequency: 'monthly',
          categoryLabel: latest.categoryLabel,
          lastDate: latest.date,
          nextDate: nextDate.toISOString(),
          isActive: true,
        });
      }
    });

    return recurring.slice(0, 5);
  }

  private findRecurringPayments(): RecurringPayment[] {
    return this.getRecurringPayments();
  }
}
