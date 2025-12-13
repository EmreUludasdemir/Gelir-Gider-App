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
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto, UpdateSavingsGoalDto, AddToGoalDto } from './dto/savings-goal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('savings-goals')
@UseGuards(JwtAuthGuard)
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Get()
  findAll(@User('id') userId: string) {
    return this.savingsGoalsService.findAll(userId);
  }

  @Get('summary')
  getSummary(@User('id') userId: string) {
    return this.savingsGoalsService.getSummary(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('id') userId: string) {
    return this.savingsGoalsService.findOne(id, userId);
  }

  @Post()
  create(@User('id') userId: string, @Body() dto: CreateSavingsGoalDto) {
    return this.savingsGoalsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @User('id') userId: string,
    @Body() dto: UpdateSavingsGoalDto,
  ) {
    return this.savingsGoalsService.update(id, userId, dto);
  }

  @Patch(':id/add')
  addAmount(
    @Param('id') id: string,
    @User('id') userId: string,
    @Body() dto: AddToGoalDto,
  ) {
    return this.savingsGoalsService.addAmount(id, userId, dto.amount);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @User('id') userId: string) {
    return this.savingsGoalsService.delete(id, userId);
  }
}
