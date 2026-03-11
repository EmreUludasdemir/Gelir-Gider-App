/**
 * Security Middleware Unit Tests - FAZ 3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SecurityMiddleware, HppMiddleware } from './security.middleware';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;
  let mockRequest: any;
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
        SecurityMiddleware,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    middleware = module.get<SecurityMiddleware>(SecurityMiddleware);

    mockRequest = {
      body: {},
      query: {},
      params: {},
      url: '/api/test',
      method: 'GET',
      headers: {
        'user-agent': 'Test Agent',
      },
      ip: '127.0.0.1',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next for safe requests', () => {
    mockRequest.body = { name: 'John Doe', email: 'john@example.com' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should detect SQL UNION injection in URL', () => {
    mockRequest.url = "/api/users?id=1 UNION SELECT * FROM users";

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should detect DROP TABLE in URL', () => {
    mockRequest.url = '/api/data?q=drop%20table%20users';

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should detect XSS in URL', () => {
    mockRequest.url = '/api/search?q=<script>alert(1)</script>';

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should detect path traversal in URL', () => {
    mockRequest.url = '/api/files/../../../etc/passwd';

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle nested objects', () => {
    mockRequest.body = {
      user: {
        profile: {
          bio: "Normal text",
        },
      },
    };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should detect template injection in URL', () => {
    mockRequest.url = '/api/template?tpl=${process.env.SECRET}';

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should allow safe HTML entities', () => {
    mockRequest.body = { text: 'Price: $100 & shipping: $10' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle arrays in body', () => {
    mockRequest.body = { items: ['item1', 'item2', 'item3'] };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should detect command injection in URL', () => {
    mockRequest.url = '/api/exec?cmd=`cat /etc/passwd`';

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should block suspicious user agents', () => {
    mockRequest.headers = { 'user-agent': 'sqlmap/1.5' };
    mockRequest.url = '/api/safe';

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('HppMiddleware', () => {
  let middleware: HppMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    middleware = new HppMiddleware();

    mockRequest = {
      query: {},
    };

    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next for normal requests', () => {
    mockRequest.query = { page: '1', limit: '10' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle array query parameters by taking last value', () => {
    mockRequest.query = { page: ['1', '2', '3'] as any };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.query?.page).toBe('3');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle multiple array parameters', () => {
    mockRequest.query = {
      page: ['1', '2'] as any,
      limit: ['10', '20'] as any,
    };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.query?.page).toBe('2');
    expect(mockRequest.query?.limit).toBe('20');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should not modify non-array values', () => {
    mockRequest.query = { search: 'test', page: '1' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.query?.search).toBe('test');
    expect(mockRequest.query?.page).toBe('1');
    expect(nextFunction).toHaveBeenCalled();
  });
});
