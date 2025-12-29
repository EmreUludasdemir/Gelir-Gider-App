import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrencyService } from './currency.service';

@Controller('currency')
@UseGuards(JwtAuthGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  async getRates(@Query('base') base: string = 'TRY') {
    return this.currencyService.getRates(base);
  }

  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string
  ) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return { error: 'Invalid amount' };
    }

    const converted = await this.currencyService.convert(numAmount, from, to);
    return {
      original: { amount: numAmount, currency: from },
      converted: { amount: converted, currency: to },
    };
  }

  @Get('supported')
  getSupportedCurrencies() {
    return this.currencyService.getSupportedCurrencies();
  }
}
