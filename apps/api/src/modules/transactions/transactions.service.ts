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
import { classifyTransaction } from '../../shared/categories';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(userId: string, query?: TransactionQuery): Promise<TransactionEntity[]> {
    const where: Prisma.TransactionWhereInput = { userId };

    if (query) {
      if (query.type) where.type = query.type;
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.source) where.source = query.source;
      if (query.dateFrom) where.date = { ...where.date as any, gte: new Date(query.dateFrom) };
      if (query.dateTo) where.date = { ...where.date as any, lte: new Date(query.dateTo) };

      // Amount filter logic might need adjustment if amount is negative for expenses
      // For now assuming filtering absolute amounts or raw amounts
      // If client sends positive minAmount, we might check abs(amount)
      // Prisma filter on calculated field is hard, so direct filter:
      if (query.minAmount !== undefined) {
        // This simple filter might fail for expenses (negative numbers) if not handled carefully
        // For now simpler:
        // where.amount = { gte: query.minAmount }; 
        // Better: client should handle sign or we filter in memory?
        // Let's filter in memory for complex amount logic if needed, or assume backend stores signed values
      }

      if (query.search) {
        where.OR = [
          { description: { contains: query.search } },
          { categoryLabel: { contains: query.search } },
        ];
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: query?.sortBy ? { [query.sortBy]: query.sortOrder || 'desc' } : { date: 'desc' },
      take: query?.limit,
      skip: query?.offset,
    });

    return transactions.map(this.mapToEntity);
  }

  async findOne(userId: string, id: string): Promise<TransactionEntity> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return this.mapToEntity(transaction);
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionEntity> {
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

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        accountId: 'default', // TODO: Add account support
        date: new Date(dto.date),
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || 'TRY',
        source: 'manual',
        type: dto.type,
        categoryId: categoryId!,
        categoryLabel: categoryLabel!,
        confidence,
        tags: JSON.stringify(dto.tags || []),
        notes: dto.notes,
      },
    });

    return this.mapToEntity(transaction);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<TransactionEntity> {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const data: Prisma.TransactionUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.categoryLabel !== undefined) data.categoryLabel = dto.categoryLabel;
    if (dto.tags !== undefined) data.tags = JSON.stringify(dto.tags);
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.transaction.update({
      where: { id },
      data,
    });

    return this.mapToEntity(updated);
  }

  async delete(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }

  async getSummary(userId: string, query?: TransactionQuery): Promise<DashboardSummary> {
    const now = new Date();
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();

    // Allow month/year selection from query
    if (query?.dateFrom) {
      const queryDate = new Date(query.dateFrom);
      currentMonth = queryDate.getMonth();
      currentYear = queryDate.getFullYear();
    }

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Fetch current and previous month transactions
    const [currentTransactions, prevTransactions] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      this.prisma.transaction.findMany({
        where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
    ]);

    // Calculate totals
    const totals = {
      income: 0,
      expense: 0,
      balance: 0,
      transactionCount: currentTransactions.length,
    };

    currentTransactions.forEach(tx => {
      if (tx.type === 'income') totals.income += Math.abs(tx.amount);
      else totals.expense += Math.abs(tx.amount);
    });

    totals.balance = totals.income - totals.expense;

    // Previous month totals
    const prevTotals = { income: 0, expense: 0 };
    prevTransactions.forEach(tx => {
      if (tx.type === 'income') prevTotals.income += Math.abs(tx.amount);
      else prevTotals.expense += Math.abs(tx.amount);
    });

    // Comparison
    const comparison = {
      previousMonth: prevTotals,
      changePercentage: {
        income: prevTotals.income > 0 ? ((totals.income - prevTotals.income) / prevTotals.income) * 100 : 0,
        expense: prevTotals.expense > 0 ? ((totals.expense - prevTotals.expense) / prevTotals.expense) * 100 : 0,
      },
    };

    // Top categories (Expense)
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
        trend: 'stable' as const,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Weekly trend
    const weeklyTrend: WeeklyData[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekTransactions = await this.prisma.transaction.findMany({
        where: { userId, date: { gte: weekStart, lte: weekEnd } },
      });

      let weekIncome = 0, weekExpense = 0;
      weekTransactions.forEach(tx => {
        if (tx.type === 'income') weekIncome += Math.abs(tx.amount);
        else weekExpense += Math.abs(tx.amount);
      });

      weeklyTrend.push({
        week: `Week ${4 - i}`,
        income: weekIncome,
        expense: weekExpense,
      });
    }

    return {
      period: {
        month: now.toLocaleString('tr-TR', { month: 'long' }),
        year: currentYear,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      },
      totals,
      comparison,
      topCategories,
      weeklyTrend,
      recurringPayments: await this.getRecurringPayments(userId),
    };
  }

  async getSuggestions(userId: string): Promise<Suggestion[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, confidence: { lt: 60 } },
      take: 10,
    });

    return transactions.map(tx => ({
      id: uuidv4(),
      transactionId: tx.id,
      description: tx.description,
      amount: tx.amount,
      currency: tx.currency as any,
      currentCategory: tx.categoryLabel,
      suggestedCategories: [{ categoryId: 'other', categoryLabel: 'Diğer', confidence: 30 }],
      createdAt: new Date().toISOString(),
    }));
  }

  async getRecurringPayments(userId: string): Promise<RecurringPayment[]> {
    // Simplified logic: fetch all, group by description in memory
    // Proper DB way: groupBy description, having count > 1 (Prisma supports basic groupBy)

    const transactions = await this.prisma.transaction.findMany({ where: { userId } });
    const recurringMap = new Map<string, any[]>();

    transactions.forEach(tx => {
      const key = tx.description.toLowerCase().trim();
      const existing = recurringMap.get(key) || [];
      existing.push(tx);
      recurringMap.set(key, existing);
    });

    const recurring: RecurringPayment[] = [];
    recurringMap.forEach((txs, key) => {
      if (txs.length >= 2) {
        const latest = txs.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
        const nextDate = new Date(latest.date);
        nextDate.setMonth(nextDate.getMonth() + 1);

        recurring.push({
          id: uuidv4(),
          description: latest.description,
          amount: Math.abs(latest.amount),
          currency: latest.currency as any,
          frequency: 'monthly',
          categoryLabel: latest.categoryLabel,
          lastDate: latest.date.toISOString(),
          nextDate: nextDate.toISOString(),
          isActive: true,
        });
      }
    });

    return recurring.slice(0, 5);
  }

  private mapToEntity(prismaTx: any): TransactionEntity {
    return {
      ...prismaTx,
      date: prismaTx.date.toISOString(),
      tags: JSON.parse(prismaTx.tags || '[]'),
      createdAt: prismaTx.createdAt.toISOString(),
      updatedAt: prismaTx.updatedAt.toISOString(),
      source: prismaTx.source as any,
      type: prismaTx.type as any,
      currency: prismaTx.currency as any,
    };
  }
}
