import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private readonly defaultTTL = 60; // 60 seconds

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.client = new Redis(redisUrl);

    this.client.on("error", (_err) => {
      // Redis error handled silently in production
    });

    this.client.on("connect", () => {
      // Redis connected
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.setex(key, this.defaultTTL, serialized);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Redis DEL pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.delPattern(`user:${userId}:*`);
  }

  /**
   * Cache key generators
   */
  static keys = {
    transactions: (userId: string, queryHash?: string) =>
      `user:${userId}:transactions${queryHash ? `:${queryHash}` : ""}`,
    summary: (userId: string, month?: string) =>
      `user:${userId}:summary${month ? `:${month}` : ""}`,
    budgets: (userId: string) => `user:${userId}:budgets`,
  };
}
