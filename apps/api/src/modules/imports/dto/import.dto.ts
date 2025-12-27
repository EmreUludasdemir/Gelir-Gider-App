import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type ImportFormat = 'csv' | 'excel' | 'json';

export class ParsedTransactionDto {
  @IsDateString()
  date: string;

  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsString()
  type: 'income' | 'expense';

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  categoryLabel?: string;
}

export class ImportResultDto {
  success: boolean;
  totalParsed: number;
  totalImported: number;
  errors: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParsedTransactionDto)
  transactions: ParsedTransactionDto[];
}

export class ImportOptionsDto {
  @IsString()
  @IsOptional()
  format?: ImportFormat;

  @IsString()
  @IsOptional()
  dateFormat?: string;

  @IsString()
  @IsOptional()
  delimiter?: string;
}
