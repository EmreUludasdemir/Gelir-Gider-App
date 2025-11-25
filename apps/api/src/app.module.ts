import { Module } from '@nestjs/common';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TransactionsModule, UploadsModule],
  controllers: [HealthController],
})
export class AppModule {}
