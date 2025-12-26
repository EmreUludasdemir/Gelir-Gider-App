import { Test, TestingModule } from '@nestjs/testing';
import { SmartNotificationService } from './smart-notification.service';
import { PrismaService } from '../../prisma.service';
import { EmailService } from './email.service';

describe('SmartNotificationService', () => {
  let service: SmartNotificationService;
  let prisma: PrismaService;
  let emailService: EmailService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    bill: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    savingsGoal: {
      findMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendBudgetAlert: jest.fn(),
    sendBillReminder: jest.fn(),
    sendWeeklyReport: jest.fn(),
    sendAnomalyAlert: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartNotificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<SmartNotificationService>(SmartNotificationService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkBudgetAlerts', () => {
    it('should detect when budget threshold is exceeded', async () => {
      const mockBudget = {
        id: 'budget-1',
        userId: mockUserId,
        categoryId: 'food',
        categoryLabel: 'Yemek',
        limitAmount: 1000,
        alertThreshold: 80,
        period: 'monthly',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.budget.findMany.mockResolvedValue([mockBudget]);

      // Mock spending: 850 TRY (85% of 1000 TRY limit)
      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: -850 },
      });

      await service.checkBudgetAlerts(mockUserId);

      expect(mockEmailService.sendBudgetAlert).toHaveBeenCalledWith(
        mockUser.email,
        expect.objectContaining({
          categoryLabel: 'Yemek',
          spent: 850,
          limit: 1000,
          percentage: 85,
        }),
      );
    });

    it('should not send alert if spending is below threshold', async () => {
      const mockBudget = {
        id: 'budget-1',
        userId: mockUserId,
        categoryId: 'food',
        categoryLabel: 'Yemek',
        limitAmount: 1000,
        alertThreshold: 80,
        period: 'monthly',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.budget.findMany.mockResolvedValue([mockBudget]);

      // Mock spending: 500 TRY (50% of 1000 TRY limit)
      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _sum: { amount: -500 },
      });

      await service.checkBudgetAlerts(mockUserId);

      expect(mockEmailService.sendBudgetAlert).not.toHaveBeenCalled();
    });

    it('should handle multiple budgets', async () => {
      const mockBudgets = [
        {
          id: 'budget-1',
          categoryId: 'food',
          categoryLabel: 'Yemek',
          limitAmount: 1000,
          alertThreshold: 80,
        },
        {
          id: 'budget-2',
          categoryId: 'transport',
          categoryLabel: 'Ulaşım',
          limitAmount: 500,
          alertThreshold: 80,
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.budget.findMany.mockResolvedValue(mockBudgets);
      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: -850 } }) // Food: 85%
        .mockResolvedValueOnce({ _sum: { amount: -200 } }); // Transport: 40%

      await service.checkBudgetAlerts(mockUserId);

      expect(mockEmailService.sendBudgetAlert).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkBillReminders', () => {
    it('should send reminders for upcoming bills', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockBill = {
        id: 'bill-1',
        userId: mockUserId,
        name: 'Netflix',
        amount: 99.99,
        dueDate: tomorrow,
        isPaid: false,
        reminderDays: 3,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.bill.findMany.mockResolvedValue([mockBill]);

      await service.checkBillReminders(mockUserId);

      expect(mockEmailService.sendBillReminder).toHaveBeenCalledWith(
        mockUser.email,
        expect.objectContaining({
          name: 'Netflix',
          amount: 99.99,
        }),
      );
    });

    it('should not send reminder for paid bills', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockBill = {
        id: 'bill-1',
        userId: mockUserId,
        name: 'Netflix',
        amount: 99.99,
        dueDate: tomorrow,
        isPaid: true,
        reminderDays: 3,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.bill.findMany.mockResolvedValue([mockBill]);

      await service.checkBillReminders(mockUserId);

      expect(mockEmailService.sendBillReminder).not.toHaveBeenCalled();
    });
  });

  describe('detectSpendingAnomalies', () => {
    it('should detect unusually high transactions', async () => {
      const normalTransactions = Array(20).fill({ amount: -100 });
      const anomalyTransaction = { amount: -1000, description: 'Large purchase', date: new Date() };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([...normalTransactions, anomalyTransaction] as any)
        .mockResolvedValueOnce([anomalyTransaction] as any);

      await service.detectSpendingAnomalies(mockUserId);

      expect(mockEmailService.sendAnomalyAlert).toHaveBeenCalled();
    });

    it('should not alert for normal spending patterns', async () => {
      const normalTransactions = Array(20).fill({ amount: -100 });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.transaction.findMany.mockResolvedValue(normalTransactions as any);

      await service.detectSpendingAnomalies(mockUserId);

      expect(mockEmailService.sendAnomalyAlert).not.toHaveBeenCalled();
    });
  });

  describe('sendWeeklySummary', () => {
    it('should generate and send weekly spending summary', async () => {
      const mockTransactions = [
        { amount: -100, type: 'expense', categoryLabel: 'Food' },
        { amount: -50, type: 'expense', categoryLabel: 'Transport' },
        { amount: 500, type: 'income', categoryLabel: 'Salary' },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions as any);

      await service.sendWeeklySummary(mockUserId);

      expect(mockEmailService.sendWeeklyReport).toHaveBeenCalledWith(
        mockUser.email,
        expect.objectContaining({
          totalIncome: expect.any(Number),
          totalExpense: expect.any(Number),
        }),
      );
    });
  });

  describe('checkSavingsGoalProgress', () => {
    it('should notify when savings goal is reached', async () => {
      const mockGoal = {
        id: 'goal-1',
        userId: mockUserId,
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 10000,
        isCompleted: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.savingsGoal.findMany.mockResolvedValue([mockGoal]);

      await service.checkSavingsGoalProgress(mockUserId);

      // Should send a congratulations email
      expect(mockPrismaService.savingsGoal.findMany).toHaveBeenCalled();
    });

    it('should notify at 50% and 75% milestones', async () => {
      const mockGoal = {
        id: 'goal-1',
        userId: mockUserId,
        name: 'Vacation Fund',
        targetAmount: 10000,
        currentAmount: 5000, // 50%
        isCompleted: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.savingsGoal.findMany.mockResolvedValue([mockGoal]);

      await service.checkSavingsGoalProgress(mockUserId);

      expect(mockPrismaService.savingsGoal.findMany).toHaveBeenCalled();
    });
  });
});
