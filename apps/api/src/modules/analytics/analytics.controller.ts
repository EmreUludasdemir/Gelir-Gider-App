import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { ForecastService } from "./forecast.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";
import { JwtPayload } from "../../shared/types";

@UseGuards(JwtAuthGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly forecastService: ForecastService,
  ) {}

  /**
   * Get monthly comparison for last N months
   * GET /analytics/comparison?months=6
   */
  @Get("comparison")
  async getMonthlyComparison(
    @User() user: JwtPayload,
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
    @User() user: JwtPayload,
    @Query("period") period?: "week" | "month"
  ) {
    return this.analyticsService.getCategoryTrends(user.id, period || "month");
  }

  /**
   * Get spending forecast
   * GET /analytics/forecast
   */
  @Get("forecast")
  async getSpendingForecast(@User() user: JwtPayload) {
    return this.analyticsService.getSpendingForecast(user.id);
  }

  /**
   * Get daily spending for current month
   * GET /analytics/daily
   */
  @Get("daily")
  async getDailySpending(@User() user: JwtPayload) {
    return this.analyticsService.getDailySpending(user.id);
  }

  /**
   * Get savings rate
   * GET /analytics/savings
   */
  @Get("savings")
  async getSavingsRate(@User() user: JwtPayload) {
    return this.analyticsService.getSavingsRate(user.id);
  }

  /**
   * Get 30-day cashflow forecast
   * GET /analytics/cashflow?days=30&language=tr
   */
  @Get("cashflow")
  async getCashflowForecast(
    @User() user: JwtPayload,
    @Query("days") days?: string,
    @Query("language") language?: "tr" | "en",
  ) {
    const dayCount = parseInt(days || "30", 10);
    return this.forecastService.generateForecast(
      user.id,
      Math.min(dayCount, 90), // Cap at 90 days
      language || "tr",
    );
  }

  /**
   * Get weekly cashflow forecast summary
   * GET /analytics/cashflow/weekly?language=tr
   */
  @Get("cashflow/weekly")
  async getWeeklyCashflow(
    @User() user: JwtPayload,
    @Query("language") language?: "tr" | "en",
  ) {
    return this.forecastService.getWeeklyForecast(user.id, language || "tr");
  }
}
