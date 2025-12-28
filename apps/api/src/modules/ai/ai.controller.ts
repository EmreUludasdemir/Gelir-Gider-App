/**
 * AI Controller
 * Endpoints for AI-powered financial analysis
 */

import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpendingAnalyzerService } from './spending-analyzer.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { AutoCategorizerService } from './auto-categorizer.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly spendingAnalyzer: SpendingAnalyzerService,
    private readonly anomalyDetector: AnomalyDetectorService,
    private readonly autoCategorizer: AutoCategorizerService,
  ) {}

  /**
   * Get spending insights
   */
  @Get('insights')
  async getInsights(@Request() req: { user: { userId: string } }) {
    return this.spendingAnalyzer.generateInsights(req.user.userId);
  }

  /**
   * Get spending predictions
   */
  @Get('predictions')
  async getPredictions(@Request() req: { user: { userId: string } }) {
    return this.spendingAnalyzer.predictSpending(req.user.userId);
  }

  /**
   * Get savings opportunities
   */
  @Get('savings-opportunities')
  async getSavingsOpportunities(@Request() req: { user: { userId: string } }) {
    return this.spendingAnalyzer.findSavingsOpportunities(req.user.userId);
  }

  /**
   * Get anomaly summary
   */
  @Get('anomalies')
  async getAnomalies(@Request() req: { user: { userId: string } }) {
    return this.anomalyDetector.getAnomalySummary(req.user.userId);
  }

  /**
   * Analyze specific transaction for anomalies
   */
  @Get('anomalies/:transactionId')
  async analyzeTransaction(
    @Request() req: { user: { userId: string } },
    @Query('transactionId') transactionId: string
  ) {
    return this.anomalyDetector.analyzeTransaction(req.user.userId, transactionId);
  }

  /**
   * Auto-categorize a description
   */
  @Post('categorize')
  async categorize(
    @Request() req: { user: { userId: string } },
    @Body() body: { description: string }
  ) {
    return this.autoCategorizer.categorize(body.description, req.user.userId);
  }

  /**
   * Get category suggestions
   */
  @Get('category-suggestions')
  async getCategorySuggestions(
    @Request() req: { user: { userId: string } },
    @Query('description') description: string
  ) {
    return this.autoCategorizer.getSuggestions(description, req.user.userId);
  }

  /**
   * Submit category correction for learning
   */
  @Post('learn-category')
  async learnCategory(
    @Request() req: { user: { userId: string } },
    @Body() body: { description: string; categoryId: string; categoryLabel: string }
  ) {
    await this.autoCategorizer.learnFromCorrection(
      req.user.userId,
      body.description,
      body.categoryId,
      body.categoryLabel
    );
    return { success: true };
  }
}
