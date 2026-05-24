/**
 * Budgets Service Unit Tests - v3.0
 * Kapsamlı bütçe test suite
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../../prisma.service';
import { CacheService } from '../../shared/cache';
import {
  createMockTransaction,
  createMockPrismaService,
} from '../../../test/test-utils';
import { CreateBudgetDto } from './dto/budget.dto';

// Mock CacheService
const createMockCacheService = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  getOrSet: jest.fn().mockImplementation(async (_key, fetchFn) => fetchFn()),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  invalidateUser: jest.fn().mockResolvedValue(undefined),
  invalidateTransactions: jest.fn().mockResolvedValue(undefined),
  invalidateBudgets: jest.fn().mockResolvedValue(undefined),
  buildKey: jest.fn().mockImplementation((...parts) => parts.join(':')),
  hashQuery: jest.fn().mockReturnValue('hash'),
});

// Mock Logger
const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

describe('BudgetsService', () => {
  let service: BudgetsService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let cache: ReturnType<typeof createMockCacheService>;

  const userId = 'user-test-123';

  // Create a proper mock budget that matches the expected schema
  const mockBudget = {
    id: 'budget-test-123',
    userId: 'user-test-123',
    categoryId: 'food',
    categoryLabel: 'Yiyecek',
    limitAmount: 2000,
    period: 'monthly',
    alertThreshold: 80,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    cache = createMockCacheService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: createMockLogger() },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    jest.clearAllMocks();
  });

  // ============================================
  // FIND ALL TESTS
  // ============================================
  describe('findAll', () => {
    it('should return all active budgets for a user', async () => {
      const budgets = [
        { ...mockBudget, id: 'budget-1', categoryId: 'food' },
        { ...mockBudget, id: 'budget-2', categoryId: 'transport' },
      ];
      prisma.budget.findMany.mockResolvedValue(budgets);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(prisma.budget.findMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        orderBy: { categoryLabel: 'asc' },
      });
    });

    it('should return empty array when no budgets exist', async () => {
      prisma.budget.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });

    it('should use cache for budget list', async () => {
      const budgets = [mockBudget];
      prisma.budget.findMany.mockResolvedValue(budgets);

      await service.findAll(userId);

      expect(cache.getOrSet).toHaveBeenCalled();
      expect(cache.buildKey).toHaveBeenCalled();
    });
  });

  // ============================================
  // FIND ONE TESTS
  // ============================================
  describe('findOne', () => {
    it('should return a budget by id', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);

      const result = await service.findOne(mockBudget.id, userId);

      expect(result.id).toBe(mockBudget.id);
      expect(prisma.budget.findFirst).toHaveBeenCalledWith({
        where: { id: mockBudget.id, userId },
      });
    });

    it('should throw NotFoundException when budget not found', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return budget from another user', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockBudget.id, 'other-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('create', () => {
    const createDto = {
      categoryId: 'entertainment',
      categoryLabel: 'Eğlence',
      limitAmount: 500,
      period: 'monthly' as const,
      alertThreshold: 75,
    };

    it('should create a new budget with valid data', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.budget.create.mockResolvedValue({ ...mockBudget, ...createDto });

      const result = await service.create(userId, createDto);

      expect(result.categoryId).toBe(createDto.categoryId);
      expect(prisma.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          categoryId: createDto.categoryId,
          limitAmount: createDto.limitAmount,
        }),
      });
    });

    it('should throw ConflictException when budget for category exists', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should set default period to monthly', async () => {
      const dtoWithoutPeriod: CreateBudgetDto = {
        categoryId: 'shopping',
        categoryLabel: 'Alışveriş',
        limitAmount: 1000,
      };
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.budget.create.mockResolvedValue({
        ...mockBudget,
        ...dtoWithoutPeriod,
        period: 'monthly',
      });

      await service.create(userId, dtoWithoutPeriod);

      expect(prisma.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          period: 'monthly',
        }),
      });
    });

    it('should set default alertThreshold to 80', async () => {
      const dtoWithoutThreshold: CreateBudgetDto = {
        categoryId: 'shopping',
        categoryLabel: 'Alışveriş',
        limitAmount: 1000,
      };
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.budget.create.mockResolvedValue({
        ...mockBudget,
        ...dtoWithoutThreshold,
        alertThreshold: 80,
      });

      await service.create(userId, dtoWithoutThreshold);

      expect(prisma.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          alertThreshold: 80,
        }),
      });
    });

    it('should invalidate budget caches after creation', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.budget.create.mockResolvedValue({ ...mockBudget, ...createDto });

      await service.create(userId, createDto);

      expect(cache.invalidateBudgets).toHaveBeenCalledWith(userId);
    });
  });

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('update', () => {
    const updateDto = {
      limitAmount: 3000,
      alertThreshold: 90,
    };

    it('should update a budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.budget.update.mockResolvedValue({ ...mockBudget, ...updateDto });

      const result = await service.update(mockBudget.id, userId, updateDto);

      expect(result.limitAmount).toBe(updateDto.limitAmount);
      expect(result.alertThreshold).toBe(updateDto.alertThreshold);
    });

    it('should throw NotFoundException when updating non-existent budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', userId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.budget.update.mockResolvedValue({
        ...mockBudget,
        limitAmount: 5000,
      });

      await service.update(mockBudget.id, userId, { limitAmount: 5000 });

      expect(prisma.budget.update).toHaveBeenCalledWith({
        where: { id: mockBudget.id },
        data: { limitAmount: 5000 },
      });
    });

    it('should invalidate budget caches after update', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.budget.update.mockResolvedValue({ ...mockBudget, ...updateDto });

      await service.update(mockBudget.id, userId, updateDto);

      expect(cache.invalidateBudgets).toHaveBeenCalledWith(userId);
    });
  });

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('delete', () => {
    it('should delete a budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.budget.delete.mockResolvedValue(mockBudget);

      const result = await service.delete(mockBudget.id, userId);

      expect(result).toEqual({ success: true });
      expect(prisma.budget.delete).toHaveBeenCalledWith({
        where: { id: mockBudget.id },
      });
    });

    it('should throw NotFoundException when deleting non-existent budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(service.delete('non-existent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not delete another users budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.delete(mockBudget.id, 'other-user'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.budget.delete).not.toHaveBeenCalled();
    });

    it('should invalidate budget caches after deletion', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.budget.delete.mockResolvedValue(mockBudget);

      await service.delete(mockBudget.id, userId);

      expect(cache.invalidateBudgets).toHaveBeenCalledWith(userId);
    });
  });

  // ============================================
  // GET BUDGET STATUS TESTS
  // ============================================
  describe('getBudgetStatus', () => {
    it('should calculate spending and status correctly', async () => {
      const budget = {
        ...mockBudget,
        limitAmount: 1000,
        alertThreshold: 80,
      };
      const transactions = [
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: 400 }),
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: 300 }),
      ];

      prisma.budget.findMany.mockResolvedValue([budget]);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getBudgetStatus(userId);

      expect(result).toHaveLength(1);
      expect(result[0].spent).toBe(700);
      expect(result[0].remaining).toBe(300);
      expect(result[0].percentage).toBe(70);
      expect(result[0].isOverBudget).toBe(false);
      expect(result[0].isNearLimit).toBe(false);
      expect(result[0].status).toBe('ok');
    });

    it('should detect near limit status', async () => {
      const budget = {
        ...mockBudget,
        limitAmount: 1000,
        alertThreshold: 80,
      };
      const transactions = [
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: 850 }),
      ];

      prisma.budget.findMany.mockResolvedValue([budget]);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getBudgetStatus(userId);

      expect(result[0].isNearLimit).toBe(true);
      expect(result[0].status).toBe('warning');
    });

    it('should calculate spent from normalized negative expense amounts', async () => {
      const budget = {
        ...mockBudget,
        limitAmount: 1000,
        alertThreshold: 80,
      };
      const transactions = [
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: -450 }),
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: -350 }),
      ];

      prisma.budget.findMany.mockResolvedValue([budget]);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getBudgetStatus(userId);

      expect(result[0].spent).toBe(800);
      expect(result[0].remaining).toBe(200);
      expect(result[0].percentage).toBe(80);
      expect(result[0].status).toBe('warning');
    });

    it('should detect over budget status', async () => {
      const budget = {
        ...mockBudget,
        limitAmount: 1000,
        alertThreshold: 80,
      };
      const transactions = [
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: 1200 }),
      ];

      prisma.budget.findMany.mockResolvedValue([budget]);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getBudgetStatus(userId);

      expect(result[0].isOverBudget).toBe(true);
      expect(result[0].status).toBe('over');
      expect(result[0].percentage).toBe(100); // Capped at 100
    });

    it('should return zero spent when no transactions', async () => {
      prisma.budget.findMany.mockResolvedValue([mockBudget]);
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.getBudgetStatus(userId);

      expect(result[0].spent).toBe(0);
      expect(result[0].remaining).toBe(mockBudget.limitAmount);
    });

    it('should only count expense transactions', async () => {
      const transactions = [
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: 500 }),
        createMockTransaction({ type: 'income', categoryId: 'food', amount: 1000 }),
      ];

      prisma.budget.findMany.mockResolvedValue([mockBudget]);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      await service.getBudgetStatus(userId);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'expense',
          }),
        }),
      );
    });

    it('should filter transactions by current month', async () => {
      prisma.budget.findMany.mockResolvedValue([mockBudget]);
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.getBudgetStatus(userId);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should use cache for budget status', async () => {
      prisma.budget.findMany.mockResolvedValue([mockBudget]);
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.getBudgetStatus(userId);

      expect(cache.getOrSet).toHaveBeenCalled();
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle very large limit amounts', async () => {
      const largeBudget = { ...mockBudget, limitAmount: 999999999 };
      prisma.budget.findFirst.mockResolvedValue(largeBudget);

      const result = await service.findOne(largeBudget.id, userId);

      expect(result.limitAmount).toBe(999999999);
    });

    it('should handle zero limit amount', async () => {
      const zeroBudget = { ...mockBudget, limitAmount: 0 };
      const transactions = [
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: 100 }),
      ];

      prisma.budget.findMany.mockResolvedValue([zeroBudget]);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getBudgetStatus(userId);

      expect(result[0].isOverBudget).toBe(true);
    });

    it('should handle database errors', async () => {
      prisma.budget.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(userId)).rejects.toThrow('Database error');
    });

    it('should handle multiple budgets for status calculation', async () => {
      const budgets = [
        { ...mockBudget, id: 'b1', categoryId: 'food', limitAmount: 1000 },
        { ...mockBudget, id: 'b2', categoryId: 'transport', limitAmount: 500 },
      ];
      const transactions = [
        createMockTransaction({ type: 'expense', categoryId: 'food', amount: 600 }),
        createMockTransaction({ type: 'expense', categoryId: 'transport', amount: 200 }),
      ];

      prisma.budget.findMany.mockResolvedValue(budgets);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getBudgetStatus(userId);

      expect(result).toHaveLength(2);
      expect(result.find(b => b.categoryId === 'food')?.spent).toBe(600);
      expect(result.find(b => b.categoryId === 'transport')?.spent).toBe(200);
    });
  });
});
