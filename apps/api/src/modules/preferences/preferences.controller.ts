import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/preferences.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  get(@User('id') userId: string) {
    return this.preferencesService.get(userId);
  }

  @Patch()
  update(@User('id') userId: string, @Body() dto: UpdatePreferencesDto) {
    return this.preferencesService.update(userId, dto);
  }

  @Post('reset')
  reset(@User('id') userId: string) {
    return this.preferencesService.reset(userId);
  }
}
