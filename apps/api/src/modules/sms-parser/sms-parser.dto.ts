import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class ParseSmsDto {
  @IsString()
  @IsNotEmpty()
  sender: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsDateString()
  @IsOptional()
  receivedAt?: string;
}

export class BulkParseSmsDto {
  messages: ParseSmsDto[];
}

export interface ParsedTransactionDto {
  amount: number;
  type: 'income' | 'expense';
  merchant?: string;
  category?: string;
  bankName: string;
  date: Date;
  rawMessage: string;
  confidence: number; // 0-100
}
