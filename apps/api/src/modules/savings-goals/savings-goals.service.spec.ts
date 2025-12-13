import { Test, TestingModule } from "@nestjs/testing";
import { SavingsGoalsService } from "./savings-goals.service";
import { PrismaService } from "../../prisma.service";

describe("SavingsGoalsService", () => {
  let service: SavingsGoalsService;
  let prisma: PrismaService;

  const mockPrisma = {
    savingsGoal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavingsGoalsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SavingsGoalsService>(SavingsGoalsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all goals for a user", async () => {
      const userId = "user-123";
      const mockGoals = [
        {
          id: "1",
          userId,
          name: "Vacation Fund",
          targetAmount: 5000,
          currentAmount: 1000,
        },
        {
          id: "2",
          userId,
          name: "Emergency Fund",
          targetAmount: 10000,
          currentAmount: 5000,
        },
      ];

      mockPrisma.savingsGoal.findMany.mockResolvedValue(mockGoals);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockGoals);
      expect(mockPrisma.savingsGoal.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("create", () => {
    it("should create a new savings goal", async () => {
      const userId = "user-123";
      const dto = {
        name: "New Car",
        targetAmount: 50000,
        currentAmount: 5000,
      };

      const mockCreated = {
        id: "goal-1",
        userId,
        ...dto,
        color: "#8B5CF6",
        icon: "🎯",
        deadline: null,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.savingsGoal.create.mockResolvedValue(mockCreated);

      const result = await service.create(userId, dto);

      expect(result).toEqual(mockCreated);
      expect(mockPrisma.savingsGoal.create).toHaveBeenCalled();
    });
  });

  describe("addAmount", () => {
    it("should add amount to goal and mark as completed if target reached", async () => {
      const userId = "user-123";
      const goalId = "goal-1";
      const existingGoal = {
        id: goalId,
        userId,
        name: "Test Goal",
        targetAmount: 1000,
        currentAmount: 900,
        isCompleted: false,
      };

      mockPrisma.savingsGoal.findFirst.mockResolvedValue(existingGoal);
      mockPrisma.savingsGoal.update.mockResolvedValue({
        ...existingGoal,
        currentAmount: 1000,
        isCompleted: true,
      });

      const result = await service.addAmount(goalId, userId, 100);

      expect(result.currentAmount).toBe(1000);
      expect(result.isCompleted).toBe(true);
    });
  });

  describe("getSummary", () => {
    it("should calculate correct summary statistics", async () => {
      const userId = "user-123";
      const mockGoals = [
        {
          id: "1",
          targetAmount: 5000,
          currentAmount: 2500,
          isCompleted: false,
        },
        {
          id: "2",
          targetAmount: 10000,
          currentAmount: 10000,
          isCompleted: true,
        },
      ];

      mockPrisma.savingsGoal.findMany.mockResolvedValue(mockGoals);

      const result = await service.getSummary(userId);

      expect(result.totalGoals).toBe(2);
      expect(result.completedGoals).toBe(1);
      expect(result.totalTarget).toBe(15000);
      expect(result.totalCurrent).toBe(12500);
      expect(result.overallProgress).toBe(83);
    });
  });
});
