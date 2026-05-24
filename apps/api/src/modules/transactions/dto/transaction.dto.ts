import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  NotEquals,
} from "class-validator";
import {
  CreateTransactionDto,
  Currency,
  TransactionQuery,
  TransactionSource,
  TransactionType,
  UpdateTransactionDto,
} from "../../../shared/types";

const TRANSACTION_TYPES: TransactionType[] = ["income", "expense"];
const TRANSACTION_SOURCES: TransactionSource[] = ["manual", "pdf"];
const CURRENCIES: Currency[] = ["TRY", "USD", "EUR"];
const SORT_FIELDS: NonNullable<TransactionQuery["sortBy"]>[] = [
  "date",
  "amount",
  "category",
];
const SORT_ORDERS: NonNullable<TransactionQuery["sortOrder"]>[] = [
  "asc",
  "desc",
];

export class TransactionQueryDto implements TransactionQuery {
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryId?: string;

  @IsOptional()
  @IsIn(TRANSACTION_SOURCES)
  source?: TransactionSource;

  @IsOptional()
  @IsISO8601({ strict: true })
  dateFrom?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: "date" | "amount" | "category";

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: "asc" | "desc";

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(250)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number;
}

export class CreateTransactionRequestDto implements CreateTransactionDto {
  @IsISO8601({ strict: true })
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @NotEquals(0)
  @Min(-999999999)
  @Max(999999999)
  amount: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  @IsIn(TRANSACTION_TYPES)
  type: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  categoryLabel?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateTransactionRequestDto implements UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @NotEquals(0)
  @Min(-999999999)
  @Max(999999999)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  categoryLabel?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ResolveDuplicateGroupDto {
  @IsString()
  @IsNotEmpty()
  keepId: string;

  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  transactionIds: string[];
}

export class BulkCategorizeTransactionsDto {
  @IsArray()
  @ArrayMaxSize(250)
  @IsString({ each: true })
  transactionIds: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  categoryLabel: string;

  @IsOptional()
  @IsBoolean()
  applyToSimilar?: boolean;
}

export class BulkUpdateTransactionsDto {
  @IsArray()
  @ArrayMaxSize(250)
  @IsString({ each: true })
  transactionIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  categoryLabel?: string;

  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  applyToSimilar?: boolean;
}
