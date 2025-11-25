import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionStorageService } from '../../shared/transaction-storage.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionStorageService],
  exports: [TransactionsService, TransactionStorageService],
})
export class TransactionsModule {}
