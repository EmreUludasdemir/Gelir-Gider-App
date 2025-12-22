import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    
    constructor() {
        super({
            // Connection pooling ayarları
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            // Log seviyeleri
            log: process.env.NODE_ENV === 'development' 
                ? ['query', 'info', 'warn', 'error']
                : ['error', 'warn'],
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('PostgreSQL bağlantısı başarıyla kuruldu');
            
            // Connection pool durumunu logla
            if (process.env.NODE_ENV === 'development') {
                this.logger.debug('Database connection pool aktif');
            }
        } catch (error) {
            this.logger.error(`PostgreSQL bağlantı hatası: ${error.message}`);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('PostgreSQL bağlantısı kapatıldı');
    }

    // Bağlantı sağlığını kontrol et
    async healthCheck(): Promise<boolean> {
        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            this.logger.error(`Database health check failed: ${error.message}`);
            return false;
        }
    }

    // Transaction helper with retry logic
    async executeWithRetry<T>(
        fn: (prisma: Prisma.TransactionClient) => Promise<T>,
        maxRetries = 3,
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.$transaction(fn);
            } catch (error) {
                lastError = error;
                this.logger.warn(`Transaction attempt ${attempt}/${maxRetries} failed: ${error.message}`);
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                }
            }
        }
        
        this.logger.error(`Transaction failed after ${maxRetries} attempts`);
        throw lastError;
    }
}
