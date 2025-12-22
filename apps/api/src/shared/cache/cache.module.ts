/**
 * Cache Module - FAZ 4
 * Provides caching capabilities across the application
 */

import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
