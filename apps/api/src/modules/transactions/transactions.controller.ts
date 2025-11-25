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
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQuery,
} from '../../shared/types';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@Query() query: TransactionQuery) {
    return this.transactionsService.findAll(query);
  }

  @Get('summary')
  getSummary() {
    return this.transactionsService.getSummary();
  }

  @Get('suggestions')
  getSuggestions() {
    return this.transactionsService.getSuggestions();
  }

  @Get('recurring')
  getRecurringPayments() {
    return this.transactionsService.getRecurringPayments();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return this.transactionsService.delete(id);
  }
}
