/**
 * Auth Service Unit Tests - FAZ 3
 * Kapsamlı authentication test suite
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailService } from '../notifications/email.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { createMockUser, createMockPrismaService, createMockJwtService, createMockEmailService } from '../../../test/test-utils';

jest.mock('bcrypt');
jest.mock('speakeasy');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let emailService: ReturnType<typeof createMockEmailService>;

  const mockUser = createMockUser();

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = createMockJwtService();
    emailService = createMockEmailService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  // ============================================
  // REGISTER TESTS
  // ============================================
  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'SecurePass123!',
      name: 'New User',
    };

    it('should successfully register a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });

      const result = await service.register(registerDto);

      expect(result.email).toBe(registerDto.email);
      expect(result.name).toBe(registerDto.name);
      expect(result).not.toHaveProperty('password');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerDto.email,
            password: 'hashed-password',
          }),
        }),
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with bcrypt salt rounds 12', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 'salt');
    });

    it('should register user without optional name', async () => {
      const dtoWithoutName = { email: 'noname@example.com', password: 'SecurePass123!' };
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({ ...mockUser, name: null });

      const result = await service.register(dtoWithoutName);

      expect(result).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  // ============================================
  // LOGIN TESTS
  // ============================================
  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return tokens on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should require 2FA code when 2FA is enabled', async () => {
      const userWith2FA = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      });
      prisma.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should validate 2FA code when provided', async () => {
      const userWith2FA = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      });
      prisma.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await service.login({
        ...loginDto,
        twoFactorCode: '123456',
      });

      expect(result).toHaveProperty('accessToken');
      expect(speakeasy.totp.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          secret: 'secret',
          token: '123456',
        }),
      );
    });

    it('should throw UnauthorizedException for invalid 2FA code', async () => {
      const userWith2FA = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      });
      prisma.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(
        service.login({
          ...loginDto,
          twoFactorCode: 'invalid',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================
  // REFRESH TOKEN TESTS
  // ============================================
  describe('refreshToken', () => {
    it('should return new tokens with valid refresh token', async () => {
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'refresh',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshToken({ refreshToken: 'valid-refresh-token' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'access', // wrong type
      });

      await expect(
        service.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'non-existent-id',
        email: 'test@example.com',
        type: 'refresh',
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'valid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(
        service.refreshToken({ refreshToken: 'expired-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================
  // CHANGE PASSWORD TESTS
  // ============================================
  describe('changePassword', () => {
    const changePasswordDto = {
      oldPassword: 'oldPassword123',
      newPassword: 'newSecurePass456!',
    };

    it('should successfully change password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({ ...mockUser, password: 'new-hashed-password' });

      const result = await service.changePassword(mockUser.id, changePasswordDto);

      expect(result).toHaveProperty('message');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: 'new-hashed-password' },
      });
    });

    it('should throw BadRequestException for wrong current password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent-id', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // 2FA TESTS
  // ============================================
  describe('Two-Factor Authentication', () => {
    describe('generate2FASecret', () => {
      it('should generate 2FA secret and QR code', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser);
        (speakeasy.generateSecret as jest.Mock).mockReturnValue({
          base32: 'GENERATED_SECRET',
          otpauth_url: 'otpauth://totp/App:test@example.com?secret=GENERATED_SECRET',
        });

        const result = await service.generate2FASecret(mockUser.id);

        expect(result).toHaveProperty('secret');
        expect(result).toHaveProperty('qrCode');
      });
    });

    describe('enable2FA', () => {
      it('should enable 2FA with valid token and secret', async () => {
        const userWithSecret = createMockUser({
          twoFactorSecret: null,
          twoFactorEnabled: false,
        });
        prisma.user.findUnique.mockResolvedValue(userWithSecret);
        (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
        prisma.user.update.mockResolvedValue({ ...userWithSecret, twoFactorEnabled: true });

        const result = await service.enable2FA(mockUser.id, '123456', 'TEMP_SECRET');

        expect(result).toHaveProperty('message');
        expect(prisma.user.update).toHaveBeenCalled();
      });

      it('should reject invalid 2FA token', async () => {
        const userWithSecret = createMockUser({
          twoFactorSecret: null,
        });
        prisma.user.findUnique.mockResolvedValue(userWithSecret);
        (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

        await expect(service.enable2FA(mockUser.id, 'invalid', 'SECRET')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('disable2FA', () => {
      it('should disable 2FA with valid password', async () => {
        const userWith2FA = createMockUser({
          twoFactorEnabled: true,
          twoFactorSecret: 'SECRET',
        });
        prisma.user.findUnique.mockResolvedValue(userWith2FA);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        prisma.user.update.mockResolvedValue({
          ...userWith2FA,
          twoFactorEnabled: false,
          twoFactorSecret: null,
        });

        const result = await service.disable2FA(mockUser.id, 'password123');

        expect(result).toHaveProperty('message');
        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { twoFactorEnabled: false, twoFactorSecret: null },
          }),
        );
      });

      it('should reject disable request with wrong password', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(service.disable2FA(mockUser.id, 'wrongpassword')).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });

  // ============================================
  // PASSWORD RESET TESTS
  // ============================================
  describe('password reset', () => {
    it('should request password reset without revealing user existence', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('reset-token');

      const result = await service.requestPasswordReset({ email: mockUser.email });

      expect(result).toHaveProperty('message');
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            action: 'password_reset_requested',
          }),
        }),
      );
    });

    it('should not fail password reset request for unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset({ email: 'unknown@example.com' });

      expect(result).toHaveProperty('message');
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should confirm password reset with valid token', async () => {
      jwtService.decode.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'password_reset',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'password_reset',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('updated-hash');
      prisma.user.update.mockResolvedValue({ ...mockUser, password: 'updated-hash' });

      const result = await service.confirmPasswordReset({
        token: 'valid-reset-token',
        newPassword: 'NewSecurePass123!',
      });

      expect(result).toEqual({ message: 'Password reset successful' });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            action: 'password_reset_completed',
          }),
        }),
      );
    });
  });

  // ============================================
  // EMAIL VERIFICATION TESTS
  // ============================================
  describe('email verification', () => {
    it('should request email verification without revealing user existence', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.auditLog.findFirst.mockResolvedValue(null);
      jwtService.sign.mockReturnValue('verify-token');

      const result = await service.requestEmailVerification({ email: mockUser.email });

      expect(result).toHaveProperty('message');
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            action: 'email_verification_requested',
          }),
        }),
      );
    });

    it('should confirm email verification with valid token', async () => {
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'email_verification',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.auditLog.findFirst.mockResolvedValue(null);

      const result = await service.confirmEmailVerification({ token: 'valid-token' });

      expect(result).toHaveProperty('message');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            action: 'email_verified',
          }),
        }),
      );
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle JWT signing errors', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow();
    });

    it('should handle concurrent registration with unique constraint error', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      // Simulate Prisma throwing unique constraint error
      const uniqueError = new Error('Unique constraint failed');
      (uniqueError as any).code = 'P2002';
      prisma.user.create.mockRejectedValue(uniqueError);

      await expect(
        service.register({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow();
    });
  });
});
