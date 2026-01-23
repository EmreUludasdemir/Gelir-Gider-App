import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userPlan: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    plan: {
      findMany: jest.fn(),
    },
    paymentHistory: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isAdmin', () => {
    it('should return true for admin email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'admin@example.com',
      });

      const result = await service.isAdmin('user-123');

      expect(result).toBe(true);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { email: true },
      });
    });

    it('should return true for demo admin email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'demo@example.com',
      });

      const result = await service.isAdmin('user-456');

      expect(result).toBe(true);
    });

    it('should return false for non-admin email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'regular@user.com',
      });

      const result = await service.isAdmin('user-789');

      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.isAdmin('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('verifyAdmin', () => {
    it('should not throw for admin user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'admin@example.com',
      });

      await expect(service.verifyAdmin('admin-user')).resolves.not.toThrow();
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'regular@user.com',
      });

      await expect(service.verifyAdmin('regular-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      // Mock all the parallel queries
      mockPrismaService.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(15); // newUsersThisMonth

      mockPrismaService.userPlan.count.mockResolvedValue(25); // activeSubscriptions

      mockPrismaService.userPlan.groupBy.mockResolvedValue([
        { planId: 'plan-1', _count: { planId: 50 } },
        { planId: 'plan-2', _count: { planId: 30 } },
        { planId: 'plan-3', _count: { planId: 20 } },
      ]);

      mockPrismaService.paymentHistory.findMany.mockResolvedValue([
        { amount: 100, paidAt: new Date() },
        { amount: 200, paidAt: new Date() },
      ]);

      mockPrismaService.plan.findMany.mockResolvedValue([
        { id: 'plan-1', displayName: 'Free' },
        { id: 'plan-2', displayName: 'Pro' },
        { id: 'plan-3', displayName: 'Business' },
      ]);

      const result = await service.getDashboardStats();

      expect(result.totalUsers).toBe(100);
      expect(result.newUsersThisMonth).toBe(15);
      expect(result.activeSubscriptions).toBe(25);
      expect(result.totalRevenue).toBe(300);
      expect(result.planDistribution).toHaveLength(3);
      expect(result.revenueByMonth).toHaveLength(6);
    });

    it('should handle empty data', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.userPlan.count.mockResolvedValue(0);
      mockPrismaService.userPlan.groupBy.mockResolvedValue([]);
      mockPrismaService.paymentHistory.findMany.mockResolvedValue([]);
      mockPrismaService.plan.findMany.mockResolvedValue([]);

      const result = await service.getDashboardStats();

      expect(result.totalUsers).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.planDistribution).toHaveLength(0);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          createdAt: new Date(),
          _count: { transactions: 10 },
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          createdAt: new Date(),
          _count: { transactions: 5 },
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(50);
      mockPrismaService.userPlan.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          plan: { name: 'pro', displayName: 'Pro' },
          status: 'active',
        },
      ]);

      const result = await service.getUsers(1, 10);

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(50);
      expect(result.pages).toBe(5);
      expect(result.users[0].transactionCount).toBe(10);
    });

    it('should filter by search term', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.userPlan.findMany.mockResolvedValue([]);

      await service.getUsers(1, 10, 'search@example.com');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'search@example.com', mode: 'insensitive' } },
              { name: { contains: 'search@example.com', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.userPlan.findMany.mockResolvedValue([]);

      const result = await service.getUsers(3, 20);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
      expect(result.pages).toBe(5);
    });
  });

  describe('getSubscriptions', () => {
    it('should return paginated subscriptions', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          userId: 'user-1',
          plan: { name: 'pro', displayName: 'Pro', priceMonthly: 99 },
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodEnd: new Date(),
          cancelAt: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.userPlan.findMany.mockResolvedValue(mockSubscriptions);
      mockPrismaService.userPlan.count.mockResolvedValue(25);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
      ]);

      const result = await service.getSubscriptions(1, 10);

      expect(result.subscriptions).toHaveLength(1);
      expect(result.total).toBe(25);
      expect(result.subscriptions[0].plan.name).toBe('pro');
    });

    it('should filter by status', async () => {
      mockPrismaService.userPlan.findMany.mockResolvedValue([]);
      mockPrismaService.userPlan.count.mockResolvedValue(0);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getSubscriptions(1, 10, 'active');

      expect(mockPrismaService.userPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        }),
      );
    });
  });

  describe('getRecentPayments', () => {
    it('should return recent payments with user emails', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          userId: 'user-1',
          amount: 99,
          currency: 'TRY',
          status: 'succeeded',
          planName: 'pro',
          createdAt: new Date(),
          paidAt: new Date(),
        },
      ];

      mockPrismaService.paymentHistory.findMany.mockResolvedValue(mockPayments);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'user1@example.com' },
      ]);

      const result = await service.getRecentPayments(10);

      expect(result).toHaveLength(1);
      expect(result[0].userEmail).toBe('user1@example.com');
      expect(result[0].amount).toBe(99);
    });

    it('should handle unknown users', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          userId: 'deleted-user',
          amount: 99,
          currency: 'TRY',
          status: 'succeeded',
          planName: 'pro',
          createdAt: new Date(),
          paidAt: new Date(),
        },
      ];

      mockPrismaService.paymentHistory.findMany.mockResolvedValue(mockPayments);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getRecentPayments(10);

      expect(result[0].userEmail).toBe('Unknown');
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.paymentHistory.findMany.mockResolvedValue([]);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getRecentPayments(5);

      expect(mockPrismaService.paymentHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });
});
