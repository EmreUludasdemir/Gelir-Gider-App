import { Test, TestingModule } from "@nestjs/testing";
import { TransactionsService } from "./transactions.service";
import { PrismaService } from "../../prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("TransactionsService", () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserId = "user-123";
  const mockTransaction = {
    id: "tx-1",
    userId: mockUserId,
    accountId: "default",
    date: new Date("2024-12-01"),
    description: "Test transaction",
    amount: 100,
    currency: "TRY",
    source: "manual",
    type: "expense",
    categoryId: "market",
    categoryLabel: "Market",
    confidence: 100,
    tags: "[]",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all transactions for a user", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("tx-1");
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
        })
      );
    });

    it("should filter by type when provided", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, { type: "income" });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "income" }),
        })
      );
    });

    it("should filter by categoryId when provided", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, { categoryId: "market" });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: "market" }),
        })
      );
    });

    it("should filter by date range when provided", async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, {
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
      });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe("findOne", () => {
    it("should return a single transaction", async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(
        mockTransaction
      );

      const result = await service.findOne(mockUserId, "tx-1");

      expect(result.id).toBe("tx-1");
      expect(result.description).toBe("Test transaction");
    });

    it("should throw NotFoundException when transaction not found", async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, "not-exist")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("create", () => {
    it("should create a new transaction with auto-categorization", async () => {
      const createDto = {
        date: "2024-12-01",
        description: "Migros alışveriş",
        amount: 250,
        type: "expense" as const,
      };

      mockPrismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        description: createDto.description,
        amount: createDto.amount,
      });

      const result = await service.create(mockUserId, createDto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            description: createDto.description,
            amount: createDto.amount,
          }),
        })
      );
      expect(result).toBeDefined();
    });

    it("should use provided category when given", async () => {
      const createDto = {
        date: "2024-12-01",
        description: "Custom purchase",
        amount: 100,
        type: "expense" as const,
        categoryId: "shopping",
        categoryLabel: "Alışveriş",
      };

      mockPrismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        categoryId: "shopping",
        categoryLabel: "Alışveriş",
      });

      await service.create(mockUserId, createDto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: "shopping",
            categoryLabel: "Alışveriş",
          }),
        })
      );
    });
  });

  describe("update", () => {
    it("should update transaction fields", async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(
        mockTransaction
      );
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        description: "Updated description",
      });

      const result = await service.update(mockUserId, "tx-1", {
        description: "Updated description",
      });

      expect(result.description).toBe("Updated description");
      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tx-1" },
          data: expect.objectContaining({ description: "Updated description" }),
        })
      );
    });

    it("should throw NotFoundException when updating non-existent transaction", async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, "not-exist", { description: "test" })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete a transaction", async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(
        mockTransaction
      );
      mockPrismaService.transaction.delete.mockResolvedValue(mockTransaction);

      const result = await service.delete(mockUserId, "tx-1");

      expect(result).toEqual({ success: true });
      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: "tx-1" },
      });
    });

    it("should throw NotFoundException when deleting non-existent transaction", async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(service.delete(mockUserId, "not-exist")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("getSummary", () => {
    it("should calculate correct totals", async () => {
      const transactions = [
        { ...mockTransaction, type: "income", amount: 5000 },
        { ...mockTransaction, id: "tx-2", type: "expense", amount: -1500 },
        { ...mockTransaction, id: "tx-3", type: "expense", amount: -500 },
      ];

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce(transactions) // current month
        .mockResolvedValueOnce([]) // previous month
        .mockResolvedValueOnce([]) // week 1
        .mockResolvedValueOnce([]) // week 2
        .mockResolvedValueOnce([]) // week 3
        .mockResolvedValueOnce([]); // week 4

      const result = await service.getSummary(mockUserId);

      expect(result.totals.income).toBe(5000);
      expect(result.totals.expense).toBe(2000);
      expect(result.totals.balance).toBe(3000);
      expect(result.totals.transactionCount).toBe(3);
    });
  });
});
