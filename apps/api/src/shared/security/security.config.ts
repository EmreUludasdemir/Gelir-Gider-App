import * as crypto from 'crypto';

/**
 * Security Configuration
 * Guvenlik ayarlari ve secret yonetimi
 */

const DEV_FALLBACKS = {
  jwt: 'dev-jwt-secret-not-for-production-please-set-env',
  session: 'dev-session-secret-not-for-production-please-set-env',
  encryption: 'dev-encryption-secret-not-for-production-please-set-env',
} as const;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveSecret(
  envName: string,
  fallback: keyof typeof DEV_FALLBACKS,
): string {
  const value = readEnv(envName);
  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envName} is required in production`);
  }

  return DEV_FALLBACKS[fallback];
}

export function getJwtSecret(): string {
  return resolveSecret('JWT_SECRET', 'jwt');
}

export function getJwtRefreshSecret(): string {
  return readEnv('JWT_REFRESH_SECRET') || getJwtSecret();
}

export function getSessionSecret(): string {
  return resolveSecret('SESSION_SECRET', 'session');
}

export function getEncryptionSecret(): string {
  return (
    readEnv('ENCRYPTION_KEY') ||
    readEnv('BANK_ENCRYPTION_KEY') ||
    resolveSecret('ENCRYPTION_KEY', 'encryption')
  );
}

export function getEmailVerificationSecret(): string {
  return readEnv('EMAIL_VERIFICATION_SECRET') || getJwtSecret();
}

export function getPasswordResetSecretBase(): string {
  return readEnv('PASSWORD_RESET_SECRET') || getJwtSecret();
}

export function getFrontendBaseUrl(): string {
  const baseUrl =
    readEnv('APP_URL') ||
    readEnv('FRONTEND_URL') ||
    'http://localhost:3000';

  return baseUrl.replace(/\/+$/, '');
}

export const SecurityConfig = {
  jwt: {
    get secret() {
      return getJwtSecret();
    },
    get refreshSecret() {
      return getJwtRefreshSecret();
    },
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'gelir-gider-api',
    audience: process.env.JWT_AUDIENCE || 'gelir-gider-app',
  },

  password: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  session: {
    get secret() {
      return getSessionSecret();
    },
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  },

  apiKeys: {
    gemini: process.env.GEMINI_API_KEY,
    pdfParser: process.env.PDF_PARSER_API_KEY,
  },

  encryption: {
    algorithm: 'aes-256-gcm',
    get key() {
      return getEncryptionSecret();
    },
    ivLength: 16,
    tagLength: 16,
  },

  twoFactor: {
    issuer: process.env.TWO_FACTOR_ISSUER || 'Gelir-Gider',
    window: 1,
  },
};

export const Encryption = {
  encrypt(text: string): string {
    const iv = crypto.randomBytes(SecurityConfig.encryption.ivLength);
    const key = Buffer.from(
      SecurityConfig.encryption.key.substring(0, 32).padEnd(32, '0'),
    );

    const cipher = crypto.createCipheriv(
      SecurityConfig.encryption.algorithm as crypto.CipherGCMTypes,
      key,
      iv,
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  },

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(
      SecurityConfig.encryption.key.substring(0, 32).padEnd(32, '0'),
    );

    const decipher = crypto.createDecipheriv(
      SecurityConfig.encryption.algorithm as crypto.CipherGCMTypes,
      key,
      iv,
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  },

  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  },

  generatePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + special;

    let password = '';

    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];

    for (let i = password.length; i < length; i++) {
      password += all[crypto.randomInt(all.length)];
    }

    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
  },

  mask(text: string, visibleChars: number = 4): string {
    if (!text || text.length <= visibleChars) {
      return '****';
    }
    return text.substring(0, visibleChars) + '*'.repeat(text.length - visibleChars);
  },

  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return '****@****';
    }

    const maskedLocal =
      local.length > 2
        ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
        : '*'.repeat(local.length);

    return `${maskedLocal}@${domain}`;
  },
};

export function validateSecurityConfig(): void {
  const errors: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    if (!readEnv('JWT_SECRET')) {
      errors.push('JWT_SECRET is required in production');
    }

    if (!readEnv('SESSION_SECRET')) {
      errors.push('SESSION_SECRET is required in production');
    }

    if (!readEnv('ENCRYPTION_KEY') && !readEnv('BANK_ENCRYPTION_KEY')) {
      errors.push('ENCRYPTION_KEY or BANK_ENCRYPTION_KEY is required in production');
    }

    if (readEnv('JWT_SECRET') && getJwtSecret().length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Security configuration errors:\n${errors.join('\n')}`);
  }
}
