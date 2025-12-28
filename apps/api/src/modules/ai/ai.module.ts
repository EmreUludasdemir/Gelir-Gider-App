/**
 * AI Module
 * Provides AI-powered financial analysis features
 */

import { Module } from '@nestjs/common';
import { SpendingAnalyzerService } from './spending-analyzer.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { AutoCategorizerService } from './auto-categorizer.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [
    SpendingAnalyzerService,
    AnomalyDetectorService,
    AutoCategorizerService,
  ],
  exports: [
    SpendingAnalyzerService,
    AnomalyDetectorService,
    AutoCategorizerService,
  ],
})
export class AiModule {}
