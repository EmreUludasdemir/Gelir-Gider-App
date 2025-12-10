import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQuery,
} from '../../shared/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Get()
  findAll(@User() user: any, @Query() query: TransactionQuery) {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get('summary')
  getSummary(@User() user: any, @Query() query: TransactionQuery) {
    return this.transactionsService.getSummary(user.id, query);
  }

  @Get('suggestions')
  getSuggestions(@User() user: any) {
    return this.transactionsService.getSuggestions(user.id);
  }

  @Get('recurring')
  getRecurringPayments(@User() user: any) {
    return this.transactionsService.getRecurringPayments(user.id);
  }

  @Get(':id')
  findOne(@User() user: any, @Param('id') id: string) {
    return this.transactionsService.findOne(user.id, id);
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  create(@User() user: any, @Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, createDto);
  }

  @Patch(':id')
  update(
    @User() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@User() user: any, @Param('id') id: string) {
    return this.transactionsService.delete(user.id, id);
  }
}
