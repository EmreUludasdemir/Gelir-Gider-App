import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { PrismaModule } from "./prisma.module";
import { RedisModule } from "./redis.module";
import { SavingsGoalsModule } from "./modules/savings-goals/savings-goals.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SecurityModule } from "./modules/security/security.module";
import { CreditCardsModule } from "./modules/credit-cards/credit-cards.module";
import { BankConnectionsModule } from "./modules/bank-connections/bank-connections.module";
import { ExportModule } from "./modules/export/export.module";
import { PushModule } from "./modules/push/push.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { BillsModule } from "./modules/bills/bills.module";
import { DebtsModule } from "./modules/debts/debts.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SmsParserModule } from "./modules/sms-parser/sms-parser.module";

@Module({
  imports: [
    // Rate Limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    TransactionsModule,
    UploadsModule,
    SavingsGoalsModule,
    BudgetsModule,
    PreferencesModule,
    NotificationsModule,
    SecurityModule,
    CreditCardsModule,
    BankConnectionsModule,
    ExportModule,
    PushModule,
    AnalyticsModule,
    BillsModule,
    DebtsModule,
    SubscriptionsModule,
    ImportsModule,
    ReportsModule,
    SmsParserModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
