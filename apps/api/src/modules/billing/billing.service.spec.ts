import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let stripe: StripeService;

  const mockFreePlan = {
    id: 'plan-free',
    name: 'free',
    displayName: 'Free',
    maxTransactions: 50,
    maxBudgets: 3,
    maxSavingsGoals: 2,
    maxBankConnections: 0,
    maxHouseholdMembers: 0,
    features: JSON.stringify(['pdf_upload']),
    priceMonthly: 0,
    priceYearly: 0,
    isActive: true,
  };

  const mockProPlan = {
    id: 'plan-pro',
    name: 'pro',
    displayName: 'Pro',
    maxTransactions: -1,
    maxBudgets: 10,
    maxSavingsGoals: 10,
    maxBankConnections: 3,
    maxHouseholdMembers: 5,
    features: JSON.stringify([
      'pdf_upload',
      'bank_connection',
      'ai_insights',
      'export_csv',
      'export_pdf',
      'household',
      'advanced_reports',
    ]),
    priceMonthly: 99,
    priceYearly: 990,
    stripePriceIdMonthly: 'price_monthly_123',
    stripePriceIdYearly: 'price_yearly_123',
    isActive: true,
  };

  const mockPrismaService = {
    plan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    userPlan: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
    budget: {
      count: jest.fn(),
    },
    savingsGoal: {
      count: jest.fn(),
    },
    bankConnection: {
      count: jest.fn(),
    },
    paymentHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockStripeService = {
    createCustomer: jest.fn(),
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    cancelSubscription: jest.fn(),
    resumeSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);
    stripe = module.get<StripeService>(StripeService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('should return all active plans', async () => {
      mockPrismaService.plan.findMany.mockResolvedValue([
        mockFreePlan,
        mockProPlan,
      ]);

      const plans = await service.getPlans();

      expect(plans).toHaveLength(2);
      expect(mockPrismaService.plan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('getUserPlan', () => {
    it('should return user plan with features', async () => {
      mockPrismaService.userPlan.findUnique.mockResolvedValue({
        userId: 'user-1',
        planId: 'plan-pro',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: new Date('2025-02-01'),
        cancelAt: null,
        plan: mockProPlan,
      });

      mockPrismaService.transaction.count.mockResolvedValue(100);
      mockPrismaService.budget.count.mockResolvedValue(5);
      mockPrismaService.savingsGoal.count.mockResolvedValue(3);
      mockPrismaService.bankConnection.count.mockResolvedValue(1);

      const result = await service.getUserPlan('user-1');

      expect(result.planName).toBe('pro');
      expect(result.displayName).toBe('Pro');
      expect(result.features.exportCsv).toBe(true);
      expect(result.features.exportPdf).toBe(true);
      expect(result.features.aiInsights).toBe(true);
      expect(result.usage.transactions).toBe(100);
    });

    it('should create free plan if user has no plan', async () => {
      mockPrismaService.userPlan.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(mockFreePlan);
      mockPrismaService.userPlan.create.mockResolvedValue({
        userId: 'user-1',
        planId: 'plan-free',
        status: 'active',
        billingCycle: 'monthly',
        plan: mockFreePlan,
      });

      mockPrismaService.transaction.count.mockResolvedValue(0);
      mockPrismaService.budget.count.mockResolvedValue(0);
      mockPrismaService.savingsGoal.count.mockResolvedValue(0);
      mockPrismaService.bankConnection.count.mockResolvedValue(0);

      const result = await service.getUserPlan('new-user');

      expect(result.planName).toBe('free');
      expect(result.features.exportCsv).toBe(false);
      expect(result.features.exportPdf).toBe(false);
      expect(mockPrismaService.userPlan.create).toHaveBeenCalled();
    });

    it('should throw error if free plan not found', async () => {
      mockPrismaService.userPlan.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.getUserPlan('new-user')).rejects.toThrow();
    });
  });

  describe('checkTransactionLimit', () => {
    it('should allow unlimited transactions for pro plan', async () => {
      jest.spyOn(service, 'getUserPlan').mockResolvedValue({
        planId: 'plan-pro',
        planName: 'pro',
        displayName: 'Pro',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: null,
        cancelAt: null,
        limits: {
          maxTransactions: -1,
          maxBudgets: 10,
          maxSavingsGoals: 10,
          maxBankConnections: 3,
          maxHouseholdMembers: 5,
        },
        features: {
          pdfUpload: true,
          bankConnection: true,
          aiInsights: true,
          exportCsv: true,
          exportPdf: true,
          household: true,
          prioritySupport: false,
          customCategories: false,
          advancedReports: true,
          apiAccess: false,
        },
        usage: { transactions: 1000, budgets: 5, savingsGoals: 3, bankConnections: 1 },
      });

      const result = await service.checkTransactionLimit('user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it('should check limit for free plan', async () => {
      jest.spyOn(service, 'getUserPlan').mockResolvedValue({
        planId: 'plan-free',
        planName: 'free',
        displayName: 'Free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: null,
        cancelAt: null,
        limits: {
          maxTransactions: 50,
          maxBudgets: 3,
          maxSavingsGoals: 2,
          maxBankConnections: 0,
          maxHouseholdMembers: 0,
        },
        features: {
          pdfUpload: true,
          bankConnection: false,
          aiInsights: false,
          exportCsv: false,
          exportPdf: false,
          household: false,
          prioritySupport: false,
          customCategories: false,
          advancedReports: false,
          apiAccess: false,
        },
        usage: { transactions: 45, budgets: 2, savingsGoals: 1, bankConnections: 0 },
      });

      const result = await service.checkTransactionLimit('user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should not allow when limit reached', async () => {
      jest.spyOn(service, 'getUserPlan').mockResolvedValue({
        planId: 'plan-free',
        planName: 'free',
        displayName: 'Free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: null,
        cancelAt: null,
        limits: {
          maxTransactions: 50,
          maxBudgets: 3,
          maxSavingsGoals: 2,
          maxBankConnections: 0,
          maxHouseholdMembers: 0,
        },
        features: {
          pdfUpload: true,
          bankConnection: false,
          aiInsights: false,
          exportCsv: false,
          exportPdf: false,
          household: false,
          prioritySupport: false,
          customCategories: false,
          advancedReports: false,
          apiAccess: false,
        },
        usage: { transactions: 50, budgets: 2, savingsGoals: 1, bankConnections: 0 },
      });

      const result = await service.checkTransactionLimit('user-1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('checkFeatureAccess', () => {
    it('should return true for available feature', async () => {
      jest.spyOn(service, 'getUserPlan').mockResolvedValue({
        planId: 'plan-pro',
        planName: 'pro',
        displayName: 'Pro',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: null,
        cancelAt: null,
        limits: {
          maxTransactions: -1,
          maxBudgets: 10,
          maxSavingsGoals: 10,
          maxBankConnections: 3,
          maxHouseholdMembers: 5,
        },
        features: {
          pdfUpload: true,
          bankConnection: true,
          aiInsights: true,
          exportCsv: true,
          exportPdf: true,
          household: true,
          prioritySupport: false,
          customCategories: false,
          advancedReports: true,
          apiAccess: false,
        },
        usage: { transactions: 100, budgets: 5, savingsGoals: 3, bankConnections: 1 },
      });

      const hasAccess = await service.checkFeatureAccess('user-1', 'exportCsv');

      expect(hasAccess).toBe(true);
    });

    it('should return false for unavailable feature', async () => {
      jest.spyOn(service, 'getUserPlan').mockResolvedValue({
        planId: 'plan-free',
        planName: 'free',
        displayName: 'Free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: null,
        cancelAt: null,
        limits: {
          maxTransactions: 50,
          maxBudgets: 3,
          maxSavingsGoals: 2,
          maxBankConnections: 0,
          maxHouseholdMembers: 0,
        },
        features: {
          pdfUpload: true,
          bankConnection: false,
          aiInsights: false,
          exportCsv: false,
          exportPdf: false,
          household: false,
          prioritySupport: false,
          customCategories: false,
          advancedReports: false,
          apiAccess: false,
        },
        usage: { transactions: 10, budgets: 1, savingsGoals: 0, bankConnections: 0 },
      });

      const hasAccess = await service.checkFeatureAccess('user-1', 'exportCsv');

      expect(hasAccess).toBe(false);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for pro plan', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      });
      mockPrismaService.plan.findUnique.mockResolvedValue(mockProPlan);
      mockPrismaService.userPlan.findUnique.mockResolvedValue(null);
      mockStripeService.createCustomer.mockResolvedValue({ id: 'cus_123' });
      mockStripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      });

      const result = await service.createCheckoutSession(
        'user-1',
        'pro',
        'monthly',
        'https://app.com/success',
        'https://app.com/cancel',
      );

      expect(result.sessionId).toBe('cs_123');
      expect(result.url).toBe('https://checkout.stripe.com/...');
    });

    it('should throw for free plan checkout', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
      });
      mockPrismaService.plan.findUnique.mockResolvedValue(mockFreePlan);

      await expect(
        service.createCheckoutSession(
          'user-1',
          'free',
          'monthly',
          'https://app.com/success',
          'https://app.com/cancel',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(
          'non-existent',
          'pro',
          'monthly',
          'https://app.com/success',
          'https://app.com/cancel',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          amount: 99,
          currency: 'TRY',
          status: 'succeeded',
          createdAt: new Date(),
        },
      ];
      mockPrismaService.paymentHistory.findMany.mockResolvedValue(mockPayments);

      const history = await service.getPaymentHistory('user-1', 10);

      expect(history).toHaveLength(1);
      expect(mockPrismaService.paymentHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });
});
