import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  CATEGORY = 'category',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Başlangıç tarihi', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Bitiş tarihi', example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: ReportType, default: ReportType.SUMMARY })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType = ReportType.SUMMARY;

  @ApiPropertyOptional({ enum: ReportFormat, default: ReportFormat.PDF })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat = ReportFormat.PDF;
}

export class ScheduleReportDto {
  @ApiProperty({ description: 'Email adresi', example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class CategoryBreakdownDto {
  @ApiProperty()
  category: string;

  @ApiProperty()
  income: number;

  @ApiProperty()
  expense: number;

  @ApiProperty()
  net: number;

  @ApiProperty()
  count: number;
}

export class ReportSummaryDto {
  @ApiProperty({ description: 'Toplam gelir' })
  totalIncome: number;

  @ApiProperty({ description: 'Toplam gider' })
  totalExpense: number;

  @ApiProperty({ description: 'Net bakiye' })
  balance: number;

  @ApiProperty({ description: 'İşlem sayısı' })
  transactionCount: number;

  @ApiProperty({ description: 'Kategori dağılımı', type: 'object' })
  categoryBreakdown: Record<string, {
    income: number;
    expense: number;
    count: number;
  }>;
}

export class ReportResponseDto {
  @ApiProperty({ description: 'Rapor başarıyla oluşturuldu mu?' })
  success: boolean;

  @ApiProperty({ description: 'Rapor dosya adı' })
  fileName: string;

  @ApiProperty({ description: 'Dosya tipi' })
  contentType: string;

  @ApiProperty({ description: 'Dosya boyutu (bytes)' })
  size: number;
}

export class ScheduleReportResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}
