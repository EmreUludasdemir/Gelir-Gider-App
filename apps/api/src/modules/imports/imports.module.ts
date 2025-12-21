import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { PrismaService } from '../../prisma.service';

@Module({
    imports: [TransactionsModule],
    controllers: [ImportsController],
    providers: [ImportsService, PrismaService],
    exports: [ImportsService],
})
export class ImportsModule { }
