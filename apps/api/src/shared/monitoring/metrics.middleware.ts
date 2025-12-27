import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';
import { v4 as uuidv4 } from 'uuid';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate or use existing request ID for tracing
    req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.startTime = Date.now();

    // Set response headers for tracing
    res.setHeader('X-Request-ID', req.requestId);

    // Track connection
    this.metricsService.incrementConnections();

    // Record metrics on response finish
    res.on('finish', () => {
      this.metricsService.decrementConnections();

      const duration = Date.now() - (req.startTime || Date.now());
      const route = this.normalizeRoute(req.route?.path || req.path);

      this.metricsService.recordHttpRequest({
        method: req.method,
        route,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
      });
    });

    next();
  }

  private normalizeRoute(path: string): string {
    // Replace UUIDs with :id placeholder
    return path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id'
    );
  }
}
