/**
 * Credit Cards Service Unit Tests - v3.0
 * Kapsamlı kredi kartı test suite
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreditCardService } from './credit-cards.service';
import { PrismaService } from '../../prisma.service';
import {
  createMockCreditCard,
  createMockPrismaService,
} from '../../../test/test-utils';
import type { UpdateCreditCardDto } from './dto/credit-card.dto';

describe('CreditCardService', () => {
  let service: CreditCardService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const userId = 'user-test-123';
  const mockCard = createMockCreditCard();

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditCardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CreditCardService>(CreditCardService);
    jest.clearAllMocks();
  });

  // ============================================
  // FIND ALL TESTS
  // ============================================
  describe('findAll', () => {
    it('should return all credit cards for a user', async () => {
      const cards = [
        createMockCreditCard({ id: 'card-1', name: 'Kart 1' }),
        createMockCreditCard({ id: 'card-2', name: 'Kart 2' }),
      ];
      prisma.creditCard.findMany.mockResolvedValue(cards);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(prisma.creditCard.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no cards exist', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });

    it('should only return cards for the specified user', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      await service.findAll('different-user');

      expect(prisma.creditCard.findMany).toHaveBeenCalledWith({
        where: { userId: 'different-user' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ============================================
  // FIND ONE TESTS
  // ============================================
  describe('findOne', () => {
    it('should return a credit card by id', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(mockCard);

      const result = await service.findOne(mockCard.id, userId);

      expect(result.id).toBe(mockCard.id);
      expect(prisma.creditCard.findFirst).toHaveBeenCalledWith({
        where: { id: mockCard.id, userId },
      });
    });

    it('should throw NotFoundException when card not found', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return card from another user', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockCard.id, 'other-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('create', () => {
    const createDto = {
      name: 'Yeni Kart',
      lastFourDigits: '5678',
      creditLimit: 15000,
      cardType: 'mastercard',
    };

    it('should create a new credit card with valid data', async () => {
      const expected = { ...mockCard, ...createDto };
      prisma.creditCard.create.mockResolvedValue(expected);

      const result = await service.create(userId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(prisma.creditCard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: createDto.name,
          lastFourDigits: createDto.lastFourDigits,
          creditLimit: createDto.creditLimit,
        }),
      });
    });

    it('should set default values when not provided', async () => {
      const minDto = {
        name: 'Minimal Kart',
        lastFourDigits: '9999',
        creditLimit: 5000,
      };
      prisma.creditCard.create.mockResolvedValue({
        ...mockCard,
        ...minDto,
        cardType: 'visa',
        currentBalance: 0,
        billingDay: 1,
        dueDay: 15,
        interestRate: 0,
        color: '#1F2937',
      });

      await service.create(userId, minDto);

      expect(prisma.creditCard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardType: 'visa',
          currentBalance: 0,
          billingDay: 1,
          dueDay: 15,
          interestRate: 0,
          color: '#1F2937',
        }),
      });
    });

    it('should use provided cardType instead of default', async () => {
      const dtoWithType = { ...createDto, cardType: 'amex' };
      prisma.creditCard.create.mockResolvedValue({ ...mockCard, cardType: 'amex' });

      await service.create(userId, dtoWithType);

      expect(prisma.creditCard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardType: 'amex',
        }),
      });
    });
  });

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('update', () => {
    const updateDto: UpdateCreditCardDto = {
      name: 'Güncellenmiş Kart',
      creditLimit: 20000,
    };

    it('should update a credit card', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(mockCard);
      prisma.creditCard.update.mockResolvedValue({ ...mockCard, ...updateDto });

      const result = await service.update(mockCard.id, userId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.creditLimit).toBe(updateDto.creditLimit);
    });

    it('should throw NotFoundException when updating non-existent card', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', userId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(mockCard);
      prisma.creditCard.update.mockResolvedValue({ ...mockCard, name: 'Yeni İsim' });

      await service.update(mockCard.id, userId, { name: 'Yeni İsim' });

      expect(prisma.creditCard.update).toHaveBeenCalledWith({
        where: { id: mockCard.id },
        data: { name: 'Yeni İsim' },
      });
    });
  });

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('delete', () => {
    it('should delete a credit card', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(mockCard);
      prisma.creditCard.delete.mockResolvedValue(mockCard);

      const result = await service.delete(mockCard.id, userId);

      expect(result).toEqual(mockCard);
      expect(prisma.creditCard.delete).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
    });

    it('should throw NotFoundException when deleting non-existent card', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.delete('non-existent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not delete another users card', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(
        service.delete(mockCard.id, 'other-user'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.creditCard.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // ADD EXPENSE TESTS
  // ============================================
  describe('addExpense', () => {
    it('should add expense to card balance', async () => {
      const card = createMockCreditCard({ currentBalance: 1000, creditLimit: 10000 });
      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.creditCard.update.mockResolvedValue({ ...card, currentBalance: 1500 });

      const result = await service.addExpense(card.id, userId, 500);

      expect(result.currentBalance).toBe(1500);
      expect(prisma.creditCard.update).toHaveBeenCalledWith({
        where: { id: card.id },
        data: { currentBalance: 1500 },
      });
    });

    it('should throw BadRequestException when expense exceeds limit', async () => {
      const card = createMockCreditCard({ currentBalance: 9000, creditLimit: 10000 });
      prisma.creditCard.findFirst.mockResolvedValue(card);

      await expect(
        service.addExpense(card.id, userId, 2000),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.creditCard.update).not.toHaveBeenCalled();
    });

    it('should allow expense that exactly reaches limit', async () => {
      const card = createMockCreditCard({ currentBalance: 5000, creditLimit: 10000 });
      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.creditCard.update.mockResolvedValue({ ...card, currentBalance: 10000 });

      const result = await service.addExpense(card.id, userId, 5000);

      expect(result.currentBalance).toBe(10000);
    });
  });

  // ============================================
  // MAKE PAYMENT TESTS
  // ============================================
  describe('makePayment', () => {
    it('should reduce card balance', async () => {
      const card = createMockCreditCard({ currentBalance: 5000 });
      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.creditCard.update.mockResolvedValue({ ...card, currentBalance: 3000 });

      const result = await service.makePayment(card.id, userId, 2000);

      expect(result.currentBalance).toBe(3000);
    });

    it('should not allow negative balance', async () => {
      const card = createMockCreditCard({ currentBalance: 1000 });
      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.creditCard.update.mockResolvedValue({ ...card, currentBalance: 0 });

      await service.makePayment(card.id, userId, 2000);

      expect(prisma.creditCard.update).toHaveBeenCalledWith({
        where: { id: card.id },
        data: { currentBalance: 0 },
      });
    });

    it('should set balance to zero when payment equals balance', async () => {
      const card = createMockCreditCard({ currentBalance: 1000 });
      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.creditCard.update.mockResolvedValue({ ...card, currentBalance: 0 });

      const result = await service.makePayment(card.id, userId, 1000);

      expect(result.currentBalance).toBe(0);
    });
  });

  // ============================================
  // GET SUMMARY TESTS
  // ============================================
  describe('getSummary', () => {
    it('should calculate correct totals', async () => {
      const cards = [
        createMockCreditCard({ creditLimit: 10000, currentBalance: 2000, isActive: true, dueDay: 25 }),
        createMockCreditCard({ creditLimit: 15000, currentBalance: 5000, isActive: true, dueDay: 25 }),
      ];
      prisma.creditCard.findMany.mockResolvedValue(cards);

      const result = await service.getSummary(userId);

      expect(result.totalCards).toBe(2);
      expect(result.totalLimit).toBe(25000);
      expect(result.totalBalance).toBe(7000);
      expect(result.availableCredit).toBe(18000);
      expect(result.utilizationRate).toBe(28);
    });

    it('should return zero utilization when no limit', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      const result = await service.getSummary(userId);

      expect(result.utilizationRate).toBe(0);
    });

    it('should only include active cards', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      await service.getSummary(userId);

      expect(prisma.creditCard.findMany).toHaveBeenCalledWith({
        where: { userId, isActive: true },
      });
    });

    it('should identify cards with upcoming due dates', async () => {
      const today = new Date().getDate();
      const upcomingDue = today + 3 > 30 ? (today + 3) - 30 : today + 3;

      const cards = [
        createMockCreditCard({
          dueDay: upcomingDue,
          currentBalance: 1000,
          isActive: true,
          name: 'Yaklaşan Ödeme',
        }),
      ];
      prisma.creditCard.findMany.mockResolvedValue(cards);

      const result = await service.getSummary(userId);

      expect(result.upcomingPayments).toBeDefined();
      expect(Array.isArray(result.upcomingPayments)).toBe(true);
    });
  });

  // ============================================
  // CALCULATE INSTALLMENT TESTS
  // ============================================
  describe('calculateInstallment', () => {
    it('should calculate zero-interest installment correctly', async () => {
      const result = service.calculateInstallment(1200, 12, 0);

      expect(result.monthlyPayment).toBe(100);
      expect(result.totalPayment).toBe(1200);
      expect(result.totalInterest).toBe(0);
    });

    it('should calculate interest-bearing installment correctly', async () => {
      const result = service.calculateInstallment(10000, 12, 24);

      expect(result.monthlyPayment).toBeGreaterThan(10000 / 12);
      expect(result.totalPayment).toBeGreaterThan(10000);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it('should round values to 2 decimal places', async () => {
      const result = service.calculateInstallment(1000, 3, 12);

      expect(result.monthlyPayment.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(result.totalPayment.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(result.totalInterest.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    });

    it('should handle single month installment', async () => {
      const result = service.calculateInstallment(1000, 1, 0);

      expect(result.monthlyPayment).toBe(1000);
      expect(result.totalPayment).toBe(1000);
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle very large credit limits', async () => {
      const card = createMockCreditCard({ creditLimit: 999999999 });
      prisma.creditCard.findFirst.mockResolvedValue(card);

      const result = await service.findOne(card.id, userId);

      expect(result.creditLimit).toBe(999999999);
    });

    it('should handle zero balance', async () => {
      const card = createMockCreditCard({ currentBalance: 0 });
      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.creditCard.update.mockResolvedValue({ ...card, currentBalance: 100 });

      const result = await service.addExpense(card.id, userId, 100);

      expect(result.currentBalance).toBe(100);
    });

    it('should handle database errors', async () => {
      prisma.creditCard.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(userId)).rejects.toThrow('Database error');
    });
  });
});
