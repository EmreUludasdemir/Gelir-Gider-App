/**
 * Health Controller Tests - PR-1
 * Tests for health and metrics endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { CacheService } from './shared/cache';
import { MetricsService } from './shared/monitoring';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    const mockPrismaService = {
      healthCheck: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const mockMetricsService = {
      getPrometheusMetrics: jest.fn(),
      getApiMetrics: jest.fn(),
      getSystemMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get(PrismaService);
    cacheService = module.get(CacheService);
    metricsService = module.get(MetricsService);
  });

  describe('health', () => {
    it('should return ok status when all components are healthy', async () => {
      prismaService.healthCheck.mockResolvedValue(true);
      cacheService.set.mockResolvedValue(undefined);
      cacheService.get.mockResolvedValue('ok');

      const result = await controller.health();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('gelir-gider-api');
      expect(result.version).toBe('2.0.0');
      expect(result.components.database).toBe('healthy');
      expect(result.components.redis).toBe('healthy');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should return degraded status when database is unhealthy', async () => {
      prismaService.healthCheck.mockResolvedValue(false);
      cacheService.set.mockResolvedValue(undefined);
      cacheService.get.mockResolvedValue('ok');

      const result = await controller.health();

      expect(result.status).toBe('degraded');
      expect(result.components.database).toBe('unhealthy');
      expect(result.components.redis).toBe('healthy');
    });

    it('should return degraded status when redis is unhealthy', async () => {
      prismaService.healthCheck.mockResolvedValue(true);
      cacheService.set.mockResolvedValue(undefined);
      cacheService.get.mockResolvedValue(null);

      const result = await controller.health();

      expect(result.status).toBe('degraded');
      expect(result.components.database).toBe('healthy');
      expect(result.components.redis).toBe('unhealthy');
    });

    it('should return degraded status when redis throws error', async () => {
      prismaService.healthCheck.mockResolvedValue(true);
      cacheService.set.mockRejectedValue(new Error('Redis connection error'));

      const result = await controller.health();

      expect(result.status).toBe('degraded');
      expect(result.components.database).toBe('healthy');
      expect(result.components.redis).toBe('unhealthy');
    });

    it('should return degraded status when all components are unhealthy', async () => {
      prismaService.healthCheck.mockResolvedValue(false);
      cacheService.set.mockRejectedValue(new Error('Redis error'));

      const result = await controller.health();

      expect(result.status).toBe('degraded');
      expect(result.components.database).toBe('unhealthy');
      expect(result.components.redis).toBe('unhealthy');
    });

    it('should return valid ISO timestamp', async () => {
      prismaService.healthCheck.mockResolvedValue(true);
      cacheService.set.mockResolvedValue(undefined);
      cacheService.get.mockResolvedValue('ok');

      const result = await controller.health();

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('readiness', () => {
    it('should return ready when database is connected', async () => {
      prismaService.healthCheck.mockResolvedValue(true);

      const result = await controller.readiness();

      expect(result.ready).toBe(true);
      expect(result.database).toBe('connected');
    });

    it('should return not ready when database is disconnected', async () => {
      prismaService.healthCheck.mockResolvedValue(false);

      const result = await controller.readiness();

      expect(result.ready).toBe(false);
      expect(result.database).toBe('disconnected');
    });
  });

  describe('liveness', () => {
    it('should always return live with uptime', () => {
      const result = controller.liveness();

      expect(result.live).toBe(true);
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMetrics', () => {
    it('should return Prometheus formatted metrics', () => {
      const mockMetrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total 100
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds 3600`;

      metricsService.getPrometheusMetrics.mockReturnValue(mockMetrics);

      const result = controller.getMetrics();

      expect(result).toBe(mockMetrics);
      expect(result).toContain('# HELP');
      expect(result).toContain('# TYPE');
      expect(result).toContain('http_requests_total');
    });

    it('should call metricsService.getPrometheusMetrics', () => {
      metricsService.getPrometheusMetrics.mockReturnValue('');

      controller.getMetrics();

      expect(metricsService.getPrometheusMetrics).toHaveBeenCalledTimes(1);
    });
  });
});
