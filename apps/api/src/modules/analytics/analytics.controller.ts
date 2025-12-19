import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";

@UseGuards(JwtAuthGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get monthly comparison for last N months
   * GET /analytics/comparison?months=6
   */
  @Get("comparison")
  async getMonthlyComparison(
    @User() user: any,
    @Query("months") months?: string
  ) {
    const monthCount = parseInt(months || "6", 10);
    return this.analyticsService.getMonthlyComparison(user.id, monthCount);
  }

  /**
   * Get category spending trends
   * GET /analytics/trends?period=month
   */
  @Get("trends")
  async getCategoryTrends(
    @User() user: any,
    @Query("period") period?: "week" | "month"
  ) {
    return this.analyticsService.getCategoryTrends(user.id, period || "month");
  }

  /**
   * Get spending forecast
   * GET /analytics/forecast
   */
  @Get("forecast")
  async getSpendingForecast(@User() user: any) {
    return this.analyticsService.getSpendingForecast(user.id);
  }

  /**
   * Get daily spending for current month
   * GET /analytics/daily
   */
  @Get("daily")
  async getDailySpending(@User() user: any) {
    return this.analyticsService.getDailySpending(user.id);
  }

  /**
   * Get savings rate
   * GET /analytics/savings
   */
  @Get("savings")
  async getSavingsRate(@User() user: any) {
    return this.analyticsService.getSavingsRate(user.id);
  }
}
