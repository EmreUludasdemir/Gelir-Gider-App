import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RedisService } from '../../redis.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { CacheService, CachePrefix, CacheTTL } from '../../shared/cache';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger as LoggerService } from 'winston';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private redis: RedisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async findAll(userId: string) {
    const cacheKey = this.cache.buildKey(CachePrefix.BUDGET, userId, 'list');
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.budget.findMany({
          where: { userId, isActive: true },
          orderBy: { categoryLabel: 'asc' },
        });
      },
      CacheTTL.MEDIUM,
    );
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

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        categoryLabel: dto.categoryLabel,
        limitAmount: dto.limitAmount,
        period: dto.period || 'monthly',
        alertThreshold: dto.alertThreshold || 80,
      },
    });

    // Invalidate budget caches
    await this.cache.invalidateBudgets(userId);
    await this.invalidateAnalyticsCaches(userId);
    this.logger.debug(`Budget created, cache invalidated for user ${userId}`, {
      context: 'BudgetsService',
    });

    return budget;
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    await this.findOne(id, userId);

    const budget = await this.prisma.budget.update({
      where: { id },
      data: dto,
    });

    // Invalidate budget caches
    await this.cache.invalidateBudgets(userId);
    await this.invalidateAnalyticsCaches(userId);
    this.logger.debug(`Budget updated, cache invalidated for user ${userId}`, {
      context: 'BudgetsService',
    });

    return budget;
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.budget.delete({
      where: { id },
    });

    // Invalidate budget caches
    await this.cache.invalidateBudgets(userId);
    await this.invalidateAnalyticsCaches(userId);
    this.logger.debug(`Budget deleted, cache invalidated for user ${userId}`, {
      context: 'BudgetsService',
    });

    return { success: true };
  }

  async getBudgetStatus(userId: string) {
    const cacheKey = this.cache.buildKey(CachePrefix.BUDGET, userId, 'status');
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
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
          spendingByCategory[t.categoryId] = (spendingByCategory[t.categoryId] || 0) + Math.abs(t.amount);
        });

        // Map budgets with spending status
        return budgets.map((budget) => {
          const spent = spendingByCategory[budget.categoryId] || 0;
          const percentage = budget.limitAmount > 0 ? Math.round((spent / budget.limitAmount) * 100) : spent > 0 ? 100 : 0;
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
      },
      CacheTTL.SHORT, // 1 minute TTL - budget status changes with transactions
    );
  }

  private async invalidateAnalyticsCaches(userId: string) {
    await this.redis.del(`analytics:action-feed:${userId}`);
  }
}
