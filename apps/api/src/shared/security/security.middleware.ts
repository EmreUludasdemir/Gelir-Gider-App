import { Injectable, NestMiddleware, Inject, LoggerService, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

/**
 * Rate Limiter Configuration
 */
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Error message
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limit presets for different endpoints
 */
export const RateLimitPresets = {
  // Very strict - for sensitive operations
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.',
  },

  // Auth endpoints - prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Çok fazla şifre sıfırlama isteği. 1 saat sonra tekrar deneyin.',
  },

  // API endpoints - normal usage
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'İstek limiti aşıldı. Bir dakika bekleyin.',
  },

  // Upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Çok fazla dosya yükleme isteği. Bir dakika bekleyin.',
  },

  // Report generation
  reports: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5,
    message: 'Çok fazla rapor isteği. 5 dakika sonra tekrar deneyin.',
  },
};

/**
 * In-memory rate limiter store
 * Production'da Redis kullanılmalı
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      const entry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, entry);
      return entry;
    }

    existing.count++;
    return existing;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

/**
 * Enhanced Rate Limiting Middleware Factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key based on IP and user ID (if authenticated)
    const userId = (req as any).user?.userId;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = userId ? `user:${userId}` : `ip:${ip}`;

    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);
    const remaining = Math.max(0, config.maxRequests - count);
    const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (count > config.maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: 'RATE_001',
          message: config.message || 'Çok fazla istek gönderdiniz',
          timestamp: new Date().toISOString(),
          path: req.url,
          retryAfter: resetSeconds,
        },
      });
    }

    next();
  };
}

/**
 * Security Middleware
 * Çeşitli güvenlik kontrolleri yapar
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 1. Block suspicious user agents
    const userAgent = req.headers['user-agent'] || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      this.logger.warn(`Blocked suspicious user agent: ${userAgent}`, { 
        ip: req.ip, 
        url: req.url,
        context: 'Security',
      });
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        error: {
          code: 'SEC_001',
          message: 'Erişim engellendi',
          timestamp: new Date().toISOString(),
          path: req.url,
        },
      });
    }

    // 2. Block common attack patterns in URL
    if (this.hasAttackPattern(req.url)) {
      this.logger.warn(`Blocked attack pattern in URL: ${req.url}`, {
        ip: req.ip,
        context: 'Security',
      });
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        error: {
          code: 'SEC_002',
          message: 'Geçersiz istek',
          timestamp: new Date().toISOString(),
          path: req.url,
        },
      });
    }

    // 3. Validate content-type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'] || '';
      if (req.body && Object.keys(req.body).length > 0) {
        if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
          // Allow empty body or form data for file uploads
          if (!contentType.includes('application/x-www-form-urlencoded')) {
            this.logger.warn(`Invalid content-type: ${contentType}`, {
              ip: req.ip,
              url: req.url,
              context: 'Security',
            });
          }
        }
      }
    }

    // 4. Add security headers to response
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zgrab/i,
      /python-requests/i,
      /curl\/\d/i, // Block raw curl (allow curl with proper user agent)
      /wget/i,
      /scanner/i,
      /exploit/i,
      /attack/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private hasAttackPattern(url: string): boolean {
    const attackPatterns = [
      /\.\.\//, // Path traversal
      /\.\.\\/, // Windows path traversal
      /<script/i, // XSS
      /javascript:/i, // XSS
      /vbscript:/i, // XSS
      /data:/i, // Data URI
      /union\s+select/i, // SQL injection
      /select\s+\*/i, // SQL injection
      /insert\s+into/i, // SQL injection
      /drop\s+table/i, // SQL injection
      /;.*--/, // SQL injection
      /eval\(/i, // Code injection
      /exec\(/i, // Code injection
      /\$\{.*\}/, // Template injection
      /\{\{.*\}\}/, // Template injection
      /etc\/passwd/i, // File inclusion
      /proc\/self/i, // File inclusion
      /\/bin\/bash/i, // Command injection
      /\|.*cat/i, // Command injection
      /`.*`/, // Command injection
    ];

    return attackPatterns.some(pattern => pattern.test(decodeURIComponent(url)));
  }
}

/**
 * HPP (HTTP Parameter Pollution) Protection
 * Duplicate parameters'ı temizler
 */
@Injectable()
export class HppMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // For query parameters, keep only the last value if duplicated
    if (req.query) {
      for (const key of Object.keys(req.query)) {
        const value = req.query[key];
        if (Array.isArray(value)) {
          req.query[key] = value[value.length - 1];
        }
      }
    }

    next();
  }
}
