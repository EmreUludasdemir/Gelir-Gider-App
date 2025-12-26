import { IsString, IsNumber, IsOptional, IsDate, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsIn(['weekly', 'monthly', 'yearly'])
  billingCycle: string;

  @IsDate()
  @Type(() => Date)
  nextBillingDate: Date;

  @IsString()
  categoryId: string;

  @IsString()
  categoryLabel: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsIn(['weekly', 'monthly', 'yearly'])
  @IsOptional()
  billingCycle?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  nextBillingDate?: Date;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  categoryLabel?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubscriptionResponseDto {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: Date;
  categoryId: string;
  categoryLabel: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
