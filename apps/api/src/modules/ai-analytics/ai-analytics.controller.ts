import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiAnalyticsService } from './ai-analytics.service';

@Controller('ai-analytics')
@UseGuards(JwtAuthGuard)
export class AiAnalyticsController {
  constructor(private aiAnalyticsService: AiAnalyticsService) {}

  @Get('anomalies')
  async getAnomalies(@Request() req: { user: { userId: string } }) {
    const anomalies = await this.aiAnalyticsService.detectAnomalies(req.user.userId);
    return { data: anomalies };
  }

  @Get('trends')
  async getTrends(@Request() req: { user: { userId: string } }) {
    const trends = await this.aiAnalyticsService.analyzeTrends(req.user.userId);
    return { data: trends };
  }

  @Get('health')
  async getFinancialHealth(@Request() req: { user: { userId: string } }) {
    const health = await this.aiAnalyticsService.calculateFinancialHealth(req.user.userId);
    return { data: health };
  }

  @Get('category-insights')
  async getCategoryInsights(@Request() req: { user: { userId: string } }) {
    const insights = await this.aiAnalyticsService.getCategoryInsights(req.user.userId);
    return { data: insights };
  }

  @Get('summary')
  async getFullAnalysis(@Request() req: { user: { userId: string } }) {
    const [anomalies, trends, health, categoryInsights] = await Promise.all([
      this.aiAnalyticsService.detectAnomalies(req.user.userId),
      this.aiAnalyticsService.analyzeTrends(req.user.userId),
      this.aiAnalyticsService.calculateFinancialHealth(req.user.userId),
      this.aiAnalyticsService.getCategoryInsights(req.user.userId),
    ]);

    return {
      data: {
        anomalies,
        trends,
        health,
        categoryInsights,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
