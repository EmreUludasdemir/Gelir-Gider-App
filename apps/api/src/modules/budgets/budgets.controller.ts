import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(@User('id') userId: string) {
    return this.budgetsService.findAll(userId);
  }

  @Get('status')
  getStatus(@User('id') userId: string) {
    return this.budgetsService.getBudgetStatus(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('id') userId: string) {
    return this.budgetsService.findOne(id, userId);
  }

  @Post()
  create(@User('id') userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @User('id') userId: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, userId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @User('id') userId: string) {
    return this.budgetsService.delete(id, userId);
  }
}
