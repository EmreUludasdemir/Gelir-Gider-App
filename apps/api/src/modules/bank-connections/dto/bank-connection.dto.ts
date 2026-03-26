import { IsString, IsOptional, IsIn, IsBoolean } from "class-validator";

const SUPPORTED_BANK_CODES = [
  "garanti",
  "isbank",
  "akbank",
  "mock",
] as const;

export class CreateBankConnectionDto {
  @IsString()
  @IsIn(SUPPORTED_BANK_CODES)
  bankCode: string;

  @IsString()
  bankName: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  @IsIn(["checking", "savings", "credit"])
  accountType?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class StartBankConnectionDto {
  @IsString()
  @IsIn(SUPPORTED_BANK_CODES)
  bankCode: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;
}

export class BankConnectionCallbackDto {
  @IsString()
  @IsIn(SUPPORTED_BANK_CODES)
  bankCode: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  error_description?: string;
}

export class UpdateBankConnectionDto {
  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
