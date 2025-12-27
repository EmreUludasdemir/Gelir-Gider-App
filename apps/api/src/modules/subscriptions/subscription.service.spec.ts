import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../prisma.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';

  const createMockTransaction = (overrides = {}) => ({
    id: 'tx-' + Math.random().toString(36).substr(2, 9),
    userId: mockUserId,
    amount: 100,
    type: 'expense',
    description: 'Test transaction',
    categoryId: 'other',
    categoryLabel: 'Diğer',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectSubscriptions', () => {
    it('should detect Netflix subscription from transactions', async () => {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        createMockTransaction({ description: 'Netflix Ödeme', amount: 99.99, createdAt: now }),
        createMockTransaction({ description: 'Netflix Ödeme', amount: 99.99, createdAt: oneMonthAgo }),
        createMockTransaction({ description: 'Netflix Ödeme', amount: 99.99, createdAt: twoMonthsAgo }),
      ]);

      const result = await service.detectSubscriptions(mockUserId);

      expect(result.length).toBeGreaterThanOrEqual(1);
      const netflixSub = result.find(s => s.name === 'Netflix');
      expect(netflixSub).toBeDefined();
      expect(netflixSub?.category).toBe('Eğlence');
    });

    it('should detect Spotify subscription', async () => {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        createMockTransaction({ description: 'Spotify Premium', amount: 59.99, createdAt: now }),
        createMockTransaction({ description: 'Spotify Premium', amount: 59.99, createdAt: oneMonthAgo }),
        createMockTransaction({ description: 'Spotify', amount: 59.99, createdAt: twoMonthsAgo }),
      ]);

      const result = await service.detectSubscriptions(mockUserId);

      const spotifySub = result.find(s => s.name === 'Spotify');
      expect(spotifySub).toBeDefined();
      expect(spotifySub?.frequency).toBe('monthly');
    });

    it('should return empty array when no subscriptions detected', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        createMockTransaction({ description: 'Market alışverişi', amount: 250 }),
        createMockTransaction({ description: 'Benzin', amount: 500 }),
      ]);

      const result = await service.detectSubscriptions(mockUserId);

      expect(result).toEqual([]);
    });

    it('should detect unknown recurring payments', async () => {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        createMockTransaction({ description: 'Acme Corp Monthly', amount: 150, createdAt: now }),
        createMockTransaction({ description: 'Acme Corp Monthly', amount: 150, createdAt: oneMonthAgo }),
        createMockTransaction({ description: 'Acme Corp Monthly', amount: 150, createdAt: twoMonthsAgo }),
        createMockTransaction({ description: 'Acme Corp Monthly', amount: 150, createdAt: threeMonthsAgo }),
      ]);

      const result = await service.detectSubscriptions(mockUserId);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should not detect inconsistent amounts as subscription', async () => {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        createMockTransaction({ description: 'Netflix', amount: 99.99, createdAt: now }),
        createMockTransaction({ description: 'Netflix', amount: 49.99, createdAt: oneMonthAgo }), // Very different amount
      ]);

      const result = await service.detectSubscriptions(mockUserId);

      // Should not detect because amounts vary too much
      const netflixSub = result.find(s => s.name === 'Netflix');
      expect(netflixSub).toBeUndefined();
    });
  });

  describe('getSubscriptionSummary', () => {
    it('should return subscription summary with totals', async () => {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        createMockTransaction({ description: 'Netflix', amount: 100, createdAt: now }),
        createMockTransaction({ description: 'Netflix', amount: 100, createdAt: oneMonthAgo }),
        createMockTransaction({ description: 'Netflix', amount: 100, createdAt: twoMonthsAgo }),
        createMockTransaction({ description: 'Spotify', amount: 60, createdAt: now }),
        createMockTransaction({ description: 'Spotify', amount: 60, createdAt: oneMonthAgo }),
        createMockTransaction({ description: 'Spotify', amount: 60, createdAt: twoMonthsAgo }),
      ]);

      const result = await service.getSubscriptionSummary(mockUserId);

      expect(result.subscriptions).toBeDefined();
      expect(result.totalMonthly).toBeGreaterThan(0);
      expect(result.totalYearly).toBe(result.totalMonthly * 12);
      expect(result.activeCount).toBeGreaterThanOrEqual(0);
    });

    it('should return empty summary when no subscriptions', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.getSubscriptionSummary(mockUserId);

      expect(result.subscriptions).toEqual([]);
      expect(result.totalMonthly).toBe(0);
      expect(result.totalYearly).toBe(0);
      expect(result.activeCount).toBe(0);
      expect(result.upcomingPayments).toEqual([]);
    });
  });
});
