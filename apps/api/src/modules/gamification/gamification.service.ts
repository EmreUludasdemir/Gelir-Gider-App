import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "savings" | "tracking" | "budget" | "streak" | "milestone";
  xpReward: number;
  condition: {
    type: string;
    value: number;
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // Savings
  {
    id: "first_goal",
    name: "İlk Adım",
    description: "İlk tasarruf hedefini oluştur",
    icon: "🎯",
    category: "savings",
    xpReward: 50,
    condition: { type: "goals_created", value: 1 },
  },
  {
    id: "goal_achiever",
    name: "Hedef Avcısı",
    description: "Bir tasarruf hedefini tamamla",
    icon: "🏆",
    category: "savings",
    xpReward: 200,
    condition: { type: "goals_completed", value: 1 },
  },
  {
    id: "super_saver",
    name: "Süper Tasarrufçu",
    description: "₺5.000 biriktir",
    icon: "💎",
    category: "savings",
    xpReward: 500,
    condition: { type: "total_saved", value: 5000 },
  },

  // Tracking
  {
    id: "first_transaction",
    name: "Başlangıç",
    description: "İlk işlemini ekle",
    icon: "✨",
    category: "tracking",
    xpReward: 25,
    condition: { type: "transactions_added", value: 1 },
  },
  {
    id: "tracker_10",
    name: "Takipçi",
    description: "10 işlem ekle",
    icon: "📝",
    category: "tracking",
    xpReward: 75,
    condition: { type: "transactions_added", value: 10 },
  },
  {
    id: "tracker_100",
    name: "Kayıt Ustası",
    description: "100 işlem ekle",
    icon: "📊",
    category: "tracking",
    xpReward: 300,
    condition: { type: "transactions_added", value: 100 },
  },
  {
    id: "pdf_uploader",
    name: "Teknoloji Dostu",
    description: "İlk PDF ekstresini yükle",
    icon: "📄",
    category: "tracking",
    xpReward: 100,
    condition: { type: "pdf_uploaded", value: 1 },
  },

  // Budget
  {
    id: "budget_setter",
    name: "Planlayıcı",
    description: "İlk bütçeni oluştur",
    icon: "📋",
    category: "budget",
    xpReward: 50,
    condition: { type: "budgets_created", value: 1 },
  },
  {
    id: "budget_master",
    name: "Bütçe Ustası",
    description: "3 ay üst üste bütçe içinde kal",
    icon: "🎖️",
    category: "budget",
    xpReward: 400,
    condition: { type: "months_under_budget", value: 3 },
  },
  {
    id: "frugal",
    name: "Tutumlu",
    description: "Bir hafta boyunca bütçe aşma",
    icon: "🌟",
    category: "budget",
    xpReward: 100,
    condition: { type: "days_under_budget", value: 7 },
  },

  // Streaks
  {
    id: "streak_7",
    name: "Düzenli",
    description: "7 gün art arda işlem ekle",
    icon: "🔥",
    category: "streak",
    xpReward: 150,
    condition: { type: "daily_streak", value: 7 },
  },
  {
    id: "streak_30",
    name: "Kararlı",
    description: "30 gün art arda işlem ekle",
    icon: "⚡",
    category: "streak",
    xpReward: 500,
    condition: { type: "daily_streak", value: 30 },
  },
  {
    id: "streak_100",
    name: "Efsane",
    description: "100 gün art arda işlem ekle",
    icon: "🌈",
    category: "streak",
    xpReward: 1000,
    condition: { type: "daily_streak", value: 100 },
  },

  // Milestones
  {
    id: "income_milestone",
    name: "İlk Maaş",
    description: "İlk gelir işlemini ekle",
    icon: "💰",
    category: "milestone",
    xpReward: 50,
    condition: { type: "income_added", value: 1 },
  },
  {
    id: "report_generator",
    name: "Analist",
    description: "10 rapor oluştur",
    icon: "📈",
    category: "milestone",
    xpReward: 200,
    condition: { type: "reports_generated", value: 10 },
  },
  {
    id: "app_veteran",
    name: "Veteran",
    description: "6 ay aktif kullanıcı ol",
    icon: "👑",
    category: "milestone",
    xpReward: 750,
    condition: { type: "active_months", value: 6 },
  },
];

