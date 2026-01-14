import { z } from 'zod';
import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

/**
 * Environment variable schema with Zod validation
 * This ensures all required environment variables are present and valid at startup
 */
export const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),

  // Database (required)
  DATABASE_URL: z.string().refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
    { message: 'DATABASE_URL must be a valid PostgreSQL connection string' }
  ),

  // JWT (required)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRATION: z.string().default('7d'),
  JWT_REFRESH_EXPIRATION: z.string().default('30d'),

  // Redis (optional but recommended)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_TTL: z.coerce.number().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().positive().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: z.string().default('application/pdf'),

  // External Services (optional)
  GEMINI_API_KEY: z.string().optional(),
  PDF_PARSER_URL: z.string().url().default('http://localhost:8001'),

  // Stripe (optional for billing)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Encryption
  BANK_ENCRYPTION_KEY: z.string().min(32).optional(),

  // Push Notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Frontend URL (for CORS and redirects)
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed config
 * Throws detailed error if validation fails
 */
export function validateEnv(): EnvConfig {
  logger.log('Validating environment variables...');

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
    });

    logger.error('Environment validation failed:');
    errors.forEach((err) => logger.error(err));

    throw new Error(
      `\n\n❌ Environment validation failed!\n\n` +
      `The following environment variables are missing or invalid:\n${errors.join('\n')}\n\n` +
      `Please check your .env file or environment configuration.\n` +
      `See .env.example for required variables.\n`
    );
  }

  logger.log('✅ Environment variables validated successfully');

  // Log warnings for optional but recommended variables
  const warnings: string[] = [];

  if (!result.data.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY not set - AI features will be disabled');
  }
  if (!result.data.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY not set - Billing features will be disabled');
  }
  if (!result.data.BANK_ENCRYPTION_KEY) {
    warnings.push('BANK_ENCRYPTION_KEY not set - Bank connection encryption disabled');
  }

  warnings.forEach((warning) => logger.warn(`⚠️ ${warning}`));

  return result.data;
}

/**
 * Get validated environment config (cached)
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
  }
  return cachedConfig;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvConfig().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvConfig().NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvConfig().NODE_ENV === 'test';
}
