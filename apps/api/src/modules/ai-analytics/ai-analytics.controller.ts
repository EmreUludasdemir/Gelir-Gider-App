import { Controller, Get, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiAnalyticsService } from './ai-analytics.service';

@Controller('ai-analytics')
@UseGuards(JwtAuthGuard)
export class AiAnalyticsController {
  constructor(private aiAnalyticsService: AiAnalyticsService) {}

  @Get('anomalies')
  async getAnomalies(@Request() req: { user?: { id?: string; userId?: string } }) {
    const anomalies = await this.aiAnalyticsService.detectAnomalies(this.getUserId(req));
    return { data: anomalies };
  }

  @Get('trends')
  async getTrends(@Request() req: { user?: { id?: string; userId?: string } }) {
    const trends = await this.aiAnalyticsService.analyzeTrends(this.getUserId(req));
    return { data: trends };
  }

  @Get('health')
  async getFinancialHealth(@Request() req: { user?: { id?: string; userId?: string } }) {
    const health = await this.aiAnalyticsService.calculateFinancialHealth(this.getUserId(req));
    return { data: health };
  }

  @Get('category-insights')
  async getCategoryInsights(@Request() req: { user?: { id?: string; userId?: string } }) {
    const insights = await this.aiAnalyticsService.getCategoryInsights(this.getUserId(req));
    return { data: insights };
  }

  @Get('summary')
  async getFullAnalysis(@Request() req: { user?: { id?: string; userId?: string } }) {
    const userId = this.getUserId(req)
    const [anomalies, trends, health, categoryInsights] = await Promise.all([
      this.aiAnalyticsService.detectAnomalies(userId),
      this.aiAnalyticsService.analyzeTrends(userId),
      this.aiAnalyticsService.calculateFinancialHealth(userId),
      this.aiAnalyticsService.getCategoryInsights(userId),
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

  private getUserId(req: { user?: { id?: string; userId?: string } }): string {
    const userId = req.user?.id || req.user?.userId
    if (!userId) {
      throw new UnauthorizedException('User context is missing')
    }
    return userId
  }
}
