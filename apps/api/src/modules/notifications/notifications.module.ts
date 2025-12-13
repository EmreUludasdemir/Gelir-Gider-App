import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { CalendarService } from "./calendar.service";
import { TelegramService } from "./telegram.service";
import { NotificationsController } from "./notifications.controller";
import { PrismaModule } from "../../prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [EmailService, CalendarService, TelegramService],
  exports: [EmailService, CalendarService, TelegramService],
})
export class NotificationsModule {}
