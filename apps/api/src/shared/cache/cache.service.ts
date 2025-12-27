/**
 * Enhanced Cache Service - FAZ 4
 * Redis-based caching with TTL, invalidation strategies, and metrics
 */

import { Injectable, Inject, LoggerService, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

/**
 * Cache Configuration
 */
export interface CacheConfig {
  ttl: number;          // Time to live in seconds
  prefix: string;       // Key prefix
  tags?: string[];      // Tags for grouped invalidation
}

/**
 * Cache Statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  avgResponseTime: number;
  isConnected: boolean;
}

/**
 * Default TTL values for different data types
 */
export const CacheTTL = {
  SHORT: 60,              // 1 minute - frequently changing data
  MEDIUM: 300,            // 5 minutes - dashboard, summary
  LONG: 900,              // 15 minutes - reports, analytics
  VERY_LONG: 3600,        // 1 hour - static data, categories
  USER_SESSION: 86400,    // 24 hours - user preferences
};

/**
 * Cache Key Prefixes
 */
export const CachePrefix = {
  TRANSACTION: 'trx',
  TRANSACTION_LIST: 'trx:list',
  TRANSACTION_SUMMARY: 'trx:summary',
  BUDGET: 'budget',
  BUDGET_SUMMARY: 'budget:summary',
  USER: 'user',
  USER_PROFILE: 'user:profile',
  ANALYTICS: 'analytics',
  CATEGORY: 'category',
  SUGGESTIONS: 'suggestions',
  RECURRING: 'recurring',
};

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private isConnected = false;
  private stats: Omit<CacheStats, 'isConnected'> = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalOperations: 0,
    avgResponseTime: 0,
  };
  private responseTimes: number[] = [];

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis: Max retries reached, operating in fallback mode', {
              context: 'CacheService',
            });
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis connection error: ${err.message}`, {
          context: 'CacheService',
          stack: err.stack,
        });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully', { context: 'CacheService' });
        this.isConnected = true;
      });

      this.client.on('close', () => {
        this.logger.warn('Redis connection closed', { context: 'CacheService' });
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.warn('Redis unavailable, cache operations will be skipped', {
        context: 'CacheService',
        error: error.message,
      });
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Generate hash for query parameters
   */
  hashQuery(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {} as Record<string, any>);
    
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex')
      .substring(0, 8);
    
    return hash;
  }

  /**
   * Build cache key
   */
  buildKey(prefix: string, userId: string, ...parts: string[]): string {
    const keyParts = [prefix, userId, ...parts.filter(Boolean)];
    return keyParts.join(':');
  }

  /**
   * Get value from cache with metrics
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    const startTime = Date.now();
    try {
      const value = await this.client!.get(key);
      this.recordMetric(startTime, !!value);
      
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`, { context: 'CacheService' });
        return JSON.parse(value) as T;
      }
      
      this.logger.debug(`Cache MISS: ${key}`, { context: 'CacheService' });
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error: ${error.message}`, {
        context: 'CacheService',
        key,
      });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttl: number = CacheTTL.MEDIUM): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const serialized = JSON.stringify(value);
      await this.client!.setex(key, ttl, serialized);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`, { context: 'CacheService' });
    } catch (error) {
      this.logger.error(`Cache SET error: ${error.message}`, {
        context: 'CacheService',
        key,
      });
    }
  }

  /**
   * Get or set - returns cached value or fetches and caches
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache (don't await to not block response)
    this.set(key, data, ttl).catch(() => {});
    
    return data;
  }

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.client!.del(key);
      this.logger.debug(`Cache DEL: ${key}`, { context: 'CacheService' });
    } catch (error) {
      this.logger.error(`Cache DEL error: ${error.message}`, {
        context: 'CacheService',
        key,
      });
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(...keys);
        this.logger.debug(`Cache DEL pattern: ${pattern} (${keys.length} keys)`, {
          context: 'CacheService',
        });
      }
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache DEL pattern error: ${error.message}`, {
        context: 'CacheService',
        pattern,
      });
      return 0;
    }
  }

  /**
   * Invalidate all caches for a user
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.delPattern(`*:${userId}:*`);
    this.logger.log(`Cache invalidated for user: ${userId}`, { context: 'CacheService' });
  }

  /**
   * Invalidate transaction caches for a user
   */
  async invalidateTransactions(userId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`${CachePrefix.TRANSACTION}:${userId}:*`),
      this.delPattern(`${CachePrefix.TRANSACTION_LIST}:${userId}:*`),
      this.delPattern(`${CachePrefix.TRANSACTION_SUMMARY}:${userId}:*`),
      this.delPattern(`${CachePrefix.ANALYTICS}:${userId}:*`),
      this.delPattern(`${CachePrefix.SUGGESTIONS}:${userId}:*`),
      this.delPattern(`${CachePrefix.RECURRING}:${userId}:*`),
    ]);
    this.logger.debug(`Transaction caches invalidated for user: ${userId}`, {
      context: 'CacheService',
    });
  }

  /**
   * Invalidate budget caches for a user
   */
  async invalidateBudgets(userId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`${CachePrefix.BUDGET}:${userId}:*`),
      this.delPattern(`${CachePrefix.BUDGET_SUMMARY}:${userId}:*`),
    ]);
    this.logger.debug(`Budget caches invalidated for user: ${userId}`, {
      context: 'CacheService',
    });
  }

  /**
   * Record cache operation metrics
   */
  private recordMetric(startTime: number, hit: boolean): void {
    const responseTime = Date.now() - startTime;
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 measurements
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    this.stats.totalOperations++;
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    this.stats.hitRate = this.stats.totalOperations > 0
      ? (this.stats.hits / this.stats.totalOperations) * 100
      : 0;
    
    this.stats.avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats, isConnected: this.isConnected };
  }

  /**
   * Clear all caches (use with caution!)
   */
  async flushAll(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.client!.flushdb();
      this.logger.warn('Cache FLUSH ALL executed', { context: 'CacheService' });
    } catch (error) {
      this.logger.error(`Cache FLUSH error: ${error.message}`, {
        context: 'CacheService',
      });
    }
  }
}
