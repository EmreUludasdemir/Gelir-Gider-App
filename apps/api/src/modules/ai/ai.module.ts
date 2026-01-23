/**
 * AI Module
 * Provides AI-powered financial analysis features
 */

import { Module } from '@nestjs/common';
import { SpendingAnalyzerService } from './spending-analyzer.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { AutoCategorizerService } from './auto-categorizer.service';
import { AssistantService } from './assistant.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [
    SpendingAnalyzerService,
    AnomalyDetectorService,
    AutoCategorizerService,
    AssistantService,
  ],
  exports: [
    SpendingAnalyzerService,
    AnomalyDetectorService,
    AutoCategorizerService,
    AssistantService,
  ],
})
export class AiModule {}
