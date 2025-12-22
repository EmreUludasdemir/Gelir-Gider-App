/**
 * Standart API Error Response Formatı
 * Tüm API hatalarında kullanılır
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

/**
 * Standart API Success Response Formatı
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Error Codes
 * Format: DOMAIN_ERROR_TYPE
 */
export enum ErrorCode {
  // Auth Errors (1xxx)
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_TOKEN_INVALID = 'AUTH_003',
  AUTH_UNAUTHORIZED = 'AUTH_004',
  AUTH_FORBIDDEN = 'AUTH_005',
  AUTH_USER_NOT_FOUND = 'AUTH_006',
  AUTH_EMAIL_EXISTS = 'AUTH_007',
  AUTH_2FA_REQUIRED = 'AUTH_008',
  AUTH_2FA_INVALID = 'AUTH_009',

  // Validation Errors (2xxx)
  VALIDATION_FAILED = 'VAL_001',
  VALIDATION_MISSING_FIELD = 'VAL_002',
  VALIDATION_INVALID_FORMAT = 'VAL_003',
  VALIDATION_INVALID_TYPE = 'VAL_004',

  // Resource Errors (3xxx)
  RESOURCE_NOT_FOUND = 'RES_001',
  RESOURCE_ALREADY_EXISTS = 'RES_002',
  RESOURCE_CONFLICT = 'RES_003',
  RESOURCE_DELETED = 'RES_004',

  // Transaction Errors (4xxx)
  TRANSACTION_NOT_FOUND = 'TRX_001',
  TRANSACTION_INVALID_AMOUNT = 'TRX_002',
  TRANSACTION_INVALID_TYPE = 'TRX_003',

  // Budget Errors (5xxx)
  BUDGET_NOT_FOUND = 'BDG_001',
  BUDGET_EXCEEDED = 'BDG_002',
  BUDGET_INVALID_PERIOD = 'BDG_003',

  // File Errors (6xxx)
  FILE_UPLOAD_FAILED = 'FILE_001',
  FILE_INVALID_TYPE = 'FILE_002',
  FILE_TOO_LARGE = 'FILE_003',
  FILE_PARSE_FAILED = 'FILE_004',

  // External Service Errors (7xxx)
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  EXTERNAL_TIMEOUT = 'EXT_002',
  EXTERNAL_UNAVAILABLE = 'EXT_003',
  PDF_PARSER_ERROR = 'EXT_004',
  BANK_API_ERROR = 'EXT_005',

  // Database Errors (8xxx)
  DATABASE_ERROR = 'DB_001',
  DATABASE_CONNECTION_FAILED = 'DB_002',
  DATABASE_QUERY_FAILED = 'DB_003',

  // Rate Limit Errors (9xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_001',

  // Server Errors (10xxx)
  INTERNAL_ERROR = 'SRV_001',
  SERVICE_UNAVAILABLE = 'SRV_002',
  NOT_IMPLEMENTED = 'SRV_003',
}

