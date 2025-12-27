import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { PrismaService } from '../../prisma.service';

describe('DebtsService', () => {
  let service: DebtsService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockDebtId = 'debt-123';

  const mockDebt = {
    id: mockDebtId,
    userId: mockUserId,
    personName: 'Ahmet',
    amount: 500,
    currency: 'TRY',
    type: 'i_owe',
    description: 'Yemek borcu',
    dueDate: new Date('2024-02-15'),
    isPaid: false,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    debt: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new debt', async () => {
      const dto = {
        personName: 'Ahmet',
        amount: 500,
        type: 'i_owe' as const,
        description: 'Yemek borcu',
      };

      mockPrismaService.debt.create.mockResolvedValue(mockDebt);

      const result = await service.create(mockUserId, dto);

      expect(result).toEqual(mockDebt);
      expect(prisma.debt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          personName: dto.personName,
          amount: dto.amount,
          type: dto.type,
        }),
      });
    });

    it('should create debt with default currency TRY', async () => {
      const dto = {
        personName: 'Mehmet',
        amount: 1000,
        type: 'owed_to_me' as const,
      };

      mockPrismaService.debt.create.mockResolvedValue({ ...mockDebt, ...dto });

      await service.create(mockUserId, dto);

      expect(prisma.debt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: 'TRY',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated debts', async () => {
      const debts = [mockDebt];
      mockPrismaService.debt.findMany.mockResolvedValue(debts);
      mockPrismaService.debt.count.mockResolvedValue(1);

      const result = await service.findAll(mockUserId);

      expect(result.data).toEqual(debts);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by type', async () => {
      mockPrismaService.debt.findMany.mockResolvedValue([]);
      mockPrismaService.debt.count.mockResolvedValue(0);

      await service.findAll(mockUserId, { type: 'i_owe' });

      expect(prisma.debt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, type: 'i_owe' },
        }),
      );
    });

    it('should filter by isPaid status', async () => {
      mockPrismaService.debt.findMany.mockResolvedValue([]);
      mockPrismaService.debt.count.mockResolvedValue(0);

      await service.findAll(mockUserId, { isPaid: false });

      expect(prisma.debt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, isPaid: false },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a debt by id', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);

      const result = await service.findOne(mockUserId, mockDebtId);

      expect(result).toEqual(mockDebt);
    });

    it('should throw NotFoundException if debt not found', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a debt', async () => {
      const updateDto = { amount: 750 };
      const updatedDebt = { ...mockDebt, amount: 750 };

      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);
      mockPrismaService.debt.update.mockResolvedValue(updatedDebt);

      const result = await service.update(mockUserId, mockDebtId, updateDto);

      expect(result.amount).toBe(750);
    });

    it('should update dueDate', async () => {
      const updateDto = { dueDate: '2024-03-01' };
      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);
      mockPrismaService.debt.update.mockResolvedValue({ ...mockDebt, dueDate: new Date('2024-03-01') });

      await service.update(mockUserId, mockDebtId, updateDto);

      expect(prisma.debt.update).toHaveBeenCalledWith({
        where: { id: mockDebtId },
        data: expect.objectContaining({
          dueDate: expect.any(Date),
        }),
      });
    });
  });

  describe('remove', () => {
    it('should delete a debt', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);
      mockPrismaService.debt.delete.mockResolvedValue(mockDebt);

      const result = await service.remove(mockUserId, mockDebtId);

      expect(result).toEqual(mockDebt);
      expect(prisma.debt.delete).toHaveBeenCalledWith({
        where: { id: mockDebtId },
      });
    });
  });

  describe('markAsPaid', () => {
    it('should mark a debt as paid', async () => {
      const paidDebt = { ...mockDebt, isPaid: true, paidAt: new Date() };
      mockPrismaService.debt.findFirst.mockResolvedValue(mockDebt);
      mockPrismaService.debt.update.mockResolvedValue(paidDebt);

      const result = await service.markAsPaid(mockUserId, mockDebtId);

      expect(result.isPaid).toBe(true);
      expect(prisma.debt.update).toHaveBeenCalledWith({
        where: { id: mockDebtId },
        data: expect.objectContaining({
          isPaid: true,
          paidAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getSummary', () => {
    it('should return debt summary', async () => {
      mockPrismaService.debt.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000 }, _count: 2 }) // owedToMe
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: 1 }); // iOwe
      mockPrismaService.debt.count.mockResolvedValue(3);

      const result = await service.getSummary(mockUserId);

      expect(result).toEqual({
        owedToMe: { total: 1000, count: 2 },
        iOwe: { total: 500, count: 1 },
        netBalance: 500,
        totalDebts: 3,
      });
    });

    it('should handle null amounts', async () => {
      mockPrismaService.debt.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null }, _count: 0 })
        .mockResolvedValueOnce({ _sum: { amount: null }, _count: 0 });
      mockPrismaService.debt.count.mockResolvedValue(0);

      const result = await service.getSummary(mockUserId);

      expect(result.owedToMe.total).toBe(0);
      expect(result.iOwe.total).toBe(0);
      expect(result.netBalance).toBe(0);
    });
  });
});
