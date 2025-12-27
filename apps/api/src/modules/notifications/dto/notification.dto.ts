import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  Length,
} from 'class-validator';

export type NotificationType =
  | 'budget_alert'
  | 'bill_reminder'
  | 'goal_progress'
  | 'weekly_report'
  | 'anomaly_detected';

export type NotificationChannel = 'email' | 'push' | 'telegram';

export class CreateNotificationDto {
  @IsString()
  type: NotificationType;

  @IsString()
  @Length(1, 200)
  title: string;

  @IsString()
  @Length(1, 1000)
  body: string;

  @IsString()
  @IsOptional()
  channel?: NotificationChannel = 'push';

  @IsString()
  @IsOptional()
  actionUrl?: string;
}

export class NotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  telegramNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  budgetAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  billReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  weeklyReport?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(7)
  reminderDaysBefore?: number;
}

export class TelegramWebhookDto {
  @IsNumber()
  update_id: number;

  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}
