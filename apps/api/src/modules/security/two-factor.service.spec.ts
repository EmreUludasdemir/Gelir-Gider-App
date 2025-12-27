/**
 * Two-Factor Authentication Service Unit Tests - v3.0
 * Kapsamlı 2FA test suite
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '../../prisma.service';
import { createMockUser, createMockPrismaService } from '../../../test/test-utils';

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const userId = 'user-test-123';
  const mockUser = createMockUser();

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    jest.clearAllMocks();
  });

  // ============================================
  // GENERATE SECRET TESTS
  // ============================================
  describe('generateSecret', () => {
    it('should generate a valid base32 secret', () => {
      const secret = service.generateSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
      // Base32 only uses A-Z and 2-7
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it('should generate unique secrets each time', () => {
      const secret1 = service.generateSecret();
      const secret2 = service.generateSecret();

      expect(secret1).not.toBe(secret2);
    });

    it('should generate secrets of consistent length', () => {
      const secret1 = service.generateSecret();
      const secret2 = service.generateSecret();

      // 20 bytes encoded in base32 = 32 characters
      expect(secret1.length).toBe(32);
      expect(secret2.length).toBe(32);
    });
  });

  // ============================================
  // GENERATE QR CODE URL TESTS
  // ============================================
  describe('generateQRCodeUrl', () => {
    it('should generate valid otpauth URL', () => {
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';

      const url = service.generateQRCodeUrl(email, secret);

      expect(url).toContain('otpauth://totp/');
      expect(url).toContain(encodeURIComponent('Gelir-Gider Takip'));
      expect(url).toContain(encodeURIComponent(email));
      expect(url).toContain(`secret=${secret}`);
      expect(url).toContain('digits=6');
      expect(url).toContain('period=30');
    });

    it('should encode email correctly', () => {
      const email = 'user+test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';

      const url = service.generateQRCodeUrl(email, secret);

      expect(url).toContain(encodeURIComponent(email));
    });

    it('should include issuer parameter', () => {
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';

      const url = service.generateQRCodeUrl(email, secret);

      expect(url).toContain('issuer=');
    });
  });

  // ============================================
  // GENERATE TOTP TESTS
  // ============================================
  describe('generateTOTP', () => {
    const testSecret = 'JBSWY3DPEHPK3PXP';

    it('should generate 6-digit code', () => {
      const code = service.generateTOTP(testSecret);

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate consistent code for same timestamp', () => {
      const timestamp = Date.now();
      const code1 = service.generateTOTP(testSecret, timestamp);
      const code2 = service.generateTOTP(testSecret, timestamp);

      expect(code1).toBe(code2);
    });

    it('should generate different codes for different time periods', () => {
      const now = Date.now();
      const future = now + 31000; // 31 seconds later (next period)

      const code1 = service.generateTOTP(testSecret, now);
      const code2 = service.generateTOTP(testSecret, future);

      expect(code1).not.toBe(code2);
    });

    it('should pad code with leading zeros if needed', () => {
      // We can't guarantee a specific code, but we can verify length
      const code = service.generateTOTP(testSecret);

      expect(code.length).toBe(6);
    });
  });

  // ============================================
  // VERIFY TOTP TESTS
  // ============================================
  describe('verifyTOTP', () => {
    const testSecret = 'JBSWY3DPEHPK3PXP';

    it('should verify correct current code', () => {
      const currentCode = service.generateTOTP(testSecret);

      const isValid = service.verifyTOTP(testSecret, currentCode);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect code', () => {
      const isValid = service.verifyTOTP(testSecret, '000000');

      // This might occasionally be true by chance, so we test multiple wrong codes
      const isValid2 = service.verifyTOTP(testSecret, '111111');
      const isValid3 = service.verifyTOTP(testSecret, '999999');

      // At least one should be false (unless extremely unlucky)
      expect(isValid && isValid2 && isValid3).toBe(false);
    });

    it('should accept code from previous time window', () => {
      const pastTimestamp = Date.now() - 30000; // 30 seconds ago
      const pastCode = service.generateTOTP(testSecret, pastTimestamp);

      const isValid = service.verifyTOTP(testSecret, pastCode);

      expect(isValid).toBe(true);
    });

    it('should accept code from next time window', () => {
      const futureTimestamp = Date.now() + 30000; // 30 seconds in future
      const futureCode = service.generateTOTP(testSecret, futureTimestamp);

      const isValid = service.verifyTOTP(testSecret, futureCode);

      expect(isValid).toBe(true);
    });
  });

  // ============================================
  // GENERATE BACKUP CODES TESTS
  // ============================================
  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const { codes, hashedCodes } = service.generateBackupCodes();

      expect(codes).toHaveLength(10);
      expect(hashedCodes).toHaveLength(10);
    });

    it('should generate unique codes', () => {
      const { codes } = service.generateBackupCodes();
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(10);
    });

    it('should generate 8-character hex codes', () => {
      const { codes } = service.generateBackupCodes();

      codes.forEach((code) => {
        expect(code).toMatch(/^[0-9A-F]{8}$/);
      });
    });

    it('should hash codes with SHA256', () => {
      const { hashedCodes } = service.generateBackupCodes();

      hashedCodes.forEach((hash) => {
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
      });
    });

    it('should generate different sets each time', () => {
      const result1 = service.generateBackupCodes();
      const result2 = service.generateBackupCodes();

      expect(result1.codes).not.toEqual(result2.codes);
    });
  });

  // ============================================
  // VERIFY BACKUP CODE TESTS
  // ============================================
  describe('verifyBackupCode', () => {
    it('should verify and consume valid backup code', async () => {
      const { codes, hashedCodes } = service.generateBackupCodes();
      const codeToUse = codes[0];

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        backupCodes: JSON.stringify(hashedCodes),
      });
      prisma.user.update.mockResolvedValue(mockUser);

      const isValid = await service.verifyBackupCode(userId, codeToUse);

      expect(isValid).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          backupCodes: expect.not.stringContaining(hashedCodes[0]),
        },
      });
    });

    it('should reject invalid backup code', async () => {
      const { hashedCodes } = service.generateBackupCodes();

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        backupCodes: JSON.stringify(hashedCodes),
      });

      const isValid = await service.verifyBackupCode(userId, 'INVALID1');

      expect(isValid).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return false when user has no backup codes', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        backupCodes: null,
      });

      const isValid = await service.verifyBackupCode(userId, 'ANYCODE1');

      expect(isValid).toBe(false);
    });

    it('should be case-insensitive for backup codes', async () => {
      const { codes, hashedCodes } = service.generateBackupCodes();
      const codeToUse = codes[0].toLowerCase();

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        backupCodes: JSON.stringify(hashedCodes),
      });
      prisma.user.update.mockResolvedValue(mockUser);

      const isValid = await service.verifyBackupCode(userId, codeToUse);

      expect(isValid).toBe(true);
    });
  });

  // ============================================
  // ENABLE 2FA TESTS
  // ============================================
  describe('enable2FA', () => {
    const testSecret = 'JBSWY3DPEHPK3PXP';

    it('should enable 2FA with valid code', async () => {
      const validCode = service.generateTOTP(testSecret);

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: testSecret,
        twoFactorEnabled: false,
      });
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      });

      const result = await service.enable2FA(userId, validCode);

      expect(result.success).toBe(true);
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes).toHaveLength(10);
    });

    it('should throw BadRequestException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.enable2FA(userId, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when 2FA already enabled', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: testSecret,
      });

      await expect(service.enable2FA(userId, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when 2FA not initiated', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      await expect(service.enable2FA(userId, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException for invalid code', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: testSecret,
        twoFactorEnabled: false,
      });

      await expect(service.enable2FA(userId, '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should store hashed backup codes', async () => {
      const validCode = service.generateTOTP(testSecret);

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: testSecret,
        twoFactorEnabled: false,
      });
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      });

      await service.enable2FA(userId, validCode);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          backupCodes: expect.any(String),
        },
      });
    });
  });

  // ============================================
  // DISABLE 2FA TESTS
  // ============================================
  describe('disable2FA', () => {
    const testSecret = 'JBSWY3DPEHPK3PXP';

    it('should disable 2FA with valid code', async () => {
      const validCode = service.generateTOTP(testSecret);

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true,
      });
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
      });

      const result = await service.disable2FA(userId, validCode);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.disable2FA(userId, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when 2FA not enabled', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
      });

      await expect(service.disable2FA(userId, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException for invalid code', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true,
      });

      await expect(service.disable2FA(userId, '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should clear 2FA data on disable', async () => {
      const validCode = service.generateTOTP(testSecret);

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true,
      });
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
      });

      await service.disable2FA(userId, validCode);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: null,
        },
      });
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle empty secret gracefully', () => {
      expect(() => service.generateTOTP('')).not.toThrow();
    });

    it('should handle special characters in email', () => {
      const email = "user+test'special@example.com";
      const secret = 'JBSWY3DPEHPK3PXP';

      const url = service.generateQRCodeUrl(email, secret);

      expect(url).toContain(encodeURIComponent(email));
    });

    it('should handle database errors', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.verifyBackupCode(userId, 'CODE1234')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
