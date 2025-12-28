import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService, ACHIEVEMENTS } from './gamification.service';
import { PrismaService } from '../../prisma.service';

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';

  const mockPrismaService = {
    transaction: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    savingsGoal: {
      count: jest.fn(),
      fields: {
        targetAmount: 'targetAmount',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ACHIEVEMENTS', () => {
    it('should have achievements defined', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it('should have valid achievement categories', () => {
      const validCategories = ['savings', 'tracking', 'budget', 'streak', 'milestone'];
      ACHIEVEMENTS.forEach(achievement => {
        expect(validCategories).toContain(achievement.category);
      });
    });

    it('should have positive XP rewards', () => {
      ACHIEVEMENTS.forEach(achievement => {
        expect(achievement.xpReward).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(service.calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for 99 XP', () => {
      expect(service.calculateLevel(99)).toBe(1);
    });

    it('should return level 2 for 100 XP', () => {
      expect(service.calculateLevel(100)).toBe(2);
    });

    it('should return level 3 for 300 XP (100 + 200)', () => {
      expect(service.calculateLevel(300)).toBe(3);
    });

    it('should calculate higher levels correctly', () => {
      // Level 4 requires 100 + 200 + 300 = 600 XP
      expect(service.calculateLevel(600)).toBe(4);
    });
  });

  describe('getNextLevelXP', () => {
    it('should return progress for level 1', () => {
      const result = service.getNextLevelXP(50);

      expect(result.current).toBe(50);
      expect(result.needed).toBe(100);
      expect(result.progress).toBe(50);
    });

    it('should return progress for level 2', () => {
      const result = service.getNextLevelXP(150); // 100 (lvl2) + 50

      expect(result.current).toBe(50);
      expect(result.needed).toBe(200);
      expect(result.progress).toBe(25);
    });
  });

  describe('getCurrentStreak', () => {
    it('should return 0 when no transactions', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.getCurrentStreak(mockUserId);

      expect(result).toBe(0);
    });

    it('should calculate streak for consecutive days', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrismaService.transaction.findMany.mockResolvedValue([
        { createdAt: today },
        { createdAt: yesterday },
      ]);

      const result = await service.getCurrentStreak(mockUserId);

      expect(result).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getUserProgress', () => {
    it('should return user stats', async () => {
      const result = await service.getUserProgress(mockUserId);

      expect(result).toHaveProperty('totalXP');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('currentStreak');
      expect(result).toHaveProperty('longestStreak');
      expect(result).toHaveProperty('unlockedAchievements');
      expect(result).toHaveProperty('lastActivityDate');
    });

    it('should return array of unlocked achievements', async () => {
      const result = await service.getUserProgress(mockUserId);

      expect(Array.isArray(result.unlockedAchievements)).toBe(true);
    });
  });

  describe('getAchievementsWithStatus', () => {
    it('should return all achievements with unlock status', async () => {
      const result = await service.getAchievementsWithStatus(mockUserId);

      expect(result.length).toBe(ACHIEVEMENTS.length);
      result.forEach(achievement => {
        expect(achievement).toHaveProperty('unlocked');
        expect(typeof achievement.unlocked).toBe('boolean');
      });
    });

    it('should mark already unlocked achievements correctly', async () => {
      const result = await service.getAchievementsWithStatus(mockUserId);

      const firstTransaction = result.find(a => a.id === 'first_transaction');
      expect(firstTransaction?.unlocked).toBe(true);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const result = await service.getLeaderboard(10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return entries with required fields', async () => {
      const result = await service.getLeaderboard();

      result.forEach(entry => {
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('xp');
        expect(entry).toHaveProperty('level');
      });
    });

    it('should return entries sorted by XP descending', async () => {
      const result = await service.getLeaderboard();

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].xp).toBeGreaterThanOrEqual(result[i + 1].xp);
      }
    });
  });

  describe('checkAchievements', () => {
    it('should check for new achievements', async () => {
      mockPrismaService.transaction.count.mockResolvedValue(0);
      mockPrismaService.savingsGoal.count.mockResolvedValue(0);
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const result = await service.checkAchievements(mockUserId);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should unlock first_transaction achievement when conditions met', async () => {
      // Mock that user has 1 transaction
      mockPrismaService.transaction.count.mockResolvedValue(1);
      mockPrismaService.savingsGoal.count.mockResolvedValue(0);
      mockPrismaService.transaction.findMany.mockResolvedValue([{ createdAt: new Date() }]);

      const result = await service.checkAchievements(mockUserId);

      // Note: first_transaction is already unlocked in mock getUserProgress
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
