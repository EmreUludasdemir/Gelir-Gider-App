import { Injectable, NestMiddleware, Inject, LoggerService } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

/**
 * Request/Response Logging Middleware
 * Tüm HTTP isteklerini ve yanıtlarını loglar
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Request ID'yi header'a ekle
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Request bilgilerini topla
    const requestInfo = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      contentLength: req.headers['content-length'],
      userId: (req as any).user?.userId,
    };

    // Request log
    this.logger.log(
      `→ ${req.method} ${req.originalUrl || req.url}`,
      { ...requestInfo, context: 'HTTP' },
    );

    // Response'u dinle
    const originalSend = res.send.bind(res);
    let responseBody: unknown;

    res.send = (body: unknown) => {
      responseBody = body;
      return originalSend(body as string | Buffer);
    };

    // Response tamamlandığında
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      const responseInfo = {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        duration: `${duration}ms`,
        contentLength: res.getHeader('content-length'),
      };

      // Status code'a göre log level
      if (statusCode >= 500) {
        this.logger.error(
          `← ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${duration}ms`,
          { ...responseInfo, context: 'HTTP' },
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `← ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${duration}ms`,
          { ...responseInfo, context: 'HTTP' },
        );
      } else {
        this.logger.log(
          `← ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${duration}ms`,
          { ...responseInfo, context: 'HTTP' },
        );
      }

      // Yavaş istekleri logla (500ms üzeri)
      if (duration > 500) {
        this.logger.warn(
          `🐢 Slow request: ${req.method} ${req.originalUrl || req.url} took ${duration}ms`,
          { ...responseInfo, context: 'Performance' },
        );
      }
    });

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Sensitive data'yı maskele
 */
export function maskSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard'];
  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}