export interface UserStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  unlockedAchievements: string[];
  lastActivityDate: string;
}

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  // Calculate level from XP
  calculateLevel(xp: number): number {
    // Level formula: each level requires 100 * level XP
    let level = 1;
    let requiredXP = 100;
    let totalRequired = 0;

    while (totalRequired + requiredXP <= xp) {
      totalRequired += requiredXP;
      level++;
      requiredXP = 100 * level;
    }

    return level;
  }

  // Get XP needed for next level
  getNextLevelXP(currentXP: number): {
    current: number;
    needed: number;
    progress: number;
  } {
    const level = this.calculateLevel(currentXP);
    let totalRequired = 0;

    for (let i = 1; i < level; i++) {
      totalRequired += 100 * i;
    }

    const currentLevelXP = currentXP - totalRequired;
    const neededForNextLevel = 100 * level;

    return {
      current: currentLevelXP,
      needed: neededForNextLevel,
      progress: (currentLevelXP / neededForNextLevel) * 100,
    };
  }

  // Check and unlock achievements
  async checkAchievements(userId: string): Promise<Achievement[]> {
    const stats = await this.getUserProgress(userId);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (stats.unlockedAchievements.includes(achievement.id)) {
        continue; // Already unlocked
      }

      const isUnlocked = await this.checkCondition(
        userId,
        achievement.condition
      );

      if (isUnlocked) {
        await this.unlockAchievement(userId, achievement);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  // Check specific condition
  private async checkCondition(
    userId: string,
    condition: { type: string; value: number }
  ): Promise<boolean> {
    switch (condition.type) {
      case "transactions_added": {
        const count = await this.prisma.transaction.count({
          where: { userId },
        });
        return count >= condition.value;
      }
      case "income_added": {
        const count = await this.prisma.transaction.count({
          where: { userId, type: "income" },
        });
        return count >= condition.value;
      }
      case "goals_created": {
        const count = await this.prisma.savingsGoal.count({
          where: { userId },
        });
        return count >= condition.value;
      }
      case "goals_completed": {
        const count = await this.prisma.savingsGoal.count({
          where: {
            userId,
            currentAmount: { gte: this.prisma.savingsGoal.fields.targetAmount },
          },
        });
        return count >= condition.value;
      }
      case "daily_streak": {
        const streak = await this.getCurrentStreak(userId);
        return streak >= condition.value;
      }
      default:
        return false;
    }
  }

  // Get current streak
  async getCurrentStreak(userId: string): Promise<number> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (transactions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = new Set<number>(
      transactions.map((t) => {
        const d = new Date(t.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    const datesArray = Array.from(dates).sort((a, b) => b - a);

    for (let i = 0; i < datesArray.length; i++) {
      const expectedDate = today.getTime() - i * 24 * 60 * 60 * 1000;

      if (datesArray[i] === expectedDate) {
        streak++;
      } else if (
        i === 0 &&
        datesArray[i] === expectedDate - 24 * 60 * 60 * 1000
      ) {
        // Allow for yesterday if today has no transactions yet
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Unlock achievement and add XP
  private async unlockAchievement(
    _userId: string,
    _achievement: Achievement
  ): Promise<void> {
    // In a real implementation, you'd have a UserAchievements table
    // Achievement unlock is handled silently
  }

  // Get user progress
  async getUserProgress(_userId: string): Promise<UserStats> {
    // Mock implementation - in real app, fetch from database
    return {
      totalXP: 450,
      level: 3,
      currentStreak: 5,
      longestStreak: 12,
      unlockedAchievements: ["first_transaction", "first_goal"],
      lastActivityDate: new Date().toISOString(),
    };
  }

  // Get all achievements with unlock status
  async getAchievementsWithStatus(
    userId: string
  ): Promise<Array<Achievement & { unlocked: boolean }>> {
    const stats = await this.getUserProgress(userId);

    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: stats.unlockedAchievements.includes(achievement.id),
    }));
  }

  // Get leaderboard
  async getLeaderboard(
    _limit = 10
  ): Promise<
    Array<{ userId: string; name: string; xp: number; level: number }>
  > {
    // Mock implementation
    return [
      { userId: "1", name: "Ahmet Y.", xp: 2500, level: 8 },
      { userId: "2", name: "Mehmet K.", xp: 1800, level: 6 },
      { userId: "3", name: "Ayşe S.", xp: 1200, level: 5 },
    ];
  }
}
