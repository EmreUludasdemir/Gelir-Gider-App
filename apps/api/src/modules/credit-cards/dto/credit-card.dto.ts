import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Length,
  Min,
  Max,
  Matches,
  IsHexColor,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCreditCardDto {
  @ApiProperty({ description: 'Kart adı', example: 'Ana Kartım' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: 'Son 4 hane', example: '1234' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Son 4 hane rakamlardan oluşmalıdır' })
  lastFourDigits: string;

  @ApiPropertyOptional({ description: 'Kart tipi', example: 'visa' })
  @IsString()
  @IsOptional()
  cardType?: string = 'visa';

  @ApiProperty({ description: 'Kredi limiti', example: 10000 })
  @IsNumber()
  @Min(0)
  creditLimit: number;

  @ApiPropertyOptional({ description: 'Mevcut bakiye', example: 2500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentBalance?: number = 0;

  @ApiPropertyOptional({ description: 'Hesap kesim günü (1-31)', example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  billingDay?: number = 1;

  @ApiPropertyOptional({ description: 'Son ödeme günü (1-31)', example: 25 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number = 15;

  @ApiPropertyOptional({ description: 'Faiz oranı (%)', example: 2.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  interestRate?: number = 0;

  @ApiPropertyOptional({ description: 'Kart rengi (hex)', example: '#1F2937' })
  @IsHexColor()
  @IsOptional()
  color?: string = '#1F2937';
}

export class UpdateCreditCardDto {
  @ApiPropertyOptional({ description: 'Kart adı', example: 'Ana Kartım' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({ description: 'Son 4 hane', example: '1234' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}$/, { message: 'Son 4 hane rakamlardan oluşmalıdır' })
  lastFourDigits?: string;

  @ApiPropertyOptional({ description: 'Kart tipi', example: 'visa' })
  @IsString()
  @IsOptional()
  cardType?: string;

  @ApiPropertyOptional({ description: 'Kredi limiti', example: 10000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Mevcut bakiye', example: 2500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentBalance?: number;

  @ApiPropertyOptional({ description: 'Hesap kesim günü (1-31)', example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  billingDay?: number;

  @ApiPropertyOptional({ description: 'Son ödeme günü (1-31)', example: 25 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional({ description: 'Faiz oranı (%)', example: 2.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @ApiPropertyOptional({ description: 'Kart rengi (hex)', example: '#1F2937' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Minimum ödeme tutarı' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPayment?: number;

  @ApiPropertyOptional({ description: 'Kart aktif mi?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreditCardAmountDto {
  @ApiProperty({ description: 'Tutar', example: 500 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class InstallmentCalculationDto {
  @ApiProperty({ description: 'Toplam tutar', example: 6000 })
  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @ApiProperty({ description: 'Taksit sayısı', example: 12 })
  @IsNumber()
  @Min(1)
  @Max(60)
  months: number;

  @ApiProperty({ description: 'Faiz oranı (%)', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;
}

export class CreditCardQueryDto {
  @ApiPropertyOptional({ description: 'Sadece aktif kartlar' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  activeOnly?: boolean;
}

export class CreditCardSummaryResponseDto {
  @ApiProperty()
  totalCards: number;

  @ApiProperty()
  totalLimit: number;

  @ApiProperty()
  totalBalance: number;

  @ApiProperty()
  availableCredit: number;

  @ApiProperty()
  utilizationRate: number;

  @ApiProperty({ type: 'array' })
  upcomingPayments: Array<{
    cardName: string;
    dueDay: number;
    balance: number;
    minPayment: number;
  }>;
}

export class InstallmentResponseDto {
  @ApiProperty()
  monthlyPayment: number;

  @ApiProperty()
  totalPayment: number;

  @ApiProperty()
  totalInterest: number;
}
