/**
 * Test Utilities - FAZ 3
 * Ortak test yardımcıları ve mock factory'ler
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

// ============================================
// MOCK FACTORIES
// ============================================

/**
 * Mock User Factory
 */
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-test-123',
  email: 'test@example.com',
  password: '$2b$12$hashedPasswordHere',
  name: 'Test User',
  twoFactorEnabled: false,
  twoFactorSecret: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock Transaction Factory
 */
export const createMockTransaction = (overrides: Partial<MockTransaction> = {}): MockTransaction => ({
  id: 'txn-test-123',
  userId: 'user-test-123',
  accountId: 'default',
  date: new Date('2024-01-15'),
  description: 'Test Transaction',
  amount: 100.00,
  currency: 'TRY',
  source: 'manual',
  type: 'expense',
  categoryId: 'food',
  categoryLabel: 'Yiyecek & İçecek',
  confidence: 100,
  tags: '[]',
  notes: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

export interface MockTransaction {
  id: string;
  userId: string;
  accountId: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  source: string;
  type: 'income' | 'expense';
  categoryId: string;
  categoryLabel: string;
  confidence: number;
  tags: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock Budget Factory
 */
export const createMockBudget = (overrides: Partial<MockBudget> = {}): MockBudget => ({
  id: 'budget-test-123',
  userId: 'user-test-123',
  categoryId: 'food',
  categoryLabel: 'Yiyecek & İçecek',
  amount: 1000.00,
  period: 'monthly',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export interface MockBudget {
  id: string;
  userId: string;
  categoryId: string;
  categoryLabel: string;
  amount: number;
  period: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock Credit Card Factory
 */
export const createMockCreditCard = (overrides: Partial<MockCreditCard> = {}): MockCreditCard => ({
  id: 'card-test-123',
  userId: 'user-test-123',
  name: 'Test Kredi Kartı',
  lastFourDigits: '1234',
  cardType: 'visa',
  creditLimit: 10000,
  currentBalance: 2500,
  billingDay: 15,
  dueDay: 5,
  minPayment: 250,
  interestRate: 2.5,
  color: '#1F2937',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export interface MockCreditCard {
  id: string;
  userId: string;
  name: string;
  lastFourDigits: string;
  cardType: string;
  creditLimit: number;
  currentBalance: number;
  billingDay: number;
  dueDay: number;
  minPayment: number;
  interestRate: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock Bank Connection Factory
 */
export const createMockBankConnection = (overrides: Partial<MockBankConnection> = {}): MockBankConnection => ({
  id: 'bank-conn-test-123',
  userId: 'user-test-123',
  bankCode: 'mock',
  bankName: 'Demo Banka',
  accountNumber: '1234567890',
  accountName: 'Test Hesap',
  accountType: 'checking',
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  lastSyncAt: new Date('2024-01-15'),
  lastSyncStatus: 'success',
  syncError: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export interface MockBankConnection {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  accessToken: string;
  refreshToken: string;
  lastSyncAt: Date | null;
  lastSyncStatus: string;
  syncError: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock User Preference Factory
 */
export const createMockUserPreference = (overrides: Partial<MockUserPreference> = {}): MockUserPreference => ({
  id: 'pref-test-123',
  userId: 'user-test-123',
  language: 'tr',
  currency: 'TRY',
  theme: 'light',
  emailNotifications: true,
  budgetAlerts: true,
  weeklyReport: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export interface MockUserPreference {
  id: string;
  userId: string;
  language: string;
  currency: string;
  theme: string;
  emailNotifications: boolean;
  budgetAlerts: boolean;
  weeklyReport: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// MOCK SERVICES
// ============================================

/**
 * Create Mock Prisma Service
 */
export const createMockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  transaction: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
  },
  budget: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  savingsGoal: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userPreference: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  bill: {
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  notification: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  creditCard: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  bankConnection: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  auditLog: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  pdfUpload: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((callback) => callback(this)),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
});

/**
 * Create Mock JWT Service
 */
export const createMockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-test-123', email: 'test@example.com' }),
  verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-test-123', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ sub: 'user-test-123', email: 'test@example.com' }),
});

/**
 * Create Mock Redis Service
 */
export const createMockRedisService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }),
});

/**
 * Create Mock Cache Service
 */
export const createMockCacheService = () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  buildKey: jest.fn((prefix: string, userId: string, ...parts: string[]) =>
    [prefix, userId, ...parts].filter(Boolean).join(':'),
  ),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  getOrSet: jest.fn(),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(0),
  invalidateUser: jest.fn().mockResolvedValue(undefined),
  invalidateTransactions: jest.fn().mockResolvedValue(undefined),
  invalidateBudgets: jest.fn().mockResolvedValue(undefined),
  getStats: jest.fn().mockReturnValue({
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalOperations: 0,
    avgResponseTime: 0,
    isConnected: true,
  }),
  flushAll: jest.fn().mockResolvedValue(undefined),
});

/**
 * Create Mock Email Service
 */
export const createMockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendWeeklyReport: jest.fn().mockResolvedValue(true),
  sendBudgetAlert: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
});

// ============================================
// TEST MODULE BUILDER
// ============================================

export interface TestModuleOptions {
  providers?: any[];
  imports?: any[];
  controllers?: any[];
}

/**
 * Create a test module with common mocks
 */
export const createTestModule = async (options: TestModuleOptions = {}): Promise<TestingModule> => {
  const { providers = [], imports = [], controllers = [] } = options;

  return Test.createTestingModule({
    imports,
    controllers,
    providers: [
      { provide: PrismaService, useValue: createMockPrismaService() },
      { provide: JwtService, useValue: createMockJwtService() },
      ...providers,
    ],
  }).compile();
};

// ============================================
// E2E TEST HELPERS
// ============================================

/**
 * Create test application instance
 */
export const createTestApp = async (module: TestingModule): Promise<INestApplication> => {
  const app = module.createNestApplication();
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
};

/**
 * Generate test JWT token
 */
export const generateTestToken = (payload: { sub: string; email: string } = { sub: 'user-test-123', email: 'test@example.com' }): string => {
  // Simple mock token for testing
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 3600000 })).toString('base64url');
  const signature = 'test-signature';
  return `${header}.${body}.${signature}`;
};

