import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AchievementCategory {
  SAVINGS = 'savings',
  TRACKING = 'tracking',
  BUDGET = 'budget',
  STREAK = 'streak',
  MILESTONE = 'milestone',
}

export class AchievementConditionDto {
  @ApiProperty({ description: 'Koşul tipi', example: 'transactions_added' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Hedef değer', example: 10 })
  @IsNumber()
  @Min(1)
  value: number;
}

export class AchievementDto {
  @ApiProperty({ description: 'Başarım ID', example: 'first_transaction' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Başarım adı', example: 'Başlangıç' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Açıklama', example: 'İlk işlemini ekle' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'İkon', example: '✨' })
  @IsString()
  icon: string;

  @ApiProperty({ enum: AchievementCategory })
  @IsEnum(AchievementCategory)
  category: AchievementCategory;

  @ApiProperty({ description: 'XP ödülü', example: 50 })
  @IsNumber()
  @Min(0)
  xpReward: number;

  @ApiProperty({ type: AchievementConditionDto })
  condition: AchievementConditionDto;
}

export class AchievementWithStatusDto extends AchievementDto {
  @ApiProperty({ description: 'Kilidi açılmış mı?' })
  unlocked: boolean;
}

export class UserStatsDto {
  @ApiProperty({ description: 'Toplam XP', example: 450 })
  @IsNumber()
  totalXP: number;

  @ApiProperty({ description: 'Seviye', example: 3 })
  @IsNumber()
  level: number;

  @ApiProperty({ description: 'Mevcut seri', example: 5 })
  @IsNumber()
  currentStreak: number;

  @ApiProperty({ description: 'En uzun seri', example: 12 })
  @IsNumber()
  longestStreak: number;

  @ApiProperty({ description: 'Açılmış başarımlar', type: [String] })
  @IsArray()
  @IsString({ each: true })
  unlockedAchievements: string[];

  @ApiProperty({ description: 'Son aktivite tarihi' })
  @IsString()
  lastActivityDate: string;
}

export class LevelProgressDto {
  @ApiProperty({ description: 'Mevcut seviyedeki XP', example: 50 })
  @IsNumber()
  current: number;

  @ApiProperty({ description: 'Sonraki seviye için gereken XP', example: 300 })
  @IsNumber()
  needed: number;

  @ApiProperty({ description: 'İlerleme yüzdesi', example: 16.67 })
  @IsNumber()
  progress: number;
}

export class LeaderboardEntryDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  xp: number;

  @ApiProperty()
  @IsNumber()
  level: number;
}

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ description: 'Sonuç limiti', example: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class CheckAchievementsResponseDto {
  @ApiProperty({ description: 'Yeni açılan başarımlar', type: [AchievementDto] })
  newlyUnlocked: AchievementDto[];

  @ApiProperty({ description: 'Kazanılan toplam XP' })
  totalXPEarned: number;
}
