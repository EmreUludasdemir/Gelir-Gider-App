import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdatePreferencesDto } from './dto/preferences.dto';

@Injectable()
export class PreferencesService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    let preferences = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await this.prisma.userPreference.create({
        data: {
          userId,
          language: 'tr',
          currency: 'TRY',
          theme: 'light',
        },
      });
    }

    return preferences;
  }

  async update(userId: string, dto: UpdatePreferencesDto) {
    // Upsert - create if not exists, update if exists
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }

  async reset(userId: string) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: {
        language: 'tr',
        currency: 'TRY',
        theme: 'light',
        emailNotifications: true,
        budgetAlerts: true,
        weeklyReport: false,
      },
      create: {
        userId,
        language: 'tr',
        currency: 'TRY',
        theme: 'light',
      },
    });
  }
}
