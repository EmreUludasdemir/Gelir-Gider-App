import { IsString, IsOptional, IsIn, IsBoolean } from "class-validator";

export class CreateBankConnectionDto {
  @IsString()
  @IsIn(["yapikredi", "garanti", "isbank", "ziraat", "akbank", "mock"])
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
