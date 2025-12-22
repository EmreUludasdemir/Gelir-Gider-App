import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

/**
 * Compression Middleware
 * 
 * Compresses HTTP responses using gzip/deflate to reduce bandwidth usage
 * and improve response times.
 * 
 * Features:
 * - Gzip compression for responses > 1kb
 * - Skips compression for already compressed content (images, videos)
 * - Configurable compression level
 * - Threshold-based compression
 */

// Compression options
export interface CompressionOptions {
  // Minimum response size to compress (bytes)
  threshold?: number | string;
  // Compression level (0-9, higher = better compression but slower)
  level?: number;
  // Memory level for zlib (1-9)
  memLevel?: number;
  // Filter function to decide whether to compress
  filter?: (req: Request, res: Response) => boolean;
}

// Default compression filter
const defaultFilter = (req: Request, res: Response): boolean => {
  // Skip compression if client doesn't accept it
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Get content type
  const contentType = res.getHeader('Content-Type') as string;
  
  // Skip compression for already compressed content types
  if (contentType) {
    const skipTypes = [
      'image/',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip',
      'application/x-rar',
      'application/x-7z',
      'application/octet-stream',
    ];

    for (const type of skipTypes) {
      if (contentType.includes(type)) {
        return false;
      }
    }
  }

  // Use default compression filter from compression package
  return compression.filter(req, res);
};

// Default options
const defaultOptions: CompressionOptions = {
  threshold: 1024, // 1kb minimum
  level: 6, // Balanced compression
  memLevel: 8, // Default memory level
  filter: defaultFilter,
};

/**
 * Creates compression middleware with custom options
 */
export function createCompressionMiddleware(options?: CompressionOptions) {
  const opts = { ...defaultOptions, ...options };
  return compression(opts);
}

/**
 * NestJS Compression Middleware
 */
@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private compressionHandler: any;

  constructor() {
    this.compressionHandler = compression({
      threshold: 1024, // 1kb
      level: 6,
      filter: defaultFilter,
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.compressionHandler(req, res, next);
  }
}

/**
 * Performance-optimized compression config for different scenarios
 */
export const CompressionPresets = {
  // Default balanced compression
  balanced: {
    threshold: 1024,
    level: 6,
    memLevel: 8,
  },

  // Fast compression (lower CPU usage)
  fast: {
    threshold: 2048,
    level: 1,
    memLevel: 8,
  },

  // Best compression (higher CPU usage)
  best: {
    threshold: 512,
    level: 9,
    memLevel: 9,
  },

  // API optimized (good for JSON responses)
  api: {
    threshold: 256,
    level: 6,
    memLevel: 8,
  },
} as const;
