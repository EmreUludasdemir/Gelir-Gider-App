import { Module } from '@nestjs/common';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma.module';
import { SavingsGoalsModule } from './modules/savings-goals/savings-goals.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { PreferencesModule } from './modules/preferences/preferences.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TransactionsModule,
    UploadsModule,
    SavingsGoalsModule,
    BudgetsModule,
    PreferencesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

