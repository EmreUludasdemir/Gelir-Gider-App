/**
 * AI Controller
 * Endpoints for AI-powered financial analysis
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpendingAnalyzerService } from './spending-analyzer.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { AutoCategorizerService } from './auto-categorizer.service';
import { AiChatService } from './ai-chat.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly spendingAnalyzer: SpendingAnalyzerService,
    private readonly anomalyDetector: AnomalyDetectorService,
    private readonly autoCategorizer: AutoCategorizerService,
    private readonly aiChat: AiChatService,
  ) {}

  /**
   * Get spending insights
   */
  @Get('insights')
  async getInsights(@Request() req: { user?: { id?: string; userId?: string } }) {
    return this.spendingAnalyzer.generateInsights(this.getUserId(req));
  }

  /**
   * Get spending predictions
   */
  @Get('predictions')
  async getPredictions(@Request() req: { user?: { id?: string; userId?: string } }) {
    return this.spendingAnalyzer.predictSpending(this.getUserId(req));
  }

  /**
   * Get savings opportunities
   */
  @Get('savings-opportunities')
  async getSavingsOpportunities(@Request() req: { user?: { id?: string; userId?: string } }) {
    return this.spendingAnalyzer.findSavingsOpportunities(this.getUserId(req));
  }

  /**
   * Get anomaly summary
   */
  @Get('anomalies')
  async getAnomalies(@Request() req: { user?: { id?: string; userId?: string } }) {
    return this.anomalyDetector.getAnomalySummary(this.getUserId(req));
  }

  /**
   * Analyze specific transaction for anomalies
   */
  @Get('anomalies/:transactionId')
  async analyzeTransaction(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Param('transactionId') transactionId: string
  ) {
    return this.anomalyDetector.analyzeTransaction(this.getUserId(req), transactionId);
  }

  /**
   * Auto-categorize a description
   */
  @Post('categorize')
  async categorize(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Body() body: { description: string }
  ) {
    return this.autoCategorizer.categorize(body.description, this.getUserId(req));
  }

  /**
   * Get category suggestions
   */
  @Get('category-suggestions')
  async getCategorySuggestions(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Query('description') description: string
  ) {
    return this.autoCategorizer.getSuggestions(description, this.getUserId(req));
  }

  /**
   * Submit category correction for learning
   */
  @Post('learn-category')
  async learnCategory(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Body() body: { description: string; categoryId: string; categoryLabel: string }
  ) {
    await this.autoCategorizer.learnFromCorrection(
      this.getUserId(req),
      body.description,
      body.categoryId,
      body.categoryLabel
    );
    return { success: true };
  }

  /**
   * Chat with financial data (Gemini-backed)
   */
  @Post('chat')
  async chat(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Body() body: { message: string }
  ) {
    return this.aiChat.chat(this.getUserId(req), body.message);
  }

  @Post('parse')
  async parseTransaction(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Body() body: { input: string }
  ) {
    return this.aiChat.parseTransaction(this.getUserId(req), body.input);
  }

  private getUserId(req: { user?: { id?: string; userId?: string } }): string {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User context is missing');
    }
    return userId;
  }
}
