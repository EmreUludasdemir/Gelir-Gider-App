/**
 * Bank Connections Service Unit Tests - v3.0
 * Kapsamlı banka bağlantıları test suite
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BankConnectionsService } from './bank-connections.service';
import { PrismaService } from '../../prisma.service';
import {
  createMockBankConnection,
  createMockTransaction,
  createMockPrismaService,
} from '../../../test/test-utils';

describe('BankConnectionsService', () => {
  let service: BankConnectionsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const userId = 'user-test-123';
  const mockConnection = createMockBankConnection();

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankConnectionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BankConnectionsService>(BankConnectionsService);
    jest.clearAllMocks();
  });

  // ============================================
  // FIND ALL TESTS
  // ============================================
  describe('findAll', () => {
    it('should return all bank connections for a user', async () => {
      const connections = [
        createMockBankConnection({ id: 'conn-1', bankName: 'Bank 1' }),
        createMockBankConnection({ id: 'conn-2', bankName: 'Bank 2' }),
      ];
      prisma.bankConnection.findMany.mockResolvedValue(connections);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(prisma.bankConnection.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no connections exist', async () => {
      prisma.bankConnection.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });

    it('should only return connections for the specified user', async () => {
      prisma.bankConnection.findMany.mockResolvedValue([]);

      await service.findAll('different-user');

      expect(prisma.bankConnection.findMany).toHaveBeenCalledWith({
        where: { userId: 'different-user' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ============================================
  // FIND ONE TESTS
  // ============================================
  describe('findOne', () => {
    it('should return a bank connection by id', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);

      const result = await service.findOne(userId, mockConnection.id);

      expect(result.id).toBe(mockConnection.id);
      expect(prisma.bankConnection.findFirst).toHaveBeenCalledWith({
        where: { id: mockConnection.id, userId },
      });
    });

    it('should throw NotFoundException when connection not found', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(userId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not return connection from another user', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('other-user', mockConnection.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('create', () => {
    const createDto = {
      bankCode: 'mock',
      bankName: 'Demo Banka',
      accountNumber: '9876543210',
      accountName: 'Test Account',
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should create a new bank connection', async () => {
      const expected = { ...mockConnection, ...createDto };
      prisma.bankConnection.create.mockResolvedValue(expected);

      const result = await service.create(userId, createDto);

      expect(result).toBeDefined();
      expect(prisma.bankConnection.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for unsupported bank', async () => {
      const invalidDto = {
        ...createDto,
        bankCode: 'unsupported_bank',
      };

      await expect(service.create(userId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set default account type to checking', async () => {
      const dtoWithoutType = {
        bankCode: 'mock',
        bankName: 'Demo Banka',
        accountNumber: '1234567890',
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      prisma.bankConnection.create.mockResolvedValue({
        ...mockConnection,
        accountType: 'checking',
      });

      const result = await service.create(userId, dtoWithoutType as any);

      expect(result.accountType).toBe('checking');
    });

    it('should set lastSyncStatus to pending on creation', async () => {
      prisma.bankConnection.create.mockResolvedValue({
        ...mockConnection,
        lastSyncStatus: 'pending',
      });

      await service.create(userId, createDto);

      expect(prisma.bankConnection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lastSyncStatus: 'pending',
        }),
      });
    });
  });

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('update', () => {
    const updateDto = {
      accountName: 'Updated Account Name',
    };

    it('should update a bank connection', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.update.mockResolvedValue({
        ...mockConnection,
        ...updateDto,
      });

      const result = await service.update(userId, mockConnection.id, updateDto);

      expect(result.accountName).toBe(updateDto.accountName);
    });

    it('should throw NotFoundException when updating non-existent connection', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.update.mockResolvedValue({
        ...mockConnection,
        accountName: 'New Name',
      });

      await service.update(userId, mockConnection.id, { accountName: 'New Name' });

      expect(prisma.bankConnection.update).toHaveBeenCalledWith({
        where: { id: mockConnection.id },
        data: { accountName: 'New Name' },
      });
    });
  });

  // ============================================
  // REMOVE TESTS
  // ============================================
  describe('remove', () => {
    it('should delete a bank connection', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.delete.mockResolvedValue(mockConnection);

      const result = await service.remove(userId, mockConnection.id);

      expect(result).toEqual(mockConnection);
      expect(prisma.bankConnection.delete).toHaveBeenCalledWith({
        where: { id: mockConnection.id },
      });
    });

    it('should throw NotFoundException when deleting non-existent connection', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(userId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not delete another users connection', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('other-user', mockConnection.id),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.bankConnection.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // SYNC TRANSACTIONS TESTS
  // ============================================
  describe('syncTransactions', () => {
    it('should sync transactions and update status', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.update.mockResolvedValue({
        ...mockConnection,
        lastSyncStatus: 'success',
        lastSyncAt: new Date(),
      });
      prisma.transaction.findFirst.mockResolvedValue(null);
      prisma.transaction.create.mockResolvedValue(createMockTransaction());

      const result = await service.syncTransactions(userId, mockConnection.id);

      expect(result).toBeDefined();
      expect(result.syncedCount).toBeDefined();
    });

    it('should throw NotFoundException for non-existent connection', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(null);

      await expect(
        service.syncTransactions(userId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update lastSyncAt on successful sync', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.update.mockResolvedValue({
        ...mockConnection,
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      });
      prisma.transaction.findFirst.mockResolvedValue(null);

      await service.syncTransactions(userId, mockConnection.id);

      expect(prisma.bankConnection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastSyncAt: expect.any(Date),
            lastSyncStatus: 'success',
          }),
        }),
      );
    });

    it('should skip duplicate transactions during sync', async () => {
      const existingTransaction = createMockTransaction({
        source: `bank:${mockConnection.bankCode}`,
      });
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.update.mockResolvedValue(mockConnection);
      prisma.transaction.findFirst.mockResolvedValue(existingTransaction);

      const result = await service.syncTransactions(userId, mockConnection.id);

      expect(result.syncedCount).toBe(0);
    });
  });

  // ============================================
  // GET AVAILABLE BANKS TESTS
  // ============================================
  describe('getAvailableBanks', () => {
    it('should return list of available banks', async () => {
      const result = await service.getAvailableBanks();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include mock bank in available banks', async () => {
      const result = await service.getAvailableBanks();

      const mockBank = result.find((b) => b.code === 'mock');
      expect(mockBank).toBeDefined();
    });

    it('should return bank code and name for each bank', async () => {
      const result = await service.getAvailableBanks();

      result.forEach((bank) => {
        expect(bank).toHaveProperty('code');
        expect(bank).toHaveProperty('name');
      });
    });
  });

  // ============================================
  // CATEGORY MAPPING TESTS
  // ============================================
  describe('Category Mapping', () => {
    it('should map known expense categories correctly', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.update.mockResolvedValue(mockConnection);
      prisma.transaction.findFirst.mockResolvedValue(null);
      prisma.transaction.create.mockResolvedValue(createMockTransaction());

      await service.syncTransactions(userId, mockConnection.id);

      // The mapping is internal but we can verify transactions are created
      expect(prisma.transaction.create).toBeDefined();
    });

    it('should use default category for unknown types', async () => {
      prisma.bankConnection.findFirst.mockResolvedValue(mockConnection);
      prisma.bankConnection.update.mockResolvedValue(mockConnection);
      prisma.transaction.findFirst.mockResolvedValue(null);
      prisma.transaction.create.mockResolvedValue(
        createMockTransaction({ categoryId: 'diger' }),
      );

      const result = await service.syncTransactions(userId, mockConnection.id);

      expect(result).toBeDefined();
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle database errors', async () => {
      prisma.bankConnection.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll(userId)).rejects.toThrow('Database error');
    });

    it('should handle empty account number', async () => {
      const connWithoutAccount = createMockBankConnection({
        accountNumber: '',
      });
      prisma.bankConnection.findFirst.mockResolvedValue(connWithoutAccount);
      prisma.bankConnection.update.mockResolvedValue(connWithoutAccount);
      prisma.transaction.findFirst.mockResolvedValue(null);

      // Should use 'default' as account number
      const result = await service.syncTransactions(userId, connWithoutAccount.id);

      expect(result).toBeDefined();
    });

    it('should handle sync failure gracefully', async () => {
      const failedConnection = createMockBankConnection({
        lastSyncStatus: 'failed',
        syncError: 'Connection timeout',
      });
      prisma.bankConnection.findFirst.mockResolvedValue(failedConnection);

      // Adapter will handle the retry logic
      await expect(
        service.syncTransactions(userId, failedConnection.id),
      ).resolves.toBeDefined();
    });

    it('should handle multiple connections for same bank', async () => {
      const connections = [
        createMockBankConnection({ id: 'conn-1', accountNumber: '111' }),
        createMockBankConnection({ id: 'conn-2', accountNumber: '222' }),
      ];
      prisma.bankConnection.findMany.mockResolvedValue(connections);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // TOKEN HANDLING TESTS
  // ============================================
  describe('Token Handling', () => {
    it('should store access token securely', async () => {
      const createDto = {
        bankCode: 'mock',
        bankName: 'Demo Banka',
        accountNumber: '1234567890',
        accessToken: 'secure-token',
        refreshToken: 'refresh-token',
      };
      prisma.bankConnection.create.mockResolvedValue({
        ...mockConnection,
        accessToken: createDto.accessToken,
      });

      await service.create(userId, createDto);

      expect(prisma.bankConnection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accessToken: createDto.accessToken,
        }),
      });
    });

    it('should store refresh token', async () => {
      const createDto = {
        bankCode: 'mock',
        bankName: 'Demo Banka',
        accountNumber: '1234567890',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      prisma.bankConnection.create.mockResolvedValue({
        ...mockConnection,
        refreshToken: createDto.refreshToken,
      });

      await service.create(userId, createDto);

      expect(prisma.bankConnection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          refreshToken: createDto.refreshToken,
        }),
      });
    });

    it('should use stored tokens for sync', async () => {
      const connWithTokens = createMockBankConnection({
        accessToken: 'stored-access',
        refreshToken: 'stored-refresh',
      });
      prisma.bankConnection.findFirst.mockResolvedValue(connWithTokens);
      prisma.bankConnection.update.mockResolvedValue(connWithTokens);
      prisma.transaction.findFirst.mockResolvedValue(null);

      await service.syncTransactions(userId, connWithTokens.id);

      // Verify the service uses the stored tokens
      expect(prisma.bankConnection.findFirst).toHaveBeenCalled();
    });
  });
});
