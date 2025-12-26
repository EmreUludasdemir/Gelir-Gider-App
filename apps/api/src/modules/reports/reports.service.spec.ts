import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    savingsGoal: {
      findMany: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockTransactions = [
    {
      id: 'tx-1',
      userId: mockUserId,
      date: new Date('2024-12-15'),
      description: 'Grocery shopping',
      amount: -150.75,
      type: 'expense',
      categoryId: 'food',
      categoryLabel: 'Yemek',
      source: 'manual',
    },
    {
      id: 'tx-2',
      userId: mockUserId,
      date: new Date('2024-12-01'),
      description: 'Salary',
      amount: 15000,
      type: 'income',
      categoryId: 'salary',
      categoryLabel: 'Maaş',
      source: 'manual',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMonthlyReport', () => {
    it('should generate monthly financial report', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const result = await service.generateMonthlyReport(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result).toHaveProperty('totalIncome');
      expect(result).toHaveProperty('totalExpense');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('transactionCount');
      expect(result.totalIncome).toBe(15000);
      expect(result.totalExpense).toBe(150.75);
      expect(result.balance).toBe(14849.25);
    });

    it('should group transactions by category', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const result = await service.generateMonthlyReport(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result).toHaveProperty('categoryBreakdown');
      expect(Array.isArray(result.categoryBreakdown)).toBe(true);
    });

    it('should handle empty transaction list', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const result = await service.generateMonthlyReport(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.transactionCount).toBe(0);
    });
  });

  describe('generateYearlyReport', () => {
    it('should generate yearly summary', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const year = 2024;

      const result = await service.generateYearlyReport(mockUserId, year);

      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('totalIncome');
      expect(result).toHaveProperty('totalExpense');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('monthlyBreakdown');
      expect(result.year).toBe(year);
    });

    it('should break down data by month', async () => {
      const yearTransactions = Array.from({ length: 12 }, (_, i) => ({
        id: `tx-${i}`,
        userId: mockUserId,
        date: new Date(2024, i, 15),
        amount: -100,
        type: 'expense',
        categoryId: 'food',
        categoryLabel: 'Yemek',
      }));

      mockPrismaService.transaction.findMany.mockResolvedValue(
        yearTransactions as any,
      );

      const result = await service.generateYearlyReport(mockUserId, 2024);

      expect(result.monthlyBreakdown).toHaveLength(12);
      result.monthlyBreakdown.forEach((month) => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('income');
        expect(month).toHaveProperty('expense');
      });
    });
  });

  describe('generatePDFReport', () => {
    it('should generate PDF buffer', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const result = await service.generatePDFReport(
        mockUserId,
        startDate,
        endDate,
      );

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include transaction details in PDF', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const buffer = await service.generatePDFReport(
        mockUserId,
        startDate,
        endDate,
      );

      // PDF should contain transaction data
      expect(buffer.length).toBeGreaterThan(100);
    });
  });

  describe('generateExcelReport', () => {
    it('should generate Excel buffer', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const result = await service.generateExcelReport(
        mockUserId,
        startDate,
        endDate,
      );

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create multiple sheets', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );
      mockPrismaService.budget.findMany.mockResolvedValue([]);
      mockPrismaService.savingsGoal.findMany.mockResolvedValue([]);

      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const buffer = await service.generateExcelReport(
        mockUserId,
        startDate,
        endDate,
      );

      // Excel file should have content
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('getCategoryAnalysis', () => {
    it('should analyze spending by category', async () => {
      mockPrismaService.transaction.groupBy.mockResolvedValue([
        { categoryId: 'food', _sum: { amount: -500 }, _count: { id: 10 } },
        { categoryId: 'transport', _sum: { amount: -300 }, _count: { id: 5 } },
      ]);

      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: -800 },
      });

      const result = await service.getCategoryAnalysis(
        mockUserId,
        new Date('2024-12-01'),
        new Date('2024-12-31'),
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((category) => {
        expect(category).toHaveProperty('categoryId');
        expect(category).toHaveProperty('total');
        expect(category).toHaveProperty('percentage');
        expect(category).toHaveProperty('transactionCount');
      });
    });

    it('should calculate percentages correctly', async () => {
      mockPrismaService.transaction.groupBy.mockResolvedValue([
        { categoryId: 'food', _sum: { amount: -600 }, _count: { id: 10 } },
        { categoryId: 'transport', _sum: { amount: -400 }, _count: { id: 5 } },
      ]);

      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: -1000 },
      });

      const result = await service.getCategoryAnalysis(
        mockUserId,
        new Date('2024-12-01'),
        new Date('2024-12-31'),
      );

      // Food: 600/1000 = 60%
      // Transport: 400/1000 = 40%
      expect(result[0].percentage).toBe(60);
      expect(result[1].percentage).toBe(40);
    });
  });

  describe('getSpendingTrend', () => {
    it('should return daily spending trend', async () => {
      const dailyTransactions = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(2024, 11, i + 1),
        _sum: { amount: -100 * (i + 1) },
      }));

      mockPrismaService.transaction.groupBy.mockResolvedValue(
        dailyTransactions as any,
      );

      const result = await service.getSpendingTrend(
        mockUserId,
        new Date('2024-12-01'),
        new Date('2024-12-07'),
        'daily',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
      result.forEach((day) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('amount');
      });
    });

    it('should support monthly grouping', async () => {
      const monthlyData = [
        { date: new Date(2024, 0, 1), _sum: { amount: -1000 } },
        { date: new Date(2024, 1, 1), _sum: { amount: -1200 } },
      ];

      mockPrismaService.transaction.groupBy.mockResolvedValue(
        monthlyData as any,
      );

      const result = await service.getSpendingTrend(
        mockUserId,
        new Date('2024-01-01'),
        new Date('2024-02-28'),
        'monthly',
      );

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
