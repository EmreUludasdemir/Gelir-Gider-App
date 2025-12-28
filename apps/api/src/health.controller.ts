import { Controller, Get, Header } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CacheService } from './shared/cache';
import { MetricsService } from './shared/monitoring';

@Controller()
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly metrics: MetricsService,
  ) {}

  @Get('health')
  async health() {
    const [dbHealthy, cacheHealthy] = await Promise.all([
      this.prisma.healthCheck(),
      this.checkCacheHealth(),
    ]);

    const status = dbHealthy && cacheHealthy ? 'ok' : 'degraded';
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status,
      service: 'gelir-gider-api',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      uptime: uptimeSeconds,
      components: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: cacheHealthy ? 'healthy' : 'unhealthy',
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
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getMetrics(): string {
    return this.metrics.getPrometheusMetrics();
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
