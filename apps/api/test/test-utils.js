"use strict";
/**
 * Test Utilities - FAZ 3
 * Ortak test yardımcıları ve mock factory'ler
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetAllMocks = exports.clearAllMocks = exports.DateHelpers = exports.expectPaginatedResponse = exports.expectErrorResponse = exports.authRequest = exports.generateTestToken = exports.createTestApp = exports.createTestModule = exports.createMockRedisService = exports.createMockJwtService = exports.createMockPrismaService = exports.createMockBudget = exports.createMockTransaction = exports.createMockUser = void 0;
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../src/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const supertest_1 = __importDefault(require("supertest"));
// ============================================
// MOCK FACTORIES
// ============================================
/**
 * Mock User Factory
 */
const createMockUser = (overrides = {}) => ({
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
exports.createMockUser = createMockUser;
/**
 * Mock Transaction Factory
 */
const createMockTransaction = (overrides = {}) => ({
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
exports.createMockTransaction = createMockTransaction;
/**
 * Mock Budget Factory
 */
const createMockBudget = (overrides = {}) => ({
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
exports.createMockBudget = createMockBudget;
// ============================================
// MOCK SERVICES
// ============================================
/**
 * Create Mock Prisma Service
 */
const createMockPrismaService = () => ({
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
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    notification: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((callback) => callback(this)),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
});
exports.createMockPrismaService = createMockPrismaService;
/**
 * Create Mock JWT Service
 */
const createMockJwtService = () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-test-123', email: 'test@example.com' }),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-test-123', email: 'test@example.com' }),
    decode: jest.fn().mockReturnValue({ sub: 'user-test-123', email: 'test@example.com' }),
});
exports.createMockJwtService = createMockJwtService;
/**
 * Create Mock Redis Service
 */
const createMockRedisService = () => ({
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
exports.createMockRedisService = createMockRedisService;
/**
 * Create a test module with common mocks
 */
const createTestModule = async (options = {}) => {
    const { providers = [], imports = [], controllers = [] } = options;
    return testing_1.Test.createTestingModule({
        imports,
        controllers,
        providers: [
            { provide: prisma_service_1.PrismaService, useValue: (0, exports.createMockPrismaService)() },
            { provide: jwt_1.JwtService, useValue: (0, exports.createMockJwtService)() },
            ...providers,
        ],
    }).compile();
};
exports.createTestModule = createTestModule;
// ============================================
// E2E TEST HELPERS
// ============================================
/**
 * Create test application instance
 */
const createTestApp = async (module) => {
    const app = module.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.init();
    return app;
};
exports.createTestApp = createTestApp;
/**
 * Generate test JWT token
 */
const generateTestToken = (payload = { sub: 'user-test-123', email: 'test@example.com' }) => {
    // Simple mock token for testing
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 3600000 })).toString('base64url');
    const signature = 'test-signature';
    return `${header}.${body}.${signature}`;
};
exports.generateTestToken = generateTestToken;
/**
 * Authenticated request helper
 */
const authRequest = (app, token) => {
    const testToken = token || (0, exports.generateTestToken)();
    return {
        get: (url) => (0, supertest_1.default)(app.getHttpServer()).get(url).set('Authorization', `Bearer ${testToken}`),
        post: (url) => (0, supertest_1.default)(app.getHttpServer()).post(url).set('Authorization', `Bearer ${testToken}`),
        put: (url) => (0, supertest_1.default)(app.getHttpServer()).put(url).set('Authorization', `Bearer ${testToken}`),
        patch: (url) => (0, supertest_1.default)(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${testToken}`),
        delete: (url) => (0, supertest_1.default)(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${testToken}`),
    };
};
exports.authRequest = authRequest;
// ============================================
// ASSERTION HELPERS
// ============================================
/**
 * Expect response to have error structure
 */
const expectErrorResponse = (response, statusCode, errorCode) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('statusCode', statusCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    if (errorCode) {
        expect(response.body).toHaveProperty('errorCode', errorCode);
    }
};
exports.expectErrorResponse = expectErrorResponse;
/**
 * Expect response to have pagination structure
 */
const expectPaginatedResponse = (response, expectedItemsCount) => {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    if (expectedItemsCount !== undefined) {
        expect(response.body.data).toHaveLength(expectedItemsCount);
    }
};
exports.expectPaginatedResponse = expectPaginatedResponse;
// ============================================
// DATE HELPERS
// ============================================
exports.DateHelpers = {
    /**
     * Get start of current month
     */
    startOfMonth: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    },
    /**
     * Get end of current month
     */
    endOfMonth: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    },
    /**
     * Get date N days ago
     */
    daysAgo: (n) => {
        const date = new Date();
        date.setDate(date.getDate() - n);
        return date;
    },
    /**
     * Get date N days from now
     */
    daysFromNow: (n) => {
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
const clearAllMocks = (...mocks) => {
    mocks.forEach(mock => mock.mockClear());
};
exports.clearAllMocks = clearAllMocks;
/**
 * Reset all mock implementations
 */
const resetAllMocks = (...mocks) => {
    mocks.forEach(mock => mock.mockReset());
};
exports.resetAllMocks = resetAllMocks;
//# sourceMappingURL=test-utils.js.map