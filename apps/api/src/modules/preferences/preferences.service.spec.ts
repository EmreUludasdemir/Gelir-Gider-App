/**
 * Preferences Service Unit Tests - v3.0
 * Kapsamlı kullanıcı tercihleri test suite
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PreferencesService } from './preferences.service';
import { PrismaService } from '../../prisma.service';
import {
  createMockUserPreference,
  createMockPrismaService,
} from '../../../test/test-utils';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const userId = 'user-test-123';
  const mockPreference = createMockUserPreference();

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
    jest.clearAllMocks();
  });

  // ============================================
  // GET TESTS
  // ============================================
  describe('get', () => {
    it('should return existing preferences', async () => {
      prisma.userPreference.findUnique.mockResolvedValue(mockPreference);

      const result = await service.get(userId);

      expect(result).toEqual(mockPreference);
      expect(prisma.userPreference.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should create default preferences if not exists', async () => {
      const defaultPrefs = {
        ...mockPreference,
        language: 'tr',
        currency: 'TRY',
        theme: 'light',
      };
      prisma.userPreference.findUnique.mockResolvedValue(null);
      prisma.userPreference.create.mockResolvedValue(defaultPrefs);

      const result = await service.get(userId);

      expect(result.language).toBe('tr');
      expect(result.currency).toBe('TRY');
      expect(result.theme).toBe('light');
      expect(prisma.userPreference.create).toHaveBeenCalledWith({
        data: {
          userId,
          language: 'tr',
          currency: 'TRY',
          theme: 'light',
        },
      });
    });

    it('should not create preferences if already exists', async () => {
      prisma.userPreference.findUnique.mockResolvedValue(mockPreference);

      await service.get(userId);

      expect(prisma.userPreference.create).not.toHaveBeenCalled();
    });

    it('should return Turkish defaults', async () => {
      prisma.userPreference.findUnique.mockResolvedValue(null);
      prisma.userPreference.create.mockResolvedValue({
        ...mockPreference,
        language: 'tr',
        currency: 'TRY',
      });

      const result = await service.get(userId);

      expect(result.language).toBe('tr');
      expect(result.currency).toBe('TRY');
    });
  });

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('update', () => {
    it('should update existing preferences', async () => {
      const updateDto = { theme: 'dark', language: 'en' };
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        ...updateDto,
      });

      const result = await service.update(userId, updateDto);

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('en');
    });

    it('should create preferences if not exists (upsert)', async () => {
      const updateDto = { currency: 'USD' };
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        ...updateDto,
      });

      await service.update(userId, updateDto);

      expect(prisma.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: updateDto,
        create: {
          userId,
          ...updateDto,
        },
      });
    });

    it('should update only provided fields', async () => {
      const updateDto = { theme: 'dark' };
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        theme: 'dark',
      });

      await service.update(userId, updateDto);

      expect(prisma.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: { theme: 'dark' },
        create: {
          userId,
          theme: 'dark',
        },
      });
    });

    it('should update emailNotifications setting', async () => {
      const updateDto = { emailNotifications: false };
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        emailNotifications: false,
      });

      const result = await service.update(userId, updateDto);

      expect(result.emailNotifications).toBe(false);
    });

    it('should update budgetAlerts setting', async () => {
      const updateDto = { budgetAlerts: false };
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        budgetAlerts: false,
      });

      const result = await service.update(userId, updateDto);

      expect(result.budgetAlerts).toBe(false);
    });

    it('should update weeklyReport setting', async () => {
      const updateDto = { weeklyReport: true };
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        weeklyReport: true,
      });

      const result = await service.update(userId, updateDto);

      expect(result.weeklyReport).toBe(true);
    });

    it('should update multiple settings at once', async () => {
      const updateDto = {
        theme: 'dark',
        language: 'en',
        currency: 'USD',
        emailNotifications: false,
      };
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        ...updateDto,
      });

      const result = await service.update(userId, updateDto);

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('en');
      expect(result.currency).toBe('USD');
      expect(result.emailNotifications).toBe(false);
    });
  });

  // ============================================
  // RESET TESTS
  // ============================================
  describe('reset', () => {
    it('should reset preferences to defaults', async () => {
      const defaultPrefs = {
        ...mockPreference,
        language: 'tr',
        currency: 'TRY',
        theme: 'light',
        emailNotifications: true,
        budgetAlerts: true,
        weeklyReport: false,
      };
      prisma.userPreference.upsert.mockResolvedValue(defaultPrefs);

      const result = await service.reset(userId);

      expect(result.language).toBe('tr');
      expect(result.currency).toBe('TRY');
      expect(result.theme).toBe('light');
      expect(result.emailNotifications).toBe(true);
      expect(result.budgetAlerts).toBe(true);
      expect(result.weeklyReport).toBe(false);
    });

    it('should use upsert for reset', async () => {
      prisma.userPreference.upsert.mockResolvedValue(mockPreference);

      await service.reset(userId);

      expect(prisma.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {
          language: 'tr',
          currency: 'TRY',
          theme: 'light',
          emailNotifications: true,
          budgetAlerts: true,
          weeklyReport: false,
        },
        create: {
          userId,
          language: 'tr',
          currency: 'TRY',
          theme: 'light',
        },
      });
    });

    it('should reset from dark theme to light', async () => {
      const lightPrefs = { ...mockPreference, theme: 'light' };

      prisma.userPreference.upsert.mockResolvedValue(lightPrefs);

      const result = await service.reset(userId);

      expect(result.theme).toBe('light');
    });

    it('should reset from English to Turkish', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        language: 'tr',
      });

      const result = await service.reset(userId);

      expect(result.language).toBe('tr');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle database errors on get', async () => {
      prisma.userPreference.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.get(userId)).rejects.toThrow('Database error');
    });

    it('should handle database errors on update', async () => {
      prisma.userPreference.upsert.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.update(userId, { theme: 'dark' }),
      ).rejects.toThrow('Database error');
    });

    it('should handle database errors on reset', async () => {
      prisma.userPreference.upsert.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.reset(userId)).rejects.toThrow('Database error');
    });

    it('should handle empty update dto', async () => {
      prisma.userPreference.upsert.mockResolvedValue(mockPreference);

      await service.update(userId, {});

      expect(prisma.userPreference.upsert).toHaveBeenCalled();
    });

    it('should work with different user IDs', async () => {
      const differentUserId = 'different-user-456';
      prisma.userPreference.findUnique.mockResolvedValue({
        ...mockPreference,
        userId: differentUserId,
      });

      await service.get(differentUserId);

      expect(prisma.userPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: differentUserId },
      });
    });
  });

  // ============================================
  // THEME TESTS
  // ============================================
  describe('Theme Handling', () => {
    it('should support light theme', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        theme: 'light',
      });

      const result = await service.update(userId, { theme: 'light' });

      expect(result.theme).toBe('light');
    });

    it('should support dark theme', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        theme: 'dark',
      });

      const result = await service.update(userId, { theme: 'dark' });

      expect(result.theme).toBe('dark');
    });

    it('should support system theme', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        theme: 'system',
      });

      const result = await service.update(userId, { theme: 'system' });

      expect(result.theme).toBe('system');
    });
  });

  // ============================================
  // CURRENCY TESTS
  // ============================================
  describe('Currency Handling', () => {
    it('should support TRY currency', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        currency: 'TRY',
      });

      const result = await service.update(userId, { currency: 'TRY' });

      expect(result.currency).toBe('TRY');
    });

    it('should support USD currency', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        currency: 'USD',
      });

      const result = await service.update(userId, { currency: 'USD' });

      expect(result.currency).toBe('USD');
    });

    it('should support EUR currency', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        currency: 'EUR',
      });

      const result = await service.update(userId, { currency: 'EUR' });

      expect(result.currency).toBe('EUR');
    });
  });

  // ============================================
  // LANGUAGE TESTS
  // ============================================
  describe('Language Handling', () => {
    it('should support Turkish language', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        language: 'tr',
      });

      const result = await service.update(userId, { language: 'tr' });

      expect(result.language).toBe('tr');
    });

    it('should support English language', async () => {
      prisma.userPreference.upsert.mockResolvedValue({
        ...mockPreference,
        language: 'en',
      });

      const result = await service.update(userId, { language: 'en' });

      expect(result.language).toBe('en');
    });
  });
});
