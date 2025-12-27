import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma.service';
import { RedisService } from '../../redis.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockUserId = 'user-123';

  const mockTransaction = (overrides = {}) => ({
    id: 'tx-1',
    userId: mockUserId,
    amount: 100,
    type: 'expense',
    description: 'Test',
    categoryId: 'food',
    categoryLabel: 'Yemek',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlyComparison', () => {
    it('should return cached data if available', async () => {
      const cachedData = [{ month: 'Aralık', year: 2024, income: 1000, expense: 500, balance: 500, transactionCount: 10 }];
      mockRedisService.get.mockResolvedValue(cachedData);

      const result = await service.getMonthlyComparison(mockUserId, 6);

      expect(result).toEqual(cachedData);
      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
    });

    it('should calculate monthly data when not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction({ type: 'income', amount: 1000 }),
        mockTransaction({ type: 'expense', amount: 300 }),
      ]);

      const result = await service.getMonthlyComparison(mockUserId, 1);

      expect(result).toHaveLength(1);
      expect(result[0].income).toBe(1000);
      expect(result[0].expense).toBe(300);
      expect(result[0].balance).toBe(700);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('getCategoryTrends', () => {
    it('should return category trends for month period', async () => {
      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([
          mockTransaction({ categoryId: 'food', amount: 500 }),
          mockTransaction({ categoryId: 'transport', amount: 200 }),
        ])
        .mockResolvedValueOnce([
          mockTransaction({ categoryId: 'food', amount: 400 }),
        ]);

      const result = await service.getCategoryTrends(mockUserId, 'month');

      expect(result).toHaveLength(2);
      expect(result[0].categoryId).toBe('food');
      expect(result[0].currentPeriod).toBe(500);
      expect(result[0].previousPeriod).toBe(400);
    });

    it('should calculate trend direction correctly', async () => {
      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([
          mockTransaction({ categoryId: 'food', amount: 600 }),
        ])
        .mockResolvedValueOnce([
          mockTransaction({ categoryId: 'food', amount: 400 }),
        ]);

      const result = await service.getCategoryTrends(mockUserId, 'month');

      expect(result[0].trend).toBe('up');
      expect(result[0].changePercent).toBe(50);
    });
  });

  describe('getSpendingForecast', () => {
    it('should return cached forecast if available', async () => {
      const cachedForecast = {
        predictedExpense: 1000,
        predictedIncome: 2000,
        confidence: 75,
        basedOnMonths: 3,
        topCategoryPredictions: [],
      };
      mockRedisService.get.mockResolvedValue(cachedForecast);

      const result = await service.getSpendingForecast(mockUserId);

      expect(result).toEqual(cachedForecast);
      expect(prisma.transaction.findMany).not.toHaveBeenCalled();
    });

    it('should calculate forecast from transaction history', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction({ type: 'income', amount: 3000, date: lastMonth }),
        mockTransaction({ type: 'expense', amount: 1000, date: lastMonth, categoryId: 'food' }),
        mockTransaction({ type: 'expense', amount: 500, date: lastMonth, categoryId: 'transport' }),
      ]);

      const result = await service.getSpendingForecast(mockUserId);

      expect(result.predictedIncome).toBe(3000);
      expect(result.predictedExpense).toBe(1500);
      expect(result.topCategoryPredictions).toHaveLength(2);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('getDailySpending', () => {
    it('should return daily spending data', async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction({ amount: 50, date: today }),
        mockTransaction({ amount: 75, date: today }),
      ]);

      const result = await service.getDailySpending(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(todayStr);
      expect(result[0].amount).toBe(125);
    });

    it('should handle empty transactions', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.getDailySpending(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getSavingsRate', () => {
    it('should calculate savings rate correctly', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction({ type: 'income', amount: 5000 }),
        mockTransaction({ type: 'expense', amount: 3000 }),
      ]);

      const result = await service.getSavingsRate(mockUserId);

      expect(result.saved).toBe(2000);
      expect(result.rate).toBe(40);
      expect(result.target).toBe(1000); // 20% of income
    });

    it('should handle zero income', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction({ type: 'expense', amount: 500 }),
      ]);

      const result = await service.getSavingsRate(mockUserId);

      expect(result.rate).toBe(0);
      expect(result.saved).toBe(0);
    });

    it('should handle negative savings', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction({ type: 'income', amount: 1000 }),
        mockTransaction({ type: 'expense', amount: 1500 }),
      ]);

      const result = await service.getSavingsRate(mockUserId);

      expect(result.saved).toBe(0); // Clamped to 0
      expect(result.rate).toBe(0); // Clamped to 0
    });
  });
});
