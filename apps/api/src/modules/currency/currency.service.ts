import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppException, ErrorCode } from '../../shared';

export interface ExchangeRate {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ExchangeRateApiResponse {
  success?: boolean;
  date?: string;
  rates?: Record<string, number>;
}

// Supported currencies
export const SUPPORTED_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cachedRates: ExchangeRate | null = null;
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

  // Fallback rates (approximate, updated periodically)
  private readonly fallbackRates: Record<string, number> = {
    TRY: 1,
    USD: 0.031,
    EUR: 0.028,
    GBP: 0.024,
    CHF: 0.027,
    JPY: 4.6,
    AUD: 0.047,
    CAD: 0.042,
  };

  /**
   * Get exchange rates with caching
   */
  async getRates(baseCurrency: string = 'TRY'): Promise<ExchangeRate> {
    // Check cache
    if (this.cachedRates && this.lastFetch) {
      const cacheAge = Date.now() - this.lastFetch.getTime();
      if (cacheAge < this.CACHE_DURATION_MS && this.cachedRates.base === baseCurrency) {
        return this.cachedRates;
      }
    }

    try {
      // Try to fetch from a free API
      const rates = await this.fetchRatesFromAPI(baseCurrency);
      this.cachedRates = rates;
      this.lastFetch = new Date();
      return rates;
    } catch (error) {
      const message =
        error instanceof AppException
          ? ((error.getResponse() as { error?: { message?: string } } | undefined)?.error?.message ||
            error.message)
          : 'Failed to fetch exchange rates';
      const code = error instanceof AppException ? error.code : ErrorCode.EXTERNAL_SERVICE_ERROR;
      this.logger.warn(
        `Currency provider fallback [provider=exchange_rate_host code=${code}] ${message}`,
      );
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Fetch rates from external API
   */
  private async fetchRatesFromAPI(baseCurrency: string): Promise<ExchangeRate> {
    // Using exchangerate.host (free, no API key required)
    const url = 'https://api.exchangerate.host/latest?base=' + baseCurrency + '&symbols=' + SUPPORTED_CURRENCIES.join(',');
    
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new AppException(
          response.status >= 500 ? ErrorCode.EXTERNAL_UNAVAILABLE : ErrorCode.EXTERNAL_SERVICE_ERROR,
          'Kur servisi istegi basarisiz oldu.',
          {
            module: 'currency',
            provider: 'exchange_rate_host',
            statusCode: response.status,
          },
        );
      }

      const data = (await response.json()) as ExchangeRateApiResponse;
      
      if (!data.success && !data.rates) {
        throw new AppException(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          'Kur servisi gecersiz veri dondurdu.',
          {
            module: 'currency',
            provider: 'exchange_rate_host',
          },
        );
      }

      return {
        base: baseCurrency,
        date: data.date || new Date().toISOString().split('T')[0],
        rates: data.rates || this.fallbackRates,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      const isTimeout =
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'TimeoutError');

      throw new AppException(
        isTimeout ? ErrorCode.EXTERNAL_TIMEOUT : ErrorCode.EXTERNAL_UNAVAILABLE,
        isTimeout
          ? 'Kur servisi zaman asimina ugradi.'
          : 'Kur servisine su anda ulasilamiyor.',
        {
          module: 'currency',
          provider: 'exchange_rate_host',
          originalMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }

  /**
   * Get fallback rates when API is unavailable
   */
  private getFallbackRates(baseCurrency: string): ExchangeRate {
    const baseRate = this.fallbackRates[baseCurrency] || 1;
    const rates: Record<string, number> = {};

    for (const currency of SUPPORTED_CURRENCIES) {
      const targetRate = this.fallbackRates[currency] || 1;
      rates[currency] = targetRate / baseRate;
    }

    return {
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates,
    };
  }

  /**
   * Convert amount between currencies
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getRates(fromCurrency);
    const rate = rates.rates[toCurrency];

    if (!rate) {
      this.logger.warn('Rate not found for ' + toCurrency + ', using 1:1');
      return amount;
    }

    return Math.round(amount * rate * 100) / 100;
  }

  /**
   * Convert multiple amounts to a base currency
   */
  async convertToBase(
    amounts: Array<{ amount: number; currency: string }>,
    baseCurrency: string
  ): Promise<number> {
    let total = 0;

    for (const item of amounts) {
      total += await this.convert(item.amount, item.currency, baseCurrency);
    }

    return total;
  }

  /**
   * Get the list of supported currencies
   */
  getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return [
      { code: 'TRY', name: 'Turk Lirasi', symbol: '\u20BA' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '\u20AC' },
      { code: 'GBP', name: 'British Pound', symbol: '\u00A3' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    ];
  }

  /**
   * Format amount with currency symbol
   */
  formatCurrency(amount: number, currency: string, locale: string = 'tr-TR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Refresh rates daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async refreshRates(): Promise<void> {
    this.logger.log('Refreshing exchange rates');
    try {
      await this.getRates('TRY');
      this.logger.log('Exchange rates refreshed successfully');
    } catch (error) {
      this.logger.error(
        'Failed to refresh exchange rates',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
