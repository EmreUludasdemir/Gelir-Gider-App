import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [CacheModule, PrismaModule],
  controllers: [PerformanceController],
})
export class PerformanceModule {}
