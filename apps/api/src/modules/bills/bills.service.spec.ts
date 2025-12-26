import { Test, TestingModule } from '@nestjs/testing';
import { BillsService } from './bills.service';
import { PrismaService } from '../../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('BillsService', () => {
  let service: BillsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    bill: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockBillId = 'bill-123';
  const mockBill = {
    id: mockBillId,
    userId: mockUserId,
    name: 'Netflix',
    amount: 99.99,
    currency: 'TRY',
    dueDate: new Date('2025-01-15'),
    frequency: 'monthly',
    categoryId: 'entertainment',
    categoryLabel: 'Eğlence',
    isPaid: false,
    reminderDays: 3,
    notes: 'Premium plan',
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BillsService>(BillsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new bill', async () => {
      const createDto = {
        name: 'Netflix',
        amount: 99.99,
        currency: 'TRY',
        dueDate: new Date('2025-01-15'),
        frequency: 'monthly',
        categoryId: 'entertainment',
        categoryLabel: 'Eğlence',
        reminderDays: 3,
        notes: 'Premium plan',
      };

      mockPrismaService.bill.create.mockResolvedValue(mockBill);

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockBill);
      expect(mockPrismaService.bill.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          ...createDto,
          currency: 'TRY',
        },
      });
    });

    it('should use default currency if not provided', async () => {
      const createDto = {
        name: 'Netflix',
        amount: 99.99,
        dueDate: new Date('2025-01-15'),
        frequency: 'monthly',
        categoryId: 'entertainment',
        categoryLabel: 'Eğlence',
      };

      mockPrismaService.bill.create.mockResolvedValue(mockBill);

      await service.create(mockUserId, createDto as any);

      expect(mockPrismaService.bill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'TRY',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated bills', async () => {
      const bills = [mockBill];
      mockPrismaService.bill.findMany.mockResolvedValue(bills);
      mockPrismaService.bill.count.mockResolvedValue(1);

      const result = await service.findAll(mockUserId, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        data: bills,
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should filter by isPaid status', async () => {
      mockPrismaService.bill.findMany.mockResolvedValue([mockBill]);
      mockPrismaService.bill.count.mockResolvedValue(1);

      await service.findAll(mockUserId, {
        page: 1,
        limit: 20,
        isPaid: false,
      });

      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPaid: false,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a bill by id', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);

      const result = await service.findOne(mockUserId, mockBillId);

      expect(result).toEqual(mockBill);
      expect(mockPrismaService.bill.findFirst).toHaveBeenCalledWith({
        where: { id: mockBillId, userId: mockUserId },
      });
    });

    it('should throw NotFoundException if bill not found', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, mockBillId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a bill', async () => {
      const updateDto = { amount: 120.0 };
      const updatedBill = { ...mockBill, amount: 120.0 };

      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.bill.update.mockResolvedValue(updatedBill);

      const result = await service.update(mockUserId, mockBillId, updateDto);

      expect(result).toEqual(updatedBill);
      expect(mockPrismaService.bill.update).toHaveBeenCalledWith({
        where: { id: mockBillId },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if bill not found', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockBillId, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsPaid', () => {
    it('should mark bill as paid', async () => {
      const paidBill = { ...mockBill, isPaid: true, paidAt: new Date() };

      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.bill.update.mockResolvedValue(paidBill);

      const result = await service.markAsPaid(mockUserId, mockBillId);

      expect(result).toEqual(paidBill);
      expect(mockPrismaService.bill.update).toHaveBeenCalledWith({
        where: { id: mockBillId },
        data: {
          isPaid: true,
          paidAt: expect.any(Date),
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a bill', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.bill.delete.mockResolvedValue(mockBill);

      await service.remove(mockUserId, mockBillId);

      expect(mockPrismaService.bill.delete).toHaveBeenCalledWith({
        where: { id: mockBillId },
      });
    });

    it('should throw NotFoundException if bill not found', async () => {
      mockPrismaService.bill.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockBillId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return bill statistics', async () => {
      mockPrismaService.bill.count.mockResolvedValue(5);
      mockPrismaService.bill.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
      });

      const result = await service.getStatistics(mockUserId);

      expect(result).toHaveProperty('totalBills');
      expect(result).toHaveProperty('totalAmount');
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming bills', async () => {
      mockPrismaService.bill.findMany.mockResolvedValue([mockBill]);

      const result = await service.getUpcoming(mockUserId, 7);

      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            isPaid: false,
            dueDate: expect.any(Object),
          }),
        }),
      );
    });
  });
});
