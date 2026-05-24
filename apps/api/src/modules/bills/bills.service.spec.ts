import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BillsService } from './bills.service';
import { PrismaService } from '../../prisma.service';
import { RedisService } from '../../redis.service';

describe('BillsService', () => {
  let service: BillsService;
  let prisma: PrismaService;
  let redis: ReturnType<typeof createMockRedisService>;

  const mockUserId = 'user-123';
  const mockBillId = 'bill-123';

  const mockBill = {
    id: mockBillId,
    userId: mockUserId,
    name: 'Elektrik Faturası',
    amount: 250,
    currency: 'TRY',
    dueDate: new Date('2024-01-15'),
    frequency: 'monthly',
    categoryId: 'utilities',
    categoryLabel: 'Faturalar',
    reminderDays: 3,
    notes: null,
    isPaid: false,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    bill: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const createMockRedisService = () => ({
    del: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(async () => {
    redis = createMockRedisService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<BillsService>(BillsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new bill', async () => {
      const dto = {
        name: 'Elektrik Faturası',
        amount: 250,
        dueDate: '2024-01-15',
        categoryId: 'utilities',
        categoryLabel: 'Faturalar',
      };

      mockPrismaService.bill.create.mockResolvedValue(mockBill);

      const result = await service.create(mockUserId, dto);

      expect(result).toEqual(mockBill);
      expect(prisma.bill.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          name: dto.name,
          amount: dto.amount,
        }),
      });
      expect(redis.del).toHaveBeenCalledWith(`analytics:action-feed:${mockUserId}`);
    });
  });

  describe('findAll', () => {
    it('should return paginated bills', async () => {
      const bills = [mockBill];
      mockPrismaService.bill.findMany.mockResolvedValue(bills);
      mockPrismaService.bill.count.mockResolvedValue(1);

      const result = await service.findAll(mockUserId);

      expect(result.data).toEqual(bills);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by isPaid status', async () => {
      mockPrismaService.bill.findMany.mockResolvedValue([]);
      mockPrismaService.bill.count.mockResolvedValue(0);

      await service.findAll(mockUserId, { isPaid: false });

      expect(prisma.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, isPaid: false },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a bill by id', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);

      const result = await service.findOne(mockUserId, mockBillId);

      expect(result).toEqual(mockBill);
    });

    it('should throw NotFoundException if bill not found', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a bill', async () => {
      const updateDto = { amount: 300 };
      const updatedBill = { ...mockBill, amount: 300 };

      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.bill.update.mockResolvedValue(updatedBill);

      const result = await service.update(mockUserId, mockBillId, updateDto);

      expect(result.amount).toBe(300);
      expect(redis.del).toHaveBeenCalledWith(`analytics:action-feed:${mockUserId}`);
    });
  });

  describe('remove', () => {
    it('should delete a bill', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.bill.delete.mockResolvedValue(mockBill);

      const result = await service.remove(mockUserId, mockBillId);

      expect(result).toEqual(mockBill);
      expect(prisma.bill.delete).toHaveBeenCalledWith({
        where: { id: mockBillId },
      });
      expect(redis.del).toHaveBeenCalledWith(`analytics:action-feed:${mockUserId}`);
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming unpaid bills', async () => {
      const upcomingBills = [mockBill];
      mockPrismaService.bill.findMany.mockResolvedValue(upcomingBills);

      const result = await service.getUpcoming(mockUserId, 7);

      expect(result).toEqual(upcomingBills);
      expect(prisma.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            isPaid: false,
          }),
        }),
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark a bill as paid', async () => {
      const paidBill = { ...mockBill, isPaid: true, frequency: 'once' };
      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.bill.update.mockResolvedValue(paidBill);

      const result = await service.markAsPaid(mockUserId, mockBillId);

      expect(result.isPaid).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(`analytics:action-feed:${mockUserId}`);
    });

    it('should create next recurring bill for monthly frequency', async () => {
      const monthlyBill = { ...mockBill, frequency: 'monthly' };
      const paidBill = { ...monthlyBill, isPaid: true };

      mockPrismaService.bill.findFirst.mockResolvedValue(monthlyBill);
      mockPrismaService.bill.update.mockResolvedValue(paidBill);
      mockPrismaService.bill.create.mockResolvedValue({
        ...monthlyBill,
        id: 'new-bill-id',
      });

      await service.markAsPaid(mockUserId, mockBillId);

      expect(prisma.bill.create).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return bill statistics', async () => {
      mockPrismaService.bill.count
        .mockResolvedValueOnce(5) // totalBills
        .mockResolvedValueOnce(2); // unpaidBills
      mockPrismaService.bill.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000 } }) // totalAmount
        .mockResolvedValueOnce({ _sum: { amount: 400 } }); // upcomingAmount

      const result = await service.getStatistics(mockUserId);

      expect(result).toEqual({
        totalBills: 5,
        unpaidBills: 2,
        totalAmount: 1000,
        upcomingAmount: 400,
      });
    });

    it('should handle null amounts', async () => {
      mockPrismaService.bill.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.bill.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service.getStatistics(mockUserId);

      expect(result.totalAmount).toBe(0);
      expect(result.upcomingAmount).toBe(0);
    });
  });
});
