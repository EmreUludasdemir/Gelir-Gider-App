import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService, CreateBudgetDto, UpdateBudgetDto } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  async create(@User('userId') userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(userId, dto);
  }

  @Get()
  async findAll(
    @User('userId') userId: string,
    @Query('isActive') isActive?: string
  ) {
    const isActiveFlag =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.budgetsService.findAll(userId, isActiveFlag);
  }

  @Get('summary')
  async getSummary(@User('userId') userId: string) {
    return this.budgetsService.getSummary(userId);
  }

  @Get('alerts')
  async getAlerts(@User('userId') userId: string) {
    return this.budgetsService.checkAlerts(userId);
  }

  @Get(':id')
  async findOne(@User('userId') userId: string, @Param('id') id: string) {
    return this.budgetsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto
  ) {
    return this.budgetsService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(@User('userId') userId: string, @Param('id') id: string) {
    return this.budgetsService.delete(userId, id);
  }
}
