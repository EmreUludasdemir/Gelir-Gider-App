import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma.service';
import { randomBytes } from 'crypto';

@Controller('telegram')
export class TelegramController {
  constructor(private prisma: PrismaService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: { user: { userId: string } }) {
    const link = await this.prisma.telegramLink.findFirst({
      where: { userId: req.user.userId },
    });

    return {
      linked: !!link,
      telegramId: link?.telegramId || null,
    };
  }

  @Post('link/generate')
  @UseGuards(JwtAuthGuard)
  async generateLinkCode(@Request() req: { user: { userId: string } }) {
    // Delete any existing codes for this user
    await this.prisma.telegramLinkCode.deleteMany({
      where: { userId: req.user.userId },
    });

    // Generate a new code
    const code = randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.telegramLinkCode.create({
      data: {
        code,
        userId: req.user.userId,
        expiresAt,
      },
    });

    return {
      code,
      expiresAt,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'GelirGiderBot',
      deepLink: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'GelirGiderBot'}?start=${code}`,
    };
  }

  @Post('unlink')
  @UseGuards(JwtAuthGuard)
  async unlinkTelegram(@Request() req: { user: { userId: string } }) {
    await this.prisma.telegramLink.deleteMany({
      where: { userId: req.user.userId },
    });

    return { success: true };
  }

  @Post('webhook')
  async handleWebhook(@Body() update: unknown) {
    // Webhook handler for production (alternative to polling)
    // This will be called by Telegram when a message is received
    // Implementation depends on whether you use polling or webhooks
    return { ok: true };
  }
}
