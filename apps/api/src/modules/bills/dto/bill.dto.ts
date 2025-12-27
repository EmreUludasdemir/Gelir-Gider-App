import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export type BillFrequency = 'once' | 'weekly' | 'monthly' | 'yearly';

export class CreateBillDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'TRY';

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  frequency?: BillFrequency = 'monthly';

  @IsString()
  categoryId: string;

  @IsString()
  categoryLabel: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  reminderDays?: number = 3;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBillDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  frequency?: BillFrequency;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  categoryLabel?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  reminderDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}

export class BillQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
