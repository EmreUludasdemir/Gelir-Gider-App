import { Module } from '@nestjs/common';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma.module';


@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TransactionsModule,
    UploadsModule,
    BudgetsModule
  ],
  controllers: [HealthController],
})
export class AppModule { }
