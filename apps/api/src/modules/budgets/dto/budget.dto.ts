import { IsString, IsNumber, IsOptional, Min, Max, IsBoolean, IsIn } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  categoryId: string;

  @IsString()
  categoryLabel: string;

  @IsNumber()
  @Min(0)
  limitAmount: number;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'])
  period?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  alertThreshold?: number;
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  limitAmount?: number;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'])
  period?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  alertThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
