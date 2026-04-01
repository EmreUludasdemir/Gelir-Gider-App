import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(() => {
    service = new CurrencyService();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return remote rates when provider responds successfully', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        date: '2026-04-01',
        rates: {
          TRY: 1,
          USD: 0.031,
          EUR: 0.028,
        },
      }),
    } as Response);

    const result = await service.getRates('TRY');

    expect(result.base).toBe('TRY');
    expect(result.rates.USD).toBe(0.031);
  });

  it('should fall back to cached defaults when provider is unavailable', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('fetch failed'));

    const result = await service.getRates('TRY');

    expect(result.base).toBe('TRY');
    expect(result.rates.USD).toBeDefined();
    expect(result.rates.EUR).toBeDefined();
  });
});
