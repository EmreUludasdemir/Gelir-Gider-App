import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateBudgetDto {
  categoryId: string;
  categoryLabel: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  alertThreshold?: number;
}

export interface UpdateBudgetDto {
  amount?: number;
  alertThreshold?: number;
  isActive?: boolean;
}

export interface BudgetWithSpending {
  id: string;
  categoryId: string;
  categoryLabel: string;
  amount: number;
  period: string;
  startDate: string;
  endDate: string | null;
  alertThreshold: number;
  isActive: boolean;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'normal' | 'warning' | 'exceeded';
}

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    // Check if budget already exists for this category/period
    const existing = await this.prisma.budget.findUnique({
      where: {
        userId_categoryId_period: {
          userId,
          categoryId: dto.categoryId,
          period: dto.period,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Bu kategori için ${dto.period} bütçe zaten mevcut`
      );
    }

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        categoryLabel: dto.categoryLabel,
        amount: dto.amount,
        period: dto.period,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        alertThreshold: dto.alertThreshold || 80,
        isActive: true,
      },
    });

    return this.getBudgetWithSpending(userId, budget.id);
  }

  async findAll(userId: string, isActive?: boolean): Promise<BudgetWithSpending[]> {
    const where: Prisma.BudgetWhereInput = { userId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      budgets.map((budget) => this.getBudgetWithSpending(userId, budget.id))
    );
  }

  async findOne(userId: string, id: string): Promise<BudgetWithSpending> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException('Bütçe bulunamadı');
    }

    return this.getBudgetWithSpending(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException('Bütçe bulunamadı');
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: dto,
    });

    return this.getBudgetWithSpending(userId, updated.id);
  }

  async delete(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException('Bütçe bulunamadı');
    }

    await this.prisma.budget.delete({ where: { id } });

    return { success: true, message: 'Bütçe silindi' };
  }

  async checkAlerts(userId: string): Promise<any[]> {
    const budgets = await this.findAll(userId, true);

    const alerts = budgets
      .filter((budget) => {
        const percentage = budget.percentage;
        return (
          percentage >= budget.alertThreshold &&
          budget.status !== 'normal'
        );
      })
      .map((budget) => ({
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryLabel: budget.categoryLabel,
        percentage: budget.percentage,
        status: budget.status,
        spent: budget.spent,
        amount: budget.amount,
        remaining: budget.remaining,
        message:
          budget.status === 'exceeded'
            ? `${budget.categoryLabel} bütçesi aşıldı!`
            : `${budget.categoryLabel} bütçesi %${budget.alertThreshold} limitine ulaştı`,
      }));

    return alerts;
  }

  private async getBudgetWithSpending(
    userId: string,
    budgetId: string
  ): Promise<BudgetWithSpending> {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Bütçe bulunamadı');
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date(budget.startDate);
    let endDate = budget.endDate ? new Date(budget.endDate) : null;

    // Auto-calculate period end date if not set
    if (!endDate) {
      endDate = new Date(startDate);
      switch (budget.period) {
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
    }

    // Calculate spent amount
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    const spent = Math.abs(
      transactions.reduce((sum, tx) => sum + tx.amount, 0)
    );

    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    let status: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= budget.alertThreshold) {
      status = 'warning';
    }

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryLabel: budget.categoryLabel,
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate.toISOString(),
      endDate: endDate.toISOString(),
      alertThreshold: budget.alertThreshold,
      isActive: budget.isActive,
      spent,
      remaining,
      percentage: Math.min(100, percentage),
      status,
    };
  }

  async getSummary(userId: string) {
    const budgets = await this.findAll(userId, true);

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);

    const exceededCount = budgets.filter((b) => b.status === 'exceeded').length;
    const warningCount = budgets.filter((b) => b.status === 'warning').length;
    const normalCount = budgets.filter((b) => b.status === 'normal').length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      budgetCount: budgets.length,
      exceededCount,
      warningCount,
      normalCount,
      budgets: budgets.slice(0, 5), // Top 5 budgets
    };
  }
}
