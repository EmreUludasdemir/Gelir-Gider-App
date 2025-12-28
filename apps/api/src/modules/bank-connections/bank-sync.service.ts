import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { BankConnectionsService } from './bank-connections.service';

@Injectable()
export class BankSyncService {
  private readonly logger = new Logger(BankSyncService.name);
  private isSyncing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bankConnectionsService: BankConnectionsService,
  ) {}

  /**
   * Daily sync job - runs at 6 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleDailySync() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    this.logger.log('Starting daily bank sync job');

    try {
      // Get all active bank connections
      const connections = await this.prisma.bankConnection.findMany({
        where: {
          isActive: true,
          lastSyncStatus: { not: 'disabled' },
        },
        include: {
          user: { select: { id: true, email: true } },
        },
      });

      this.logger.log(`Found ${connections.length} connections to sync`);

      let successCount = 0;
      let failCount = 0;

      for (const connection of connections) {
        try {
          await this.bankConnectionsService.syncTransactions(
            connection.userId,
            connection.id,
          );
          successCount++;
          this.logger.debug(`Synced connection ${connection.id} for user ${connection.userId}`);
        } catch (error) {
          failCount++;
          this.logger.error(
            `Failed to sync connection ${connection.id}: ${error.message}`,
          );
        }

        // Small delay between syncs to avoid rate limiting
        await this.delay(1000);
      }

      this.logger.log(
        `Daily sync completed: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      this.logger.error('Daily sync job failed', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Manual trigger for sync (admin use)
   */
  async triggerSync(userId?: string) {
    const where: any = {
      isActive: true,
      lastSyncStatus: { not: 'disabled' },
    };

    if (userId) {
      where.userId = userId;
    }

    const connections = await this.prisma.bankConnection.findMany({ where });
    
    const results = await Promise.allSettled(
      connections.map((conn) =>
        this.bankConnectionsService.syncTransactions(conn.userId, conn.id),
      ),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { total: connections.length, success, failed };
  }

  /**
   * Get sync status for monitoring
   */
  async getSyncStatus() {
    const [total, active, lastSync] = await Promise.all([
      this.prisma.bankConnection.count(),
      this.prisma.bankConnection.count({ where: { isActive: true } }),
      this.prisma.bankConnection.findFirst({
        where: { lastSyncAt: { not: null } },
        orderBy: { lastSyncAt: 'desc' },
        select: { lastSyncAt: true, lastSyncStatus: true },
      }),
    ]);

    return {
      totalConnections: total,
      activeConnections: active,
      isSyncing: this.isSyncing,
      lastSync: lastSync?.lastSyncAt,
      lastSyncStatus: lastSync?.lastSyncStatus,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
