import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  Min,
  Length,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export type DebtType = 'owed_to_me' | 'i_owe';

export class CreateDebtDto {
  @IsString()
  @Length(1, 100)
  personName: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'TRY';

  @IsString()
  type: DebtType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateDebtDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  personName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  type?: DebtType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}

export class DebtQueryDto {
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
  @IsString()
  type?: DebtType;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
