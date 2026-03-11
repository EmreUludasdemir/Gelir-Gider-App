import {
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type TransactionType = 'income' | 'expense';

export class ExportQueryDto {
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  type?: TransactionType;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class ExportResponseDto {
  success: boolean;
  filename: string;
  format: ExportFormat;
  recordCount: number;
}
