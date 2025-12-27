import {
  IsString,
  IsNumber,
  IsOptional,
  Length,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 2FA DTOs
export class TwoFactorCodeDto {
  @ApiProperty({ description: '6 haneli TOTP kodu', example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class TwoFactorVerifyDto {
  @ApiProperty({ description: 'Kullanıcı ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: '6 haneli TOTP kodu', example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class TwoFactorSetupResponseDto {
  @ApiProperty({ description: '2FA gizli anahtarı' })
  secret: string;

  @ApiProperty({ description: 'QR kod URL' })
  qrCodeUrl: string;
}

export class TwoFactorEnableResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  backupCodes?: string[];

  @ApiPropertyOptional()
  error?: string;
}

export class TwoFactorVerifyResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiPropertyOptional()
  error?: string;
}

// Backup Code DTOs
export class BackupCodeVerifyDto {
  @ApiProperty({ description: 'Kullanıcı ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Yedek kod', example: 'ABCD-1234-EFGH' })
  @IsString()
  @Length(8, 20)
  code: string;
}

// Audit Log DTOs
export class AuditLogQueryDto {
  @ApiPropertyOptional({ description: 'Sonuç limiti', default: 50 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class AuditLogEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  userAgent: string;

  @ApiProperty()
  metadata: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;
}

export class LoginHistoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  userAgent: string;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  createdAt: Date;
}

// Security Status DTO
export class SecurityStatusDto {
  @ApiProperty({ description: '2FA aktif mi?' })
  twoFactorEnabled: boolean;

  @ApiProperty({ description: 'Google hesabı bağlı mı?' })
  googleConnected: boolean;

  @ApiProperty({ description: 'GitHub hesabı bağlı mı?' })
  githubConnected: boolean;

  @ApiProperty({ description: 'Hesap oluşturma tarihi' })
  accountAge: Date;

  @ApiProperty({ description: 'Son 24 saatteki başarısız giriş denemeleri' })
  recentFailedLogins: number;
}

// Security Event DTOs
export class SecurityEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty()
  createdAt: Date;
}
