import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ParsedTransactionFromPdfDto {
  @IsString()
  date: string;

  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsString()
  type: 'income' | 'expense';

  @IsString()
  categoryId: string;

  @IsString()
  categoryLabel: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;
}

export class UploadResultDto {
  success: boolean;
  duplicate?: boolean;
  filename: string;
  totalParsed: number;
  totalSaved: number;
  lowConfidenceCount: number;

  @IsArray()
  errors: string[];

  @IsArray()
  suggestions?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParsedTransactionFromPdfDto)
  transactions: ParsedTransactionFromPdfDto[];
}

export class BankDetectionResultDto {
  @IsString()
  bankCode: string;

  @IsString()
  bankName: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;
}
