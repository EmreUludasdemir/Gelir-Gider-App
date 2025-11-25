import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { TransactionStorageService } from '../../shared/transaction-storage.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, TransactionStorageService],
})
export class UploadsModule {}
