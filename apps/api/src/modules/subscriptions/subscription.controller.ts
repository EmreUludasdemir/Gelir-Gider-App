import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import {
  CreateSubscriptionDto,
  DismissDetectedSubscriptionDto,
  SubscriptionService,
  UpdateSubscriptionDto,
} from './subscription.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  getSubscriptions(@User('id') userId: string) {
    return this.subscriptionService.findAll(userId);
  }

  @Get('detected')
  getDetectedSuggestions(@User('id') userId: string) {
    return this.subscriptionService.getDetectedSuggestions(userId);
  }

  @Get('summary')
  getSummary(@User('id') userId: string) {
    return this.subscriptionService.getSubscriptionSummary(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@User('id') userId: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(userId, dto);
  }

  @Post('dismiss')
  @HttpCode(HttpStatus.OK)
  dismissSuggestion(
    @User('id') userId: string,
    @Body() dto: DismissDetectedSubscriptionDto,
  ) {
    return this.subscriptionService.dismissSuggestion(userId, dto);
  }

  @Patch(':id')
  update(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@User('id') userId: string, @Param('id') id: string) {
    return this.subscriptionService.remove(userId, id);
  }
}
