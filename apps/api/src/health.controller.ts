import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CacheService } from './shared/cache';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get('health')
  async health() {
    const [dbHealthy, cacheHealthy] = await Promise.all([
      this.prisma.healthCheck(),
      this.checkCacheHealth(),
    ]);

    const status = dbHealthy && cacheHealthy ? 'ok' : 'degraded';

    return {
      status,
      service: 'gelir-gider-api',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      components: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        cache: cacheHealthy ? 'healthy' : 'unhealthy',
      },
    };
  }

  @Get('health/ready')
  async readiness() {
    const dbHealthy = await this.prisma.healthCheck();
    return {
      ready: dbHealthy,
      database: dbHealthy ? 'connected' : 'disconnected',
    };
  }

  @Get('health/live')
  liveness() {
    return {
      live: true,
      uptime: process.uptime(),
    };
  }

  private async checkCacheHealth(): Promise<boolean> {
    try {
      await this.cache.set('health-check', 'ok', 5);
      const value = await this.cache.get('health-check');
      return value === 'ok';
    } catch {
      return false;
    }
  }
}
