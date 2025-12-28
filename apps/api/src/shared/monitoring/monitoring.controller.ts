import { Controller, Get, Header, Inject } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private metricsService: MetricsService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain')
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('api-metrics')
  getApiMetrics() {
    const metrics = this.metricsService.getApiMetrics();
    return {
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      successRate: metrics.totalRequests > 0
        ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2) + '%'
        : 'N/A',
      responseTime: {
        average: metrics.averageResponseTime,
        p50: metrics.p50ResponseTime,
        p95: metrics.p95ResponseTime,
        p99: metrics.p99ResponseTime,
        unit: 'ms',
      },
      errorsLast5Minutes: metrics.errorsLast5Minutes,
      topEndpoints: [...metrics.requestsByEndpoint.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count })),
      statusCodes: Object.fromEntries(metrics.requestsByStatusCode),
    };
  }

  @Get('system')
  getSystemMetrics() {
    const system = this.metricsService.getSystemMetrics();
    return {
      uptime: {
        seconds: system.uptime,
        formatted: this.formatUptime(system.uptime),
      },
      node: {
        version: system.nodeVersion,
        pid: system.processId,
      },
      memory: {
        heapUsed: this.formatBytes(system.memoryUsage.heapUsed),
        heapTotal: this.formatBytes(system.memoryUsage.heapTotal),
        rss: this.formatBytes(system.memoryUsage.rss),
        external: this.formatBytes(system.memoryUsage.external),
        heapUsagePercent: ((system.memoryUsage.heapUsed / system.memoryUsage.heapTotal) * 100).toFixed(1) + '%',
      },
      cpu: {
        user: (system.cpuUsage.user / 1000000).toFixed(2) + 's',
        system: (system.cpuUsage.system / 1000000).toFixed(2) + 's',
      },
      activeConnections: system.activeConnections,
    };
  }

  @Get('dashboard')
  async getDashboard() {
    const api = this.metricsService.getApiMetrics();
    const system = this.metricsService.getSystemMetrics();

    return {
      overview: {
        status: api.errorsLast5Minutes > 10 ? 'degraded' : 'healthy',
        uptime: this.formatUptime(system.uptime),
        activeConnections: system.activeConnections,
      },
      requests: {
        total: api.totalRequests,
        success: api.successfulRequests,
        failed: api.failedRequests,
        successRate: api.totalRequests > 0
          ? ((api.successfulRequests / api.totalRequests) * 100).toFixed(1)
          : 0,
      },
      performance: {
        avgResponseTime: api.averageResponseTime,
        p95ResponseTime: api.p95ResponseTime,
        errorsLast5Min: api.errorsLast5Minutes,
      },
      resources: {
        heapUsage: ((system.memoryUsage.heapUsed / system.memoryUsage.heapTotal) * 100).toFixed(1),
        heapUsedMB: Math.round(system.memoryUsage.heapUsed / 1024 / 1024),
        rssMB: Math.round(system.memoryUsage.rss / 1024 / 1024),
      },
      topEndpoints: [...api.requestsByEndpoint.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([endpoint, count]) => ({ endpoint, count })),
      timestamp: new Date().toISOString(),
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }
}
