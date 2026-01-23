import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "./analytics.controller";
import { ForecastService } from "./forecast.service";
import { PrismaModule } from "../../prisma.module";
import { RedisModule } from "../../redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [AnalyticsService, ForecastService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, ForecastService],
})
export class AnalyticsModule {}
