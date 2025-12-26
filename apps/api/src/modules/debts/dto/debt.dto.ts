import { IsString, IsNumber, IsOptional, IsDate, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDebtDto {
  @IsString()
  personName: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsIn(['owed_to_me', 'i_owe'])
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;
}

export class UpdateDebtDto {
  @IsString()
  @IsOptional()
  personName?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsIn(['owed_to_me', 'i_owe'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  paidAt?: Date;
}

export class DebtResponseDto {
  id: string;
  userId: string;
  personName: string;
  amount: number;
  currency: string;
  type: string;
  description?: string;
  dueDate?: Date;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
