import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsIn(['tr', 'en'])
  language?: string;

  @IsOptional()
  @IsIn(['TRY', 'USD', 'EUR'])
  currency?: string;

  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: string;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  budgetAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;
}
