/**
 * Cache Decorators - FAZ 4
 * Method decorators for automatic caching
 */

import { CachePrefix, CacheTTL } from './cache.service';

/**
 * Cache key metadata
 */
export interface CacheKeyOptions {
  prefix: string;
  ttl?: number;
  userIdParam?: string;  // Parameter name containing userId
  includeParams?: string[];  // Query params to include in key
}

/**
 * Metadata key for cache options
 */
export const CACHE_KEY_METADATA = 'cache:options';

/**
 * Decorator to mark a method for caching
 * Note: This is metadata-only, actual caching logic is in CacheInterceptor
 */
export function Cacheable(options: CacheKeyOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(CACHE_KEY_METADATA, options, target, propertyKey);
    return descriptor;
  };
}

/**
 * Decorator to mark a method that invalidates cache
 */
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

export interface CacheInvalidateOptions {
  prefixes: string[];
  userIdParam?: string;
}

export function CacheInvalidate(options: CacheInvalidateOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(CACHE_INVALIDATE_METADATA, options, target, propertyKey);
    return descriptor;
  };
}

/**
 * Pre-defined cache decorators for common use cases
 */
export const CacheTransactions = () => Cacheable({
  prefix: CachePrefix.TRANSACTION_LIST,
  ttl: CacheTTL.MEDIUM,
  userIdParam: 'userId',
  includeParams: ['type', 'categoryId', 'dateFrom', 'dateTo', 'page', 'limit', 'search'],
});

export const CacheTransactionSummary = () => Cacheable({
  prefix: CachePrefix.TRANSACTION_SUMMARY,
  ttl: CacheTTL.MEDIUM,
  userIdParam: 'userId',
  includeParams: ['dateFrom', 'dateTo'],
});

export const CacheBudgets = () => Cacheable({
  prefix: CachePrefix.BUDGET,
  ttl: CacheTTL.MEDIUM,
  userIdParam: 'userId',
});

export const CacheBudgetSummary = () => Cacheable({
  prefix: CachePrefix.BUDGET_SUMMARY,
  ttl: CacheTTL.MEDIUM,
  userIdParam: 'userId',
});

export const CacheAnalytics = () => Cacheable({
  prefix: CachePrefix.ANALYTICS,
  ttl: CacheTTL.LONG,
  userIdParam: 'userId',
  includeParams: ['period', 'dateFrom', 'dateTo'],
});

export const CacheCategories = () => Cacheable({
  prefix: CachePrefix.CATEGORY,
  ttl: CacheTTL.VERY_LONG,
});

/**
 * Cache invalidation decorators
 */
export const InvalidateTransactionCache = () => CacheInvalidate({
  prefixes: [
    CachePrefix.TRANSACTION,
    CachePrefix.TRANSACTION_LIST,
    CachePrefix.TRANSACTION_SUMMARY,
    CachePrefix.ANALYTICS,
    CachePrefix.SUGGESTIONS,
    CachePrefix.RECURRING,
  ],
  userIdParam: 'userId',
});

export const InvalidateBudgetCache = () => CacheInvalidate({
  prefixes: [CachePrefix.BUDGET, CachePrefix.BUDGET_SUMMARY],
  userIdParam: 'userId',
});