/**
 * Error mesajları (Türkçe)
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Auth
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Geçersiz email veya şifre',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Oturumunuz sona erdi, lütfen tekrar giriş yapın',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Geçersiz oturum, lütfen tekrar giriş yapın',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Bu işlem için giriş yapmanız gerekiyor',
  [ErrorCode.AUTH_FORBIDDEN]: 'Bu işlem için yetkiniz bulunmuyor',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'Kullanıcı bulunamadı',
  [ErrorCode.AUTH_EMAIL_EXISTS]: 'Bu email adresi zaten kullanılıyor',
  [ErrorCode.AUTH_2FA_REQUIRED]: 'İki faktörlü doğrulama gerekli',
  [ErrorCode.AUTH_2FA_INVALID]: 'Geçersiz doğrulama kodu',

  // Validation
  [ErrorCode.VALIDATION_FAILED]: 'Doğrulama hatası',
  [ErrorCode.VALIDATION_MISSING_FIELD]: 'Zorunlu alan eksik',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Geçersiz format',
  [ErrorCode.VALIDATION_INVALID_TYPE]: 'Geçersiz veri tipi',

  // Resource
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Kaynak bulunamadı',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Bu kayıt zaten mevcut',
  [ErrorCode.RESOURCE_CONFLICT]: 'Kaynak çakışması',
  [ErrorCode.RESOURCE_DELETED]: 'Bu kayıt silinmiş',

  // Transaction
  [ErrorCode.TRANSACTION_NOT_FOUND]: 'İşlem bulunamadı',
  [ErrorCode.TRANSACTION_INVALID_AMOUNT]: 'Geçersiz tutar',
  [ErrorCode.TRANSACTION_INVALID_TYPE]: 'Geçersiz işlem tipi',

  // Budget
  [ErrorCode.BUDGET_NOT_FOUND]: 'Bütçe bulunamadı',
  [ErrorCode.BUDGET_EXCEEDED]: 'Bütçe limiti aşıldı',
  [ErrorCode.BUDGET_INVALID_PERIOD]: 'Geçersiz bütçe dönemi',

  // File
  [ErrorCode.FILE_UPLOAD_FAILED]: 'Dosya yüklenemedi',
  [ErrorCode.FILE_INVALID_TYPE]: 'Geçersiz dosya tipi',
  [ErrorCode.FILE_TOO_LARGE]: 'Dosya çok büyük',
  [ErrorCode.FILE_PARSE_FAILED]: 'Dosya işlenemedi',

  // External
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Dış servis hatası',
  [ErrorCode.EXTERNAL_TIMEOUT]: 'Bağlantı zaman aşımı',
  [ErrorCode.EXTERNAL_UNAVAILABLE]: 'Servis şu anda kullanılamıyor',
  [ErrorCode.PDF_PARSER_ERROR]: 'PDF işleme hatası',
  [ErrorCode.BANK_API_ERROR]: 'Banka bağlantı hatası',

  // Database
  [ErrorCode.DATABASE_ERROR]: 'Veritabanı hatası',
  [ErrorCode.DATABASE_CONNECTION_FAILED]: 'Veritabanına bağlanılamadı',
  [ErrorCode.DATABASE_QUERY_FAILED]: 'Sorgu çalıştırılamadı',

  // Rate Limit
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Çok fazla istek gönderdiniz, lütfen bekleyin',

  // Server
  [ErrorCode.INTERNAL_ERROR]: 'Beklenmeyen bir hata oluştu',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Servis şu anda kullanılamıyor',
  [ErrorCode.NOT_IMPLEMENTED]: 'Bu özellik henüz mevcut değil',
};

/**
 * HTTP Status Code mapping
 */
export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // Auth - 401, 403
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_TOKEN_INVALID]: 401,
  [ErrorCode.AUTH_UNAUTHORIZED]: 401,
  [ErrorCode.AUTH_FORBIDDEN]: 403,
  [ErrorCode.AUTH_USER_NOT_FOUND]: 404,
  [ErrorCode.AUTH_EMAIL_EXISTS]: 409,
  [ErrorCode.AUTH_2FA_REQUIRED]: 403,
  [ErrorCode.AUTH_2FA_INVALID]: 401,

  // Validation - 400
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.VALIDATION_MISSING_FIELD]: 400,
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 400,
  [ErrorCode.VALIDATION_INVALID_TYPE]: 400,

  // Resource - 404, 409
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_DELETED]: 410,

  // Transaction - 400, 404
  [ErrorCode.TRANSACTION_NOT_FOUND]: 404,
  [ErrorCode.TRANSACTION_INVALID_AMOUNT]: 400,
  [ErrorCode.TRANSACTION_INVALID_TYPE]: 400,

  // Budget - 400, 404
  [ErrorCode.BUDGET_NOT_FOUND]: 404,
  [ErrorCode.BUDGET_EXCEEDED]: 400,
  [ErrorCode.BUDGET_INVALID_PERIOD]: 400,

  // File - 400
  [ErrorCode.FILE_UPLOAD_FAILED]: 400,
  [ErrorCode.FILE_INVALID_TYPE]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.FILE_PARSE_FAILED]: 422,

  // External - 502, 503, 504
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.EXTERNAL_TIMEOUT]: 504,
  [ErrorCode.EXTERNAL_UNAVAILABLE]: 503,
  [ErrorCode.PDF_PARSER_ERROR]: 502,
  [ErrorCode.BANK_API_ERROR]: 502,

  // Database - 500
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.DATABASE_CONNECTION_FAILED]: 503,
  [ErrorCode.DATABASE_QUERY_FAILED]: 500,

  // Rate Limit - 429
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  // Server - 500, 501, 503
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.NOT_IMPLEMENTED]: 501,
};
