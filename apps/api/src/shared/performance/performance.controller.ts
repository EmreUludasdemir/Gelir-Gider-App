import { Controller, Get, Inject } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../../prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger as LoggerService } from 'winston';

interface PerformanceMetrics {
  uptime: number;
  timestamp: string;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    isConnected: boolean;
  };
  database: {
    isConnected: boolean;
    latency: number;
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    cache: boolean;
    memory: boolean;
  };
  details: string[];
}

@Controller('performance')
export class PerformanceController {
  private startTime: number;
  private cpuUsage: NodeJS.CpuUsage;

  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.startTime = Date.now();
    this.cpuUsage = process.cpuUsage();
  }

  @Get('metrics')
  async getMetrics(): Promise<PerformanceMetrics> {
    const memoryUsage = process.memoryUsage();
    const currentCpuUsage = process.cpuUsage(this.cpuUsage);
    const cacheStats = this.cache.getStats();

    // Test database latency
    const dbLatency = await this.measureDbLatency();

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024), // MB
      },
      cpu: {
        user: Math.round(currentCpuUsage.user / 1000), // ms
        system: Math.round(currentCpuUsage.system / 1000), // ms
      },
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        isConnected: cacheStats.isConnected,
      },
      database: {
        isConnected: await this.checkDbConnection(),
        latency: dbLatency,
      },
    };
  }

  @Get('health')
  async getHealth(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDbConnection(),
      cache: this.cache.getStats().isConnected,
      memory: this.checkMemory(),
    };

    const details: string[] = [];
    
    if (!checks.database) details.push('Database connection failed');
    if (!checks.cache) details.push('Cache connection failed (degraded mode)');
    if (!checks.memory) details.push('Memory usage is high');

    const allChecksPass = Object.values(checks).every(Boolean);
    const criticalChecksPass = checks.database; // Database is critical

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allChecksPass) {
      status = 'healthy';
    } else if (criticalChecksPass) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    if (status !== 'healthy') {
      this.logger.warn(`Health check: ${status}`, { 
        context: 'PerformanceController',
        checks, 
        details 
      });
    }

    return { status, checks, details };
  }

  @Get('cache')
  getCacheStats() {
    return this.cache.getStats();
  }

  private async measureDbLatency(): Promise<number> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private async checkDbConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private checkMemory(): boolean {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    // Consider unhealthy if heap usage > 90%
    return usagePercent < 90;
  }
}
