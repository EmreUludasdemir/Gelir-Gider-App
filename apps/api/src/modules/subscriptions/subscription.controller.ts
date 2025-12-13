import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SubscriptionService } from "./subscription.service";

@Controller("subscriptions")
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Get all detected subscriptions
  @Get()
  async getSubscriptions(@Request() req: { user: { userId: string } }) {
    return this.subscriptionService.getSubscriptionSummary(req.user.userId);
  }

  // Get subscription summary for dashboard
  @Get("summary")
  async getSummary(@Request() req: { user: { userId: string } }) {
    const data = await this.subscriptionService.getSubscriptionSummary(
      req.user.userId
    );

    return {
      totalMonthly: data.totalMonthly,
      totalYearly: data.totalYearly,
      activeCount: data.activeCount,
      upcomingPayments: data.upcomingPayments,
    };
  }
}
