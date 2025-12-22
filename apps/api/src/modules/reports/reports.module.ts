import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
    imports: [TransactionsModule],
    controllers: [ReportsController],
    providers: [ReportsService, PrismaService],
    exports: [ReportsService],
})
export class ReportsModule { }