/**
 * Authenticated request helper
 */
export const authRequest = (app: INestApplication, token?: string) => {
  const testToken = token || generateTestToken();
  return {
    get: (url: string) => request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${testToken}`),
    post: (url: string) => request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${testToken}`),
    put: (url: string) => request(app.getHttpServer()).put(url).set('Authorization', `Bearer ${testToken}`),
    patch: (url: string) => request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${testToken}`),
    delete: (url: string) => request(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${testToken}`),
  };
};

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Expect response to have error structure
 */
export const expectErrorResponse = (response: any, statusCode: number, errorCode?: string) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('statusCode', statusCode);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('timestamp');
  if (errorCode) {
    expect(response.body).toHaveProperty('errorCode', errorCode);
  }
};

/**
 * Expect response to have pagination structure
 */
export const expectPaginatedResponse = (response: any, expectedItemsCount?: number) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('data');
  expect(Array.isArray(response.body.data)).toBe(true);
  if (expectedItemsCount !== undefined) {
    expect(response.body.data).toHaveLength(expectedItemsCount);
  }
};

// ============================================
// DATE HELPERS
// ============================================

export const DateHelpers = {
  /**
   * Get start of current month
   */
  startOfMonth: (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  },

  /**
   * Get end of current month
   */
  endOfMonth: (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  },

  /**
   * Get date N days ago
   */
  daysAgo: (n: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date;
  },

  /**
   * Get date N days from now
   */
  daysFromNow: (n: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + n);
    return date;
  },
};

// ============================================
// CLEANUP HELPERS
// ============================================

/**
 * Clear all mock function calls
 */
export const clearAllMocks = (...mocks: jest.Mock[]) => {
  mocks.forEach(mock => mock.mockClear());
};

/**
 * Reset all mock implementations
 */
export const resetAllMocks = (...mocks: jest.Mock[]) => {
  mocks.forEach(mock => mock.mockReset());
};
