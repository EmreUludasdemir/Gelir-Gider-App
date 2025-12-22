/**
 * Logging Middleware Unit Tests - FAZ 3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggingMiddleware } from './logging.middleware';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingMiddleware,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    middleware = module.get<LoggingMiddleware>(LoggingMiddleware);
    
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Test Agent',
      },
      get: jest.fn().mockImplementation((header: string) => {
        const headers: Record<string, string> = { 'user-agent': 'Test Agent' };
        return headers[header.toLowerCase()];
      }),
    } as any;

    mockResponse = {
      statusCode: 200,
      on: jest.fn(),
      get: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next function', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should attach finish listener to response', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should work with different HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    methods.forEach(method => {
      mockRequest.method = method;
      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      nextFunction.mockClear();
    });
  });

  it('should handle missing user-agent header', () => {
    mockRequest.headers = {};
    mockRequest.get = jest.fn().mockReturnValue(undefined);
    
    expect(() => {
      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    }).not.toThrow();

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle different status codes', () => {
    const statusCodes = [200, 201, 400, 401, 404, 500];

    statusCodes.forEach(statusCode => {
      mockResponse.statusCode = statusCode;
      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      nextFunction.mockClear();
    });
  });
});
