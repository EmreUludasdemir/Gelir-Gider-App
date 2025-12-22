/**
 * Global Exception Filter Unit Tests - FAZ 3
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException, NotFoundException as NestNotFoundException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { AppException, ValidationException, UnauthorizedException } from './app-exception';
import { ErrorCode } from './error-codes';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: any;
  let mockResponse: any;
  let mockRequest: any;
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
        GlobalExceptionFilter,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch HttpException', () => {
    it('should handle BadRequestException', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid input',
          }),
        }),
      );
    });

    it('should handle NotFoundException', () => {
      const exception = new NestNotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('should include error message in response', () => {
      const exception = new BadRequestException('Custom error message');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('Custom error message'),
          }),
        }),
      );
    });
  });

  describe('catch AppException', () => {
    it('should handle AppException with error code', () => {
      const exception = new AppException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid credentials',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('should handle ValidationException', () => {
      const exception = new ValidationException({ email: ['Invalid email format'] });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle UnauthorizedException', () => {
      const exception = new UnauthorizedException();

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('catch unknown errors', () => {
    it('should handle generic Error', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('response structure', () => {
    it('should include timestamp in error object', () => {
      const exception = new BadRequestException('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        }),
      );
    });

    it('should include path in error object', () => {
      const exception = new BadRequestException('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            path: '/api/test',
          }),
        }),
      );
    });

    it('should include success false', () => {
      const exception = new BadRequestException('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });
});
