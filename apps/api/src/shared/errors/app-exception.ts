import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages, ErrorHttpStatus } from './error-codes';

/**
 * Custom Application Exception
 * Tüm uygulama hataları bu class üzerinden fırlatılmalı
 */
export class AppException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;

  constructor(
    code: ErrorCode,
    customMessage?: string,
    details?: Record<string, any>,
  ) {
    const message = customMessage || ErrorMessages[code];
    const status = ErrorHttpStatus[code] || HttpStatus.INTERNAL_SERVER_ERROR;

    super(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
      },
      status,
    );

    this.code = code;
    this.details = details;
  }

  static badRequest(message?: string, details?: Record<string, any>): AppException {
    return new AppException(ErrorCode.VALIDATION_FAILED, message, details);
  }

  static unauthorized(message?: string): AppException {
    return new AppException(ErrorCode.AUTH_UNAUTHORIZED, message);
  }

  static forbidden(message?: string): AppException {
    return new AppException(ErrorCode.AUTH_FORBIDDEN, message);
  }

  static notFound(resource?: string): AppException {
    return new AppException(
      ErrorCode.RESOURCE_NOT_FOUND,
      resource ? `${resource} bulunamadı` : undefined,
    );
  }

  static conflict(message?: string): AppException {
    return new AppException(ErrorCode.RESOURCE_CONFLICT, message);
  }

  static internal(message?: string): AppException {
    return new AppException(ErrorCode.INTERNAL_ERROR, message);
  }

  static fromCode(code: ErrorCode, details?: Record<string, any>): AppException {
    return new AppException(code, undefined, details);
  }
}

/**
 * Validation Exception
 */
export class ValidationException extends AppException {
  constructor(errors: Record<string, string[]>) {
    super(ErrorCode.VALIDATION_FAILED, 'Doğrulama hatası', { errors });
  }
}

/**
 * Not Found Exception
 */
export class NotFoundException extends AppException {
  constructor(resource: string, id?: string) {
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      id ? `${resource} bulunamadı: ${id}` : `${resource} bulunamadı`,
    );
  }
}

/**
 * Unauthorized Exception
 */
export class UnauthorizedException extends AppException {
  constructor(message?: string) {
    super(ErrorCode.AUTH_UNAUTHORIZED, message);
  }
}

/**
 * Forbidden Exception
 */
export class ForbiddenException extends AppException {
  constructor(message?: string) {
    super(ErrorCode.AUTH_FORBIDDEN, message);
  }
}

/**
 * Rate Limit Exception
 */
export class RateLimitException extends AppException {
  constructor() {
    super(ErrorCode.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * External Service Exception
 */
export class ExternalServiceException extends AppException {
  constructor(service: string, originalError?: Error) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} servisi ile iletişim hatası`,
      originalError ? { originalMessage: originalError.message } : undefined,
    );
  }
}

/**
 * Database Exception
 */
export class DatabaseException extends AppException {
  constructor(operation: string, originalError?: Error) {
    super(
      ErrorCode.DATABASE_ERROR,
      `Veritabanı hatası: ${operation}`,
      originalError ? { originalMessage: originalError.message } : undefined,
    );
  }
}
