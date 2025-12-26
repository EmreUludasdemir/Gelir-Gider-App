import { IsString, IsNumber, IsOptional, IsDate, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBillDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsString()
  @IsIn(['once', 'weekly', 'monthly', 'yearly'])
  frequency: string;

  @IsString()
  categoryId: string;

  @IsString()
  categoryLabel: string;

  @IsNumber()
  @IsOptional()
  reminderDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBillDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsIn(['once', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  categoryLabel?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsNumber()
  @IsOptional()
  reminderDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  paidAt?: Date;
}

export class BillResponseDto {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  dueDate: Date;
  frequency: string;
  categoryId: string;
  categoryLabel: string;
  isPaid: boolean;
  reminderDays: number;
  notes?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
