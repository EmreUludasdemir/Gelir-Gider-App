import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId, isActive: true },
      orderBy: { categoryLabel: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async create(userId: string, dto: CreateBudgetDto) {
    // Check if budget for this category already exists
    const existing = await this.prisma.budget.findFirst({
      where: { userId, categoryId: dto.categoryId },
    });

    if (existing) {
      throw new ConflictException('Budget for this category already exists');
    }

    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        categoryLabel: dto.categoryLabel,
        limitAmount: dto.limitAmount,
        period: dto.period || 'monthly',
        alertThreshold: dto.alertThreshold || 80,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    await this.findOne(id, userId);

    return this.prisma.budget.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.budget.delete({
      where: { id },
    });

    return { success: true };
  }

  async getBudgetStatus(userId: string) {
    const budgets = await this.findAll(userId);
    
    // Get current period dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get spending per category for this month
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Calculate spending per category
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      spendingByCategory[t.categoryId] = (spendingByCategory[t.categoryId] || 0) + t.amount;
    });

    // Map budgets with spending status
    return budgets.map((budget) => {
      const spent = spendingByCategory[budget.categoryId] || 0;
      const percentage = Math.round((spent / budget.limitAmount) * 100);
      const isOverBudget = spent > budget.limitAmount;
      const isNearLimit = percentage >= budget.alertThreshold;

      return {
        ...budget,
        spent,
        remaining: Math.max(0, budget.limitAmount - spent),
        percentage: Math.min(percentage, 100),
        isOverBudget,
        isNearLimit,
        status: isOverBudget ? 'over' : isNearLimit ? 'warning' : 'ok',
      };
    });
  }
}
