import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ErrorCode, ErrorMessages } from './error-codes';
import { AppException } from './app-exception';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ThrottlerException } from '@nestjs/throttler';

/**
 * Global Exception Filter
 * Tüm hataları yakalar ve standart formatta döner
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Request ID for tracking
    const requestId = request.headers['x-request-id'] as string || this.generateRequestId();

    // Default error values
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let message = ErrorMessages[ErrorCode.INTERNAL_ERROR];
    let details: Record<string, unknown> | undefined;

    // Handle different exception types
    if (exception instanceof AppException) {
      // Our custom exceptions
      status = exception.getStatus();
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof ThrottlerException) {
      // Rate limit exceptions
      status = HttpStatus.TOO_MANY_REQUESTS;
      errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
      message = ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED];
    } else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || exception.message;
        
        // Handle validation errors from class-validator
        if (Array.isArray(responseObj.message)) {
          errorCode = ErrorCode.VALIDATION_FAILED;
          details = { errors: responseObj.message };
          message = 'Doğrulama hatası';
        }
      } else {
        message = exceptionResponse as string;
      }

      // Map HTTP status to error code
      errorCode = this.httpStatusToErrorCode(status, errorCode);
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Prisma database errors
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      errorCode = prismaError.code;
      message = prismaError.message;
      details = prismaError.details;
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = ErrorCode.VALIDATION_FAILED;
      message = 'Veritabanı doğrulama hatası';
    } else if (exception instanceof Error) {
      // Generic errors
      message = this.isProduction() ? ErrorMessages[ErrorCode.INTERNAL_ERROR] : exception.message;
    }

    // Log the error
    this.logError(exception, request, requestId, status, errorCode, details);

    // Send response
    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      },
    };

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): {
    status: number;
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
  } {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const fields = (error.meta?.target as string[]) || [];
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.RESOURCE_ALREADY_EXISTS,
          message: `Bu kayıt zaten mevcut`,
          details: { fields },
        };

      case 'P2025':
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Kayıt bulunamadı',
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.VALIDATION_FAILED,
          message: 'İlişkili kayıt bulunamadı',
        };

      case 'P2014':
        // Required relation violation
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Zorunlu ilişki eksik',
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCode.DATABASE_ERROR,
          message: 'Veritabanı hatası',
          details: this.isProduction() ? undefined : { prismaCode: error.code },
        };
    }
  }

  private httpStatusToErrorCode(status: number, defaultCode: ErrorCode): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_FAILED;
      case 401:
        return ErrorCode.AUTH_UNAUTHORIZED;
      case 403:
        return ErrorCode.AUTH_FORBIDDEN;
      case 404:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case 409:
        return ErrorCode.RESOURCE_CONFLICT;
      case 429:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      default:
        return defaultCode;
    }
  }

  private logError(
    exception: unknown,
    request: Request,
    requestId: string,
    status: number,
    errorCode: ErrorCode,
    details?: Record<string, unknown>,
  ): void {
    const errorInfo = {
      requestId,
      module: 'api',
      errorCode,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userId: (request as any).user?.userId,
      userAgent: request.headers['user-agent'],
      status,
      ...(details ? { details } : {}),
    };

    const message = exception instanceof Error ? exception.message : String(exception);
    const trace = exception instanceof Error ? exception.stack : undefined;

    if (status >= 500) {
      const logger = this.logger as LoggerService & {
        error?: (message: string, meta?: Record<string, unknown>) => void;
      };

      if (typeof logger.error === 'function') {
        logger.error(message, {
          context: 'ExceptionFilter',
          ...errorInfo,
          ...(trace ? { trace } : {}),
        });
      }
    } else if (status >= 400) {
      this.logger.warn(message, {
        context: 'ExceptionFilter',
        ...errorInfo,
      });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
