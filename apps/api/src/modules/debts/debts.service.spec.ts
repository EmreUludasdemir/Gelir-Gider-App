import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from './debts.service';
import { PrismaService } from '../../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('DebtsService', () => {
  let service: DebtsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    debt: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockDebtId = 'debt-123';
  const mockDebt = {
    id: mockDebtId,
    userId: mockUserId,
    personName: 'Ahmet Yılmaz',
    amount: 1000,
    currency: 'TRY',
    type: 'i_owe',
    description: 'Borç aldım',
    dueDate: new Date('2025-02-15'),
    isPaid: false,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new debt', async () => {
      const createDto = {
        personName: 'Ahmet Yılmaz',
        amount: 1000,
        currency: 'TRY',
        type: 'i_owe' as const,
        description: 'Borç aldım',
        dueDate: new Date('2025-02-15'),
      };

      mockPrismaService.debt.create.mockResolvedValue(mockDebt);

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockDebt);
      expect(mockPrismaService.debt.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          ...createDto,
          currency: 'TRY',
        },
      });
    });

    it('should use default currency if not provided', async () => {
      const createDto = {
        personName: 'Ahmet Yılmaz',
        amount: 1000,
        type: 'i_owe' as const,
      };

      mockPrismaService.debt.create.mockResolvedValue(mockDebt);

      await service.create(mockUserId, createDto as any);

      expect(mockPrismaService.debt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'TRY',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated debts', async () => {
      const debts = [mockDebt];
      mockPrismaService.debt.findMany.mockResolvedValue(debts);
      mockPrismaService.debt.count.mockResolvedValue(1);

      const result = await service.findAll(mockUserId, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual(debts);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by debt type', async () => {
      mockPrismaService.debt.findMany.mockResolvedValue([mockDebt]);
      mockPrismaService.debt.count.mockResolvedValue(1);

      await service.findAll(mockUserId, {
        page: 1,
        limit: 20,
        type: 'i_owe',
      });

      expect(mockPrismaService.debt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'i_owe',
          }),
        }),
      );
    });

    it('should filter by isPaid status', async () => {
      mockPrismaService.debt.findMany.mockResolvedValue([mockDebt]);
      mockPrismaService.debt.count.mockResolvedValue(1);

      await service.findAll(mockUserId, {
        page: 1,
        limit: 20,
        isPaid: false,
      });

      expect(mockPrismaService.debt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPaid: false,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a debt by id', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);

      const result = await service.findOne(mockUserId, mockDebtId);

      expect(result).toEqual(mockDebt);
      expect(mockPrismaService.debt.findFirst).toHaveBeenCalledWith({
        where: { id: mockDebtId, userId: mockUserId },
      });
    });

    it('should throw NotFoundException if debt not found', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, mockDebtId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a debt', async () => {
      const updateDto = { amount: 1500 };
      const updatedDebt = { ...mockDebt, amount: 1500 };

      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);
      mockPrismaService.debt.update.mockResolvedValue(updatedDebt);

      const result = await service.update(mockUserId, mockDebtId, updateDto);

      expect(result).toEqual(updatedDebt);
      expect(mockPrismaService.debt.update).toHaveBeenCalledWith({
        where: { id: mockDebtId },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if debt not found', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockDebtId, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsPaid', () => {
    it('should mark debt as paid', async () => {
      const paidDebt = { ...mockDebt, isPaid: true, paidAt: new Date() };

      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);
      mockPrismaService.debt.update.mockResolvedValue(paidDebt);

      const result = await service.markAsPaid(mockUserId, mockDebtId);

      expect(result).toEqual(paidDebt);
      expect(mockPrismaService.debt.update).toHaveBeenCalledWith({
        where: { id: mockDebtId },
        data: {
          isPaid: true,
          paidAt: expect.any(Date),
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a debt', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);
      mockPrismaService.debt.delete.mockResolvedValue(mockDebt);

      await service.remove(mockUserId, mockDebtId);

      expect(mockPrismaService.debt.delete).toHaveBeenCalledWith({
        where: { id: mockDebtId },
      });
    });

    it('should throw NotFoundException if debt not found', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockDebtId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSummary', () => {
    it('should return debt summary', async () => {
      mockPrismaService.debt.groupBy.mockResolvedValue([
        { type: 'i_owe', _sum: { amount: 1000 } },
        { type: 'owed_to_me', _sum: { amount: 500 } },
      ]);

      const result = await service.getSummary(mockUserId);

      expect(result).toHaveProperty('totalOwed');
      expect(result).toHaveProperty('totalOwedToMe');
    });
  });
});
