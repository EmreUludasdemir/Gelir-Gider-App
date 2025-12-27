import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiAnalyticsController } from './ai-analytics.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AiAnalyticsController],
  providers: [AiAnalyticsService, PrismaService],
  exports: [AiAnalyticsService],
})
export class AiAnalyticsModule {}
