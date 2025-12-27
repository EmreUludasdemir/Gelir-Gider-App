import { Controller, Get, Post, Body, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { CalendarService } from "./calendar.service";
import { TelegramService } from "./telegram.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";
import { TelegramWebhookDto } from "./dto/notification.dto";

@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly telegramService: TelegramService
  ) {}

  @Get("calendar/bills")
  @UseGuards(JwtAuthGuard)
  async downloadBillsCalendar(@Res() res: Response) {
    // Example bills - in production, fetch from database
    const bills = [
      {
        name: "Elektrik Faturası",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        amount: 350,
      },
      {
        name: "İnternet",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        amount: 180,
      },
      {
        name: "Telefon",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        amount: 120,
      },
    ];

    const ical = this.calendarService.generateBillReminders(bills);

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader("Content-Disposition", "attachment; filename=faturalar.ics");
    res.send(ical);
  }

  @Get("calendar/recurring")
  @UseGuards(JwtAuthGuard)
  async downloadRecurringCalendar(@Res() res: Response) {
    // Example recurring payments - in production, fetch from database
    const payments = [
      { name: "Netflix", amount: 99, day: 15 },
      { name: "Spotify", amount: 40, day: 20 },
      { name: "Spor Salonu", amount: 500, day: 1 },
    ];

    const ical =
      this.calendarService.generateRecurringPaymentCalendar(payments);

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tekrarlayan-odemeler.ics"
    );
    res.send(ical);
  }

  @Post("telegram/webhook")
  async handleTelegramWebhook(@Body() update: TelegramWebhookDto) {
    const result = await this.telegramService.handleWebhook(update);

    if (result && result.response.startsWith("transaction:")) {
      // Parse transaction and save - this would integrate with TransactionsService
      const transactionData = JSON.parse(
        result.response.replace("transaction:", "")
      );

      // Send confirmation
      await this.telegramService.sendTransactionConfirmation(
        update.message.chat.id.toString(),
        transactionData.type,
        transactionData.amount,
        "Diğer", // Default category
        transactionData.description
      );

      return { ok: true };
    }

    if (result) {
      await this.telegramService.sendMessage({
        chatId: update.message.chat.id.toString(),
        text: result.response,
      });
    }

    return { ok: true };
  }

  @Get("telegram/setup")
  async getTelegramSetupInfo() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/api/notifications/telegram/webhook`
      : null;

    return {
      configured: !!botToken,
      webhookUrl,
      setupInstructions: !botToken
        ? [
            "1. BotFather ile yeni bot oluşturun (@BotFather)",
            '2. "TELEGRAM_BOT_TOKEN" env değişkenini ayarlayın',
            "3. Webhook URL'ini Telegram API ile kaydedin",
          ]
        : null,
    };
  }
}
