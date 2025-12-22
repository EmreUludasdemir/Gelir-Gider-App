import * as crypto from 'crypto';

/**
 * Security Configuration
 * Güvenlik ayarları ve secret yönetimi
 */

/**
 * Environment-based secret management
 */
export const SecurityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || generateFallbackSecret('jwt'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'gelir-gider-api',
    audience: process.env.JWT_AUDIENCE || 'gelir-gider-app',
  },

  // Password hashing
  password: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || generateFallbackSecret('session'),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  },

  // API Keys (for external services)
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY,
    pdfParser: process.env.PDF_PARSER_API_KEY,
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || generateFallbackSecret('encryption'),
    ivLength: 16,
    tagLength: 16,
  },

  // Two-Factor Authentication
  twoFactor: {
    issuer: process.env.TWO_FACTOR_ISSUER || 'Gelir-Gider',
    window: 1, // Allow 1 step before/after current
  },
};

/**
 * Generate a fallback secret (only for development)
 * In production, secrets should always be provided via environment variables
 */
function generateFallbackSecret(context: string): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing ${context.toUpperCase()}_SECRET in production environment`);
  }
  
  console.warn(`⚠️ WARNING: Using auto-generated ${context} secret. Set proper secrets in production!`);
  return crypto.createHash('sha256').update(`dev-secret-${context}-${Date.now()}`).digest('hex');
}

/**
 * Encryption utilities
 */
export const Encryption = {
  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(SecurityConfig.encryption.ivLength);
    const key = Buffer.from(SecurityConfig.encryption.key.substring(0, 32).padEnd(32, '0'));
    
    const cipher = crypto.createCipheriv(
      SecurityConfig.encryption.algorithm as crypto.CipherGCMTypes,
      key,
      iv,
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  },

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(SecurityConfig.encryption.key.substring(0, 32).padEnd(32, '0'));

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

  /**
   * Hash sensitive data (one-way)
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  },

  /**
   * Generate random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Generate secure random password
   */
  generatePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + special;

    let password = '';
    
    // Ensure at least one of each required type
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += all[crypto.randomInt(all.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
  },

  /**
   * Mask sensitive data for logging
   */
  mask(text: string, visibleChars: number = 4): string {
    if (!text || text.length <= visibleChars) {
      return '****';
    }
    return text.substring(0, visibleChars) + '*'.repeat(text.length - visibleChars);
  },

  /**
   * Mask email for logging
   */
  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '****@****';
    
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '*'.repeat(local.length);
    
    return `${maskedLocal}@${domain}`;
  },
};

/**
 * Validate required security configuration
 */
export function validateSecurityConfig(): void {
  const errors: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }

    if (!process.env.SESSION_SECRET) {
      errors.push('SESSION_SECRET is required in production');
    }

    if (!process.env.ENCRYPTION_KEY) {
      errors.push('ENCRYPTION_KEY is required in production');
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Security configuration errors:\n${errors.join('\n')}`);
  }
}
