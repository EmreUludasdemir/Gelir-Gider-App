/**
 * Transactions Service Unit Tests - FAZ 3
 * Kapsamlı transaction test suite
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma.service';
import { CacheService } from '../../shared/cache';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AutoCategorizerService } from '../ai/auto-categorizer.service';
import {
  createMockTransaction,
  createMockPrismaService,
} from '../../../test/test-utils';

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
  getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0, hitRate: 0, totalOperations: 0, avgResponseTime: 0, isConnected: false }),
});

// Mock Logger
const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

// Mock RealtimeGateway
const createMockRealtimeGateway = () => ({
  notifyNewTransaction: jest.fn(),
  notifyTransactionUpdated: jest.fn(),
  notifyTransactionDeleted: jest.fn(),
  notifyBudgetAlert: jest.fn(),
  notifyBudgetUpdated: jest.fn(),
});

// Mock AutoCategorizerService
const createMockAutoCategorizer = () => ({
  categorize: jest.fn().mockResolvedValue({
    categoryId: 'other',
    categoryLabel: 'Other',
    confidence: 10,
  }),
});

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let cache: ReturnType<typeof createMockCacheService>;
  let realtime: ReturnType<typeof createMockRealtimeGateway>;
  let autoCategorizer: ReturnType<typeof createMockAutoCategorizer>;

  const userId = 'user-test-123';
  const mockTransaction = createMockTransaction();

  beforeEach(async () => {
    prisma = createMockPrismaService();
    cache = createMockCacheService();
    realtime = createMockRealtimeGateway();
    autoCategorizer = createMockAutoCategorizer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: RealtimeGateway, useValue: realtime },
        { provide: AutoCategorizerService, useValue: autoCategorizer },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: createMockLogger() },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);

    jest.clearAllMocks();
  });

  // ============================================
  // FIND ALL TESTS
  // ============================================
  describe('findAll', () => {
    it('should return all transactions for a user', async () => {
      const transactions = [
        createMockTransaction({ id: 'txn-1', description: 'Transaction 1' }),
        createMockTransaction({ id: 'txn-2', description: 'Transaction 2' }),
      ];
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
    });

    it('should filter by type', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.findAll(userId, { type: 'income' });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, type: 'income' },
        }),
      );
    });

    it('should filter by categoryId', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.findAll(userId, { categoryId: 'food' });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, categoryId: 'food' },
        }),
      );
    });

    it('should filter by date range', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.findAll(userId, { dateFrom, dateTo });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should search by description or categoryLabel', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.findAll(userId, { search: 'market' });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { description: { contains: 'market' } },
              { categoryLabel: { contains: 'market' } },
            ]),
          }),
        }),
      );
    });

    it('should apply pagination', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.findAll(userId, { limit: 10, offset: 20 });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        }),
      );
    });

    it('should apply sorting', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.findAll(userId, { sortBy: 'amount', sortOrder: 'asc' });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { amount: 'asc' },
        }),
      );
    });

    it('should return empty array when no transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // FIND ONE TESTS
  // ============================================
  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.findOne(userId, mockTransaction.id);

      expect(result.id).toBe(mockTransaction.id);
      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: mockTransaction.id, userId },
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return transaction from another user', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('other-user', mockTransaction.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('create', () => {
    const createDto = {
      date: '2024-01-15',
      description: 'Grocery shopping',
      amount: 150.50,
      type: 'expense' as const,
      categoryId: 'food',
      categoryLabel: 'Yiyecek & İçecek',
    };

    it('should create a new transaction', async () => {
      prisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        ...createDto,
        date: new Date(createDto.date),
      });

      const result = await service.create(userId, createDto);

      expect(result).toBeDefined();
      expect(result.description).toBe(createDto.description);
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            description: createDto.description,
            amount: createDto.amount,
            type: createDto.type,
          }),
        }),
      );
    });

    it('should auto-classify transaction when category not provided', async () => {
      const dtoWithoutCategory = {
        date: '2024-01-15',
        description: 'Migros Market',
        amount: 200,
        type: 'expense' as const,
      };
      prisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        categoryId: 'food',
        categoryLabel: 'Yiyecek & İçecek',
      });

      const result = await service.create(userId, dtoWithoutCategory);

      expect(result).toBeDefined();
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it('should set default currency to TRY', async () => {
      prisma.transaction.create.mockResolvedValue(mockTransaction);

      await service.create(userId, createDto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'TRY',
          }),
        }),
      );
    });

    it('should set source as manual', async () => {
      prisma.transaction.create.mockResolvedValue(mockTransaction);

      await service.create(userId, createDto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'manual',
          }),
        }),
      );
    });

    it('should handle tags correctly', async () => {
      const dtoWithTags = { ...createDto, tags: ['market', 'haftalık'] };
      prisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        tags: JSON.stringify(['market', 'haftalık']),
      });

      await service.create(userId, dtoWithTags);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: JSON.stringify(['market', 'haftalık']),
          }),
        }),
      );
    });
  });

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('update', () => {
    const updateDto = {
      description: 'Updated description',
      amount: 200,
    };

    it('should update a transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        ...updateDto,
      });

      const result = await service.update(userId, mockTransaction.id, updateDto);

      expect(result.description).toBe(updateDto.description);
      expect(result.amount).toBe(updateDto.amount);
    });

    it('should throw NotFoundException when updating non-existent transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        description: 'New description',
      });

      await service.update(userId, mockTransaction.id, { description: 'New description' });

      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        data: { description: 'New description' },
      });
    });

    it('should update tags correctly', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        tags: JSON.stringify(['new-tag']),
      });

      await service.update(userId, mockTransaction.id, { tags: ['new-tag'] });

      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: JSON.stringify(['new-tag']),
          }),
        }),
      );
    });
  });

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('delete', () => {
    it('should delete a transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.transaction.delete.mockResolvedValue(mockTransaction);

      const result = await service.delete(userId, mockTransaction.id);

      expect(result).toEqual({ success: true });
      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
      });
    });

    it('should throw NotFoundException when deleting non-existent transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.delete(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not delete another users transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.delete('other-user', mockTransaction.id),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.transaction.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // GET SUMMARY TESTS
  // ============================================
  describe('getSummary', () => {
    const incomeTransaction = createMockTransaction({
      id: 'income-1',
      type: 'income',
      amount: 5000,
    });
    const expenseTransaction = createMockTransaction({
      id: 'expense-1',
      type: 'expense',
      amount: 1000,
    });

    it('should calculate correct totals', async () => {
      // Current month, previous month, 4 weeks
      prisma.transaction.findMany.mockResolvedValue([incomeTransaction, expenseTransaction]);

      const result = await service.getSummary(userId);

      expect(result.totals.income).toBe(5000);
      expect(result.totals.expense).toBe(1000);
      expect(result.totals.balance).toBe(4000);
      expect(result.totals.transactionCount).toBe(2);
    });

    it('should return comparison with previous month', async () => {
      prisma.transaction.findMany.mockResolvedValue([incomeTransaction]);

      const result = await service.getSummary(userId);

      expect(result.comparison).toBeDefined();
      expect(result.comparison.previousMonth).toBeDefined();
    });

    it('should return top expense categories', async () => {
      const foodExpense = createMockTransaction({ type: 'expense', categoryId: 'food', amount: 500 });
      const transportExpense = createMockTransaction({ type: 'expense', categoryId: 'transport', amount: 300 });

      prisma.transaction.findMany.mockResolvedValue([foodExpense, transportExpense]);

      const result = await service.getSummary(userId);

      expect(result.topCategories).toBeDefined();
      expect(result.topCategories.length).toBeGreaterThan(0);
    });

    it('should handle empty transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.getSummary(userId);

      expect(result.totals.income).toBe(0);
      expect(result.totals.expense).toBe(0);
      expect(result.totals.balance).toBe(0);
    });

    it('should filter by date range from query', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.getSummary(userId, { dateFrom: '2024-06-01' });

      expect(prisma.transaction.findMany).toHaveBeenCalled();
    });
  });

  describe('getCashFlowForecast', () => {
    it('should calculate commitments and month-end projection', async () => {
      prisma.transaction.findMany
        .mockResolvedValueOnce([
          createMockTransaction({ type: 'expense', amount: 300, date: new Date('2026-03-10T00:00:00.000Z') }),
          createMockTransaction({ type: 'expense', amount: 450, date: new Date('2026-03-09T00:00:00.000Z') }),
        ])
        .mockResolvedValueOnce([
          createMockTransaction({ type: 'income', amount: 5000, date: new Date('2026-03-02T00:00:00.000Z') }),
          createMockTransaction({ type: 'expense', amount: 1200, date: new Date('2026-03-06T00:00:00.000Z') }),
        ]);

      prisma.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          userId,
          name: 'Elektrik',
          amount: 800,
          currency: 'TRY',
          dueDate: new Date('2026-03-15T00:00:00.000Z'),
          frequency: 'monthly',
          categoryId: 'utilities',
          categoryLabel: 'Faturalar',
          isPaid: false,
        },
      ]);

      prisma.subscription.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          userId,
          name: 'Netflix',
          amount: 200,
          currency: 'TRY',
          billingCycle: 'monthly',
          nextBillingDate: new Date('2026-03-18T00:00:00.000Z'),
          categoryId: 'subscription',
          categoryLabel: 'Abonelik',
          isActive: true,
          notes: null,
        },
      ]);

      const result = await service.getCashFlowForecast(userId, 30);

      expect(result.days).toBe(30);
      expect(result.currentBalance).toBe(3800);
      expect(result.committedExpenses).toBe(1000);
      expect(result.projectedVariableExpenses).toBeGreaterThan(0);
      expect(result.upcomingEvents).toHaveLength(2);
    });

    it('should clamp invalid day ranges to default limits', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.bill.findMany.mockResolvedValue([]);
      prisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.getCashFlowForecast(userId, -10);

      expect(result.days).toBe(30);
      expect(result.upcomingEvents).toEqual([]);
      expect(result.runwayDays).toBeNull();
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle very large transaction amounts', async () => {
      const largeTransaction = createMockTransaction({ amount: 999999999.99 });
      prisma.transaction.findMany.mockResolvedValue([largeTransaction]);

      const result = await service.findAll(userId);

      expect(result[0].amount).toBe(999999999.99);
    });

    it('should handle special characters in description', async () => {
      const specialTransaction = createMockTransaction({
        description: "Test <script>alert('xss')</script>",
      });
      prisma.transaction.findFirst.mockResolvedValue(specialTransaction);

      const result = await service.findOne(userId, specialTransaction.id);

      expect(result.description).toBe("Test <script>alert('xss')</script>");
    });

    it('should handle database errors', async () => {
      prisma.transaction.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(userId)).rejects.toThrow('Database error');
    });

    it('should handle transactions with null notes', async () => {
      const txWithNullNotes = createMockTransaction({ notes: null });
      prisma.transaction.findFirst.mockResolvedValue(txWithNullNotes);

      const result = await service.findOne(userId, txWithNullNotes.id);

      expect(result.notes).toBeUndefined();
    });

    it('should parse tags from JSON string', async () => {
      const txWithTags = createMockTransaction({
        tags: JSON.stringify(['tag1', 'tag2']),
      });
      prisma.transaction.findFirst.mockResolvedValue(txWithTags);

      const result = await service.findOne(userId, txWithTags.id);

      expect(result).toBeDefined();
    });
  });
});
