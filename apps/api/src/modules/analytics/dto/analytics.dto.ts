import { IsString, IsOptional, IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyticsQueryDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  groupBy?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class SpendingTrendDto {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export class CategoryBreakdownDto {
  categoryId: string;
  categoryLabel: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export class AnalyticsResponseDto {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  spendingTrend: SpendingTrendDto[];
  categoryBreakdown: CategoryBreakdownDto[];
  averageDailySpending: number;
  topCategories: CategoryBreakdownDto[];
}
