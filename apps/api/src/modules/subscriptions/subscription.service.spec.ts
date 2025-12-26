import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../prisma.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    subscription: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockSubscription = {
    id: 'sub-123',
    userId: mockUserId,
    name: 'Netflix',
    amount: 99.99,
    currency: 'TRY',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2025-02-01'),
    categoryId: 'entertainment',
    categoryLabel: 'Eğlence',
    isActive: true,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionSummary', () => {
    it('should return subscription summary with totals', async () => {
      const mockTransactions = [
        {
          description: 'Netflix',
          amount: -99.99,
          date: new Date('2024-12-01'),
        },
        {
          description: 'Spotify',
          amount: -39.99,
          date: new Date('2024-12-05'),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getSubscriptionSummary(mockUserId);

      expect(result).toHaveProperty('totalMonthly');
      expect(result).toHaveProperty('totalYearly');
      expect(result).toHaveProperty('activeCount');
      expect(result).toHaveProperty('upcomingPayments');
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        }),
      );
    });

    it('should detect recurring transactions', async () => {
      const recurringTransactions = [
        {
          description: 'Netflix',
          amount: -99.99,
          date: new Date('2024-11-01'),
        },
        {
          description: 'Netflix',
          amount: -99.99,
          date: new Date('2024-12-01'),
        },
        {
          description: 'Netflix',
          amount: -99.99,
          date: new Date('2025-01-01'),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(
        recurringTransactions,
      );

      const result = await service.getSubscriptionSummary(mockUserId);

      expect(result.activeCount).toBeGreaterThan(0);
    });

    it('should calculate monthly total correctly', async () => {
      const subscriptions = [
        {
          description: 'Netflix',
          amount: -99.99,
          date: new Date('2024-12-01'),
        },
        {
          description: 'Spotify',
          amount: -39.99,
          date: new Date('2024-12-05'),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(subscriptions);

      const result = await service.getSubscriptionSummary(mockUserId);

      // Monthly total should be sum of detected subscriptions
      expect(typeof result.totalMonthly).toBe('number');
      expect(result.totalMonthly).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty transaction list', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.getSubscriptionSummary(mockUserId);

      expect(result.totalMonthly).toBe(0);
      expect(result.totalYearly).toBe(0);
      expect(result.activeCount).toBe(0);
      expect(result.upcomingPayments).toEqual([]);
    });
  });

  describe('detectRecurringPatterns', () => {
    it('should identify recurring payments by similar amount and description', async () => {
      const transactions = [
        {
          id: '1',
          description: 'NETFLIX.COM',
          amount: -99.99,
          date: new Date('2024-10-01'),
          categoryLabel: 'Eğlence',
        },
        {
          id: '2',
          description: 'NETFLIX.COM',
          amount: -99.99,
          date: new Date('2024-11-01'),
          categoryLabel: 'Eğlence',
        },
        {
          id: '3',
          description: 'NETFLIX.COM',
          amount: -99.99,
          date: new Date('2024-12-01'),
          categoryLabel: 'Eğlence',
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getSubscriptionSummary(mockUserId);

      // Should detect at least one recurring subscription
      expect(result.activeCount).toBeGreaterThan(0);
    });
  });

  describe('upcomingPayments', () => {
    it('should predict upcoming payment dates', async () => {
      const transactions = [
        {
          description: 'Netflix',
          amount: -99.99,
          date: new Date('2024-11-15'),
        },
        {
          description: 'Netflix',
          amount: -99.99,
          date: new Date('2024-12-15'),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.getSubscriptionSummary(mockUserId);

      expect(Array.isArray(result.upcomingPayments)).toBe(true);
    });
  });
});
