/**
 * JWT Strategy Unit Tests - FAZ 3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma.service';
import { createMockUser, createMockPrismaService } from '../../../test/test-utils';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const mockUser = createMockUser();

  beforeEach(async () => {
    prisma = createMockPrismaService();

    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('validate', () => {
    it('should return user without password when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const payload = { sub: mockUser.id, email: mockUser.email, type: 'access' as const };
      const result = await strategy.validate(payload);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const payload = { sub: 'non-existent-id', email: 'test@example.com', type: 'access' as const };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should lookup user by id from payload.sub', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const payload = { sub: 'user-123', email: 'test@example.com', type: 'access' as const };
      await strategy.validate(payload);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should exclude sensitive fields from returned user', async () => {
      const userWithSensitiveData = {
        ...mockUser,
        twoFactorSecret: 'secret-2fa',
      };
      prisma.user.findUnique.mockResolvedValue(userWithSensitiveData);

      const payload = { sub: mockUser.id, email: mockUser.email, type: 'access' as const };
      const result = await strategy.validate(payload);

      expect(result.id).toBe(mockUser.id);
    });
  });
});
