import { Controller, Get, Post, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GamificationService, ACHIEVEMENTS } from "./gamification.service";

@Controller("gamification")
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // Get user stats (XP, level, streaks)
  @Get("stats")
  async getStats(@Request() req: { user: { userId: string } }) {
    const stats = await this.gamificationService.getUserProgress(
      req.user.userId
    );
    const levelProgress = this.gamificationService.getNextLevelXP(
      stats.totalXP
    );

    return {
      ...stats,
      levelProgress,
    };
  }

  // Get all achievements with status
  @Get("achievements")
  async getAchievements(@Request() req: { user: { userId: string } }) {
    const achievements =
      await this.gamificationService.getAchievementsWithStatus(req.user.userId);

    return {
      total: ACHIEVEMENTS.length,
      unlocked: achievements.filter((a) => a.unlocked).length,
      achievements,
    };
  }

  // Check for new achievements
  @Post("check")
  async checkAchievements(@Request() req: { user: { userId: string } }) {
    const newlyUnlocked = await this.gamificationService.checkAchievements(
      req.user.userId
    );

    return {
      newAchievements: newlyUnlocked,
      message:
        newlyUnlocked.length > 0
          ? `Tebrikler! ${newlyUnlocked.length} yeni başarı kazandın!`
          : "Henüz yeni başarı yok.",
    };
  }

  // Get current streak
  @Get("streak")
  async getStreak(@Request() req: { user: { userId: string } }) {
    const streak = await this.gamificationService.getCurrentStreak(
      req.user.userId
    );
    const stats = await this.gamificationService.getUserProgress(
      req.user.userId
    );

    return {
      currentStreak: streak,
      longestStreak: stats.longestStreak,
      message:
        streak >= 7
          ? `🔥 Müthiş! ${streak} günlük seri!`
          : streak > 0
          ? `${streak} günlük serini sürdür!`
          : "Bugün bir işlem ekleyerek seri başlat!",
    };
  }

  // Get leaderboard
  @Get("leaderboard")
  async getLeaderboard() {
    const leaderboard = await this.gamificationService.getLeaderboard(10);

    return {
      leaderboard,
      updatedAt: new Date().toISOString(),
    };
  }
}
