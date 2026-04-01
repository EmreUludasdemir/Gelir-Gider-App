import {
  getEncryptionSecret,
  getJwtRefreshSecret,
  getJwtSecret,
  validateSecurityConfig,
} from './security.config';

describe('security.config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should use explicit JWT secrets when provided', () => {
    process.env.JWT_SECRET = 'custom-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'custom-refresh-secret';

    expect(getJwtSecret()).toBe('custom-jwt-secret');
    expect(getJwtRefreshSecret()).toBe('custom-refresh-secret');
  });

  it('should fall back to the access secret for refresh tokens', () => {
    process.env.JWT_SECRET = 'shared-secret';
    delete process.env.JWT_REFRESH_SECRET;

    expect(getJwtRefreshSecret()).toBe('shared-secret');
  });

  it('should use bank encryption secret when ENCRYPTION_KEY is not set', () => {
    delete process.env.ENCRYPTION_KEY;
    process.env.BANK_ENCRYPTION_KEY = 'bank-only-secret';

    expect(getEncryptionSecret()).toBe('bank-only-secret');
  });

  it('should fail fast in production when required secrets are missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.ENCRYPTION_KEY;
    delete process.env.BANK_ENCRYPTION_KEY;

    expect(() => validateSecurityConfig()).toThrow(
      'Security configuration errors:',
    );
  });
});
