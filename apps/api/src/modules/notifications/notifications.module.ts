import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { CalendarService } from "./calendar.service";
import { TelegramService } from "./telegram.service";
import { SmartNotificationService } from "./smart-notification.service";
import { NotificationsController } from "./notifications.controller";
import { PrismaModule } from "../../prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [EmailService, CalendarService, TelegramService, SmartNotificationService],
  exports: [EmailService, CalendarService, TelegramService, SmartNotificationService],
})
export class NotificationsModule {}
