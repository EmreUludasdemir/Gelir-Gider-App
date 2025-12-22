/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Coverage Configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.interface.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],
  
  // Coverage Thresholds - Minimum %60
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  
  // Module Resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  
  // Setup Files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // Transform
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  
  // Test Timeouts
  testTimeout: 30000,
  
  // Verbose Output
  verbose: true,
  
  // Clear Mocks
  clearMocks: true,
  
  // Detect Open Handles
  detectOpenHandles: true,
  
  // Force Exit
  forceExit: true,
  
  // Max Workers
  maxWorkers: '50%',
};

module.exports = config;
