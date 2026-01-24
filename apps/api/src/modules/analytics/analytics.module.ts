import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "./analytics.controller";
import { ForecastService } from "./forecast.service";
import { NetWorthService } from "./networth.service";
import { PrismaModule } from "../../prisma.module";
import { RedisModule } from "../../redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [AnalyticsService, ForecastService, NetWorthService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, ForecastService, NetWorthService],
})
export class AnalyticsModule {}
