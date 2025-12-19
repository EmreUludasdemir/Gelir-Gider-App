import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PushService } from "./push.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../auth/user.decorator";

interface SubscribeDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UnsubscribeDto {
  endpoint: string;
}

@UseGuards(JwtAuthGuard)
@Controller("push")
export class PushController {
  constructor(private readonly pushService: PushService) {}

  /**
   * Subscribe to push notifications
   * POST /push/subscribe
   */
  @Post("subscribe")
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@User() user: any, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(user.id, dto);
  }

  /**
   * Unsubscribe from push notifications
   * DELETE /push/unsubscribe
   */
  @Delete("unsubscribe")
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@User() user: any, @Body() dto: UnsubscribeDto) {
    return this.pushService.unsubscribe(user.id, dto.endpoint);
  }

  /**
   * Send test notification (for debugging)
   * POST /push/test
   */
  @Post("test")
  @HttpCode(HttpStatus.OK)
  async sendTest(@User() user: any) {
    const sent = await this.pushService.sendToUser(user.id, {
      title: "🎉 Test Bildirimi",
      body: "Push bildirimleri çalışıyor!",
      icon: "/icons/app.png",
    });

    return { success: true, sent };
  }
}
