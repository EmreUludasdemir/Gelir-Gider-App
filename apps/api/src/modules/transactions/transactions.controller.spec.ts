import { Test, TestingModule } from "@nestjs/testing";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

describe("TransactionsController", () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    bulkCategorize: jest.fn(),
    bulkUpdate: jest.fn(),
    delete: jest.fn(),
    getSummary: jest.fn(),
    getSuggestions: jest.fn(),
    getRecurringPayments: jest.fn(),
  };

  const mockUser = { id: "user-123", email: "test@example.com" };

  const mockTransaction = {
    id: "tx-1",
    userId: "user-123",
    description: "Test transaction",
    amount: 100,
    type: "expense",
    categoryId: "market",
    categoryLabel: "Market",
    date: "2024-12-01T00:00:00.000Z",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);

    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return array of transactions", async () => {
      mockTransactionsService.findAll.mockResolvedValue([mockTransaction]);

      const result = await controller.findAll(mockUser, {});

      expect(result).toEqual([mockTransaction]);
      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, {});
    });

    it("should pass query parameters to service", async () => {
      mockTransactionsService.findAll.mockResolvedValue([]);

      await controller.findAll(mockUser, { type: "expense", limit: 10 });

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, {
        type: "expense",
        limit: 10,
      });
    });
  });

  describe("findOne", () => {
    it("should return a single transaction", async () => {
      mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne(mockUser, "tx-1");

      expect(result).toEqual(mockTransaction);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id, "tx-1");
    });
  });

  describe("create", () => {
    it("should create a new transaction", async () => {
      const createDto = {
        date: "2024-12-01",
        description: "New transaction",
        amount: 250,
        type: "expense" as const,
      };

      mockTransactionsService.create.mockResolvedValue({
        ...mockTransaction,
        ...createDto,
      });

      const result = await controller.create(mockUser, createDto);

      expect(result.description).toBe("New transaction");
      expect(service.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });
  });

  describe("update", () => {
    it("should update a transaction", async () => {
      const updateDto = { description: "Updated" };
      mockTransactionsService.update.mockResolvedValue({
        ...mockTransaction,
        description: "Updated",
      });

      const result = await controller.update(mockUser, "tx-1", updateDto);

      expect(result.description).toBe("Updated");
      expect(service.update).toHaveBeenCalledWith(
        mockUser.id,
        "tx-1",
        updateDto
      );
    });
  });

  describe("bulkCategorize", () => {
    it("should bulk categorize selected transactions", async () => {
      mockTransactionsService.bulkCategorize.mockResolvedValue({
        updated: 2,
        matchedSimilar: 0,
      });

      const body = {
        transactionIds: ["tx-1", "tx-2"],
        categoryId: "market",
        categoryLabel: "Market",
        applyToSimilar: true,
      };

      const result = await controller.bulkCategorize(mockUser, body);

      expect(result).toEqual({ updated: 2, matchedSimilar: 0 });
      expect(service.bulkCategorize).toHaveBeenCalledWith(
        mockUser.id,
        body.transactionIds,
        body.categoryId,
        body.categoryLabel,
        { applyToSimilar: true }
      );
    });
  });

  describe("bulkUpdate", () => {
    it("should bulk update selected transactions", async () => {
      mockTransactionsService.bulkUpdate.mockResolvedValue({
        updated: 2,
        matchedSimilar: 0,
      });

      const body = {
        transactionIds: ["tx-1", "tx-2"],
        type: "income" as const,
        tags: ["duzenlendi", "mart"],
      };

      const result = await controller.bulkUpdate(mockUser, body);

      expect(result).toEqual({ updated: 2, matchedSimilar: 0 });
      expect(service.bulkUpdate).toHaveBeenCalledWith(mockUser.id, body);
    });
  });

  describe("delete", () => {
    it("should delete a transaction", async () => {
      mockTransactionsService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete(mockUser, "tx-1");

      expect(result).toEqual({ success: true });
      expect(service.delete).toHaveBeenCalledWith(mockUser.id, "tx-1");
    });
  });

  describe("getSummary", () => {
    it("should return dashboard summary", async () => {
      const mockSummary = {
        totals: { income: 5000, expense: 2000, balance: 3000 },
      };
      mockTransactionsService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary(mockUser, {});

      expect(result).toEqual(mockSummary);
      expect(service.getSummary).toHaveBeenCalledWith(mockUser.id, {});
    });
  });

  describe("getSuggestions", () => {
    it("should return category suggestions", async () => {
      mockTransactionsService.getSuggestions.mockResolvedValue([]);

      await controller.getSuggestions(mockUser);

      expect(service.getSuggestions).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe("getRecurringPayments", () => {
    it("should return recurring payments", async () => {
      mockTransactionsService.getRecurringPayments.mockResolvedValue([]);

      await controller.getRecurringPayments(mockUser);

      expect(service.getRecurringPayments).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
