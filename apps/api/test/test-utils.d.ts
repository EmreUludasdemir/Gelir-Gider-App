/**
 * Test Utilities - FAZ 3
 * Ortak test yardımcıları ve mock factory'ler
 */
import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
/**
 * Mock User Factory
 */
export declare const createMockUser: (overrides?: Partial<MockUser>) => MockUser;
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
export declare const createMockTransaction: (overrides?: Partial<MockTransaction>) => MockTransaction;
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
export declare const createMockBudget: (overrides?: Partial<MockBudget>) => MockBudget;
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
 * Create Mock Prisma Service
 */
export declare const createMockPrismaService: () => {
    user: {
        findUnique: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
        count: jest.Mock<any, any, any>;
    };
    transaction: {
        findUnique: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
        aggregate: jest.Mock<any, any, any>;
        groupBy: jest.Mock<any, any, any>;
        count: jest.Mock<any, any, any>;
    };
    budget: {
        findUnique: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
    };
    savingsGoal: {
        findUnique: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
    };
    userPreference: {
        findUnique: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        upsert: jest.Mock<any, any, any>;
    };
    subscription: {
        findUnique: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
    };
    notification: {
        findUnique: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        updateMany: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
    };
    $connect: jest.Mock<any, any, any>;
    $disconnect: jest.Mock<any, any, any>;
    $transaction: jest.Mock<any, [callback: any], any>;
    $queryRaw: jest.Mock<any, any, any>;
    $executeRaw: jest.Mock<any, any, any>;
};
/**
 * Create Mock JWT Service
 */
export declare const createMockJwtService: () => {
    sign: jest.Mock<any, any, any>;
    signAsync: jest.Mock<any, any, any>;
    verify: jest.Mock<any, any, any>;
    verifyAsync: jest.Mock<any, any, any>;
    decode: jest.Mock<any, any, any>;
};
/**
 * Create Mock Redis Service
 */
export declare const createMockRedisService: () => {
    get: jest.Mock<any, any, any>;
    set: jest.Mock<any, any, any>;
    del: jest.Mock<any, any, any>;
    exists: jest.Mock<any, any, any>;
    expire: jest.Mock<any, any, any>;
    ttl: jest.Mock<any, any, any>;
    keys: jest.Mock<any, any, any>;
    getClient: jest.Mock<any, any, any>;
};
export interface TestModuleOptions {
    providers?: any[];
    imports?: any[];
    controllers?: any[];
}
/**
 * Create a test module with common mocks
 */
export declare const createTestModule: (options?: TestModuleOptions) => Promise<TestingModule>;
/**
 * Create test application instance
 */
export declare const createTestApp: (module: TestingModule) => Promise<INestApplication>;
/**
 * Generate test JWT token
 */
export declare const generateTestToken: (payload?: {
    sub: string;
    email: string;
}) => string;
/**
 * Authenticated request helper
 */
export declare const authRequest: (app: INestApplication, token?: string) => {
    get: (url: string) => request.SuperTestStatic.Test;
    post: (url: string) => request.SuperTestStatic.Test;
    put: (url: string) => request.SuperTestStatic.Test;
    patch: (url: string) => request.SuperTestStatic.Test;
    delete: (url: string) => request.SuperTestStatic.Test;
};
/**
 * Expect response to have error structure
 */
export declare const expectErrorResponse: (response: any, statusCode: number, errorCode?: string) => void;
/**
 * Expect response to have pagination structure
 */
export declare const expectPaginatedResponse: (response: any, expectedItemsCount?: number) => void;
export declare const DateHelpers: {
    /**
     * Get start of current month
     */
    startOfMonth: () => Date;
    /**
     * Get end of current month
     */
    endOfMonth: () => Date;
    /**
     * Get date N days ago
     */
    daysAgo: (n: number) => Date;
    /**
     * Get date N days from now
     */
    daysFromNow: (n: number) => Date;
};
/**
 * Clear all mock function calls
 */
export declare const clearAllMocks: (...mocks: jest.Mock[]) => void;
/**
 * Reset all mock implementations
 */
export declare const resetAllMocks: (...mocks: jest.Mock[]) => void;
//# sourceMappingURL=test-utils.d.ts.map