import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { CalendarService } from "./calendar.service";
import { TelegramService } from "./telegram.service";
import { SmartNotificationService } from "./smart-notification.service";
import { PushNotificationService } from "./push-notification.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { NotificationsController } from "./notifications.controller";
import { PrismaModule } from "../../prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    EmailService,
    CalendarService,
    TelegramService,
    SmartNotificationService,
    PushNotificationService,
    NotificationSchedulerService,
  ],
  exports: [
    EmailService,
    CalendarService,
    TelegramService,
    SmartNotificationService,
    PushNotificationService,
    NotificationSchedulerService,
  ],
})
export class NotificationsModule {}
