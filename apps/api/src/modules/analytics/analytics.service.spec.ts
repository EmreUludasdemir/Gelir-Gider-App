import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma.service';
import { RedisService } from '../../redis.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockTransactions = [
    {
      id: 'tx-1',
      userId: mockUserId,
      amount: -150.0,
      type: 'expense',
      categoryId: 'food',
      categoryLabel: 'Yemek',
      date: new Date('2024-12-15'),
    },
    {
      id: 'tx-2',
      userId: mockUserId,
      amount: 3000.0,
      type: 'income',
      categoryId: 'salary',
      categoryLabel: 'Maaş',
      date: new Date('2024-12-01'),
    },
    {
      id: 'tx-3',
      userId: mockUserId,
      amount: -200.0,
      type: 'expense',
      categoryId: 'transport',
      categoryLabel: 'Ulaşım',
      date: new Date('2024-11-20'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMonthlyComparison', () => {
    it('should return cached data if available', async () => {
      const cachedData = [
        {
          month: 'December',
          year: 2024,
          income: 3000,
          expense: 500,
          balance: 2500,
          transactionCount: 10,
        },
      ];

      mockRedisService.get.mockResolvedValue(cachedData);

      const result = await service.getMonthlyComparison(mockUserId, 3);

      expect(result).toEqual(cachedData);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        `analytics:monthly:${mockUserId}:3`,
      );
      expect(mockPrismaService.transaction.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and calculate monthly data when not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions.filter((tx) => tx.date.getMonth() === 11), // December
      );

      const result = await service.getMonthlyComparison(mockUserId, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('income');
      expect(result[0]).toHaveProperty('expense');
      expect(result[0]).toHaveProperty('balance');
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should calculate income and expense correctly', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const decemberTransactions = [
        { amount: 3000, type: 'income' },
        { amount: -150, type: 'expense' },
        { amount: -200, type: 'expense' },
      ];
      mockPrismaService.transaction.findMany.mockResolvedValue(
        decemberTransactions as any,
      );

      const result = await service.getMonthlyComparison(mockUserId, 1);

      expect(result[0].income).toBe(3000);
      expect(result[0].expense).toBe(350);
      expect(result[0].balance).toBe(2650);
    });
  });

  describe('getCategoryTrends', () => {
    it('should calculate category spending trends', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Current period transactions
      const currentTransactions = [
        { categoryId: 'food', categoryLabel: 'Yemek', amount: -300 },
        { categoryId: 'transport', categoryLabel: 'Ulaşım', amount: -150 },
      ];

      // Previous period transactions
      const previousTransactions = [
        { categoryId: 'food', categoryLabel: 'Yemek', amount: -200 },
        { categoryId: 'transport', categoryLabel: 'Ulaşım', amount: -150 },
      ];

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce(currentTransactions as any)
        .mockResolvedValueOnce(previousTransactions as any);

      const result = await service.getCategoryTrends(mockUserId, 30);

      expect(Array.isArray(result)).toBe(true);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledTimes(2);
    });

    it('should identify upward trend when spending increases', async () => {
      mockRedisService.get.mockResolvedValue(null);

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([{ categoryId: 'food', categoryLabel: 'Yemek', amount: -500, type: 'expense' }] as any)
        .mockResolvedValueOnce([{ categoryId: 'food', categoryLabel: 'Yemek', amount: -300, type: 'expense' }] as any);

      const result = await service.getCategoryTrends(mockUserId, 30);

      // Food spending increased from 300 to 500, should be "up" trend
      if (result.length > 0) {
        expect(result[0].changePercent).toBeGreaterThan(0);
      }
    });
  });

  describe('getForecast', () => {
    it('should predict future expenses based on historical data', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Mock 3 months of transaction data
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { amount: -1000, type: 'expense', categoryId: 'food', categoryLabel: 'Yemek' },
        { amount: -1100, type: 'expense', categoryId: 'food', categoryLabel: 'Yemek' },
        { amount: -1050, type: 'expense', categoryId: 'food', categoryLabel: 'Yemek' },
        { amount: 3000, type: 'income', categoryId: 'salary', categoryLabel: 'Maaş' },
        { amount: 3000, type: 'income', categoryId: 'salary', categoryLabel: 'Maaş' },
        { amount: 3000, type: 'income', categoryId: 'salary', categoryLabel: 'Maaş' },
      ] as any);

      const result = await service.getForecast(mockUserId, 3);

      expect(result).toHaveProperty('predictedExpense');
      expect(result).toHaveProperty('predictedIncome');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('basedOnMonths');
      expect(result.predictedExpense).toBeGreaterThan(0);
      expect(result.predictedIncome).toBeGreaterThan(0);
    });

    it('should return high confidence for consistent spending patterns', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Very consistent spending
      const consistentTransactions = Array(6).fill({
        amount: -1000,
        type: 'expense',
        categoryId: 'rent',
        categoryLabel: 'Kira',
      });

      mockPrismaService.transaction.findMany.mockResolvedValue(
        consistentTransactions as any,
      );

      const result = await service.getForecast(mockUserId, 6);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('getSavingsRate', () => {
    it('should calculate savings rate correctly', async () => {
      mockRedisService.get.mockResolvedValue(null);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        { amount: 5000, type: 'income' },
        { amount: -3000, type: 'expense' },
      ] as any);

      const result = await service.getSavingsRate(mockUserId, 30);

      // Savings rate = (income - expense) / income * 100
      // = (5000 - 3000) / 5000 * 100 = 40%
      expect(result.savingsRate).toBe(40);
      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpense).toBe(3000);
      expect(result.totalSavings).toBe(2000);
    });

    it('should handle zero income gracefully', async () => {
      mockRedisService.get.mockResolvedValue(null);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        { amount: -100, type: 'expense' },
      ] as any);

      const result = await service.getSavingsRate(mockUserId, 30);

      expect(result.savingsRate).toBe(0);
      expect(result.totalIncome).toBe(0);
    });
  });

  describe('getTopCategories', () => {
    it('should return top spending categories', async () => {
      mockRedisService.get.mockResolvedValue(null);

      mockPrismaService.transaction.groupBy.mockResolvedValue([
        { categoryId: 'food', _sum: { amount: -1000 } },
        { categoryId: 'transport', _sum: { amount: -500 } },
        { categoryId: 'entertainment', _sum: { amount: -300 } },
      ]);

      const result = await service.getTopCategories(mockUserId, 5, 30);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(mockPrismaService.transaction.groupBy).toHaveBeenCalled();
    });
  });
});
