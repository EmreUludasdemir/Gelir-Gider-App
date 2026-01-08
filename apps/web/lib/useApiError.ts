'use client';

import { useState, useCallback } from 'react';
import { useNotifications } from './NotificationContext';
import { getApiBaseUrl } from './api-base';

/**
 * API Error Response (Backend ile uyumlu)
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
 * API Success Response
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
 * Error Code to Turkish Message mapping
 */
const errorMessages: Record<string, string> = {
  // Auth
  AUTH_001: 'Geçersiz email veya şifre',
  AUTH_002: 'Oturumunuz sona erdi, lütfen tekrar giriş yapın',
  AUTH_003: 'Geçersiz oturum, lütfen tekrar giriş yapın',
  AUTH_004: 'Bu işlem için giriş yapmanız gerekiyor',
  AUTH_005: 'Bu işlem için yetkiniz bulunmuyor',
  AUTH_006: 'Kullanıcı bulunamadı',
  AUTH_007: 'Bu email adresi zaten kullanılıyor',
  
  // Validation
  VAL_001: 'Doğrulama hatası',
  VAL_002: 'Zorunlu alan eksik',
  VAL_003: 'Geçersiz format',
  
  // Resource
  RES_001: 'Kaynak bulunamadı',
  RES_002: 'Bu kayıt zaten mevcut',
  RES_003: 'Kaynak çakışması',
  
  // Transaction
  TRX_001: 'İşlem bulunamadı',
  TRX_002: 'Geçersiz tutar',
  
  // Budget
  BDG_001: 'Bütçe bulunamadı',
  BDG_002: 'Bütçe limiti aşıldı',
  
  // File
  FILE_001: 'Dosya yüklenemedi',
  FILE_002: 'Geçersiz dosya tipi',
  FILE_003: 'Dosya çok büyük',
  FILE_004: 'Dosya işlenemedi',
  
  // External
  EXT_001: 'Dış servis hatası',
  EXT_002: 'Bağlantı zaman aşımı',
  EXT_003: 'Servis şu anda kullanılamıyor',
  EXT_004: 'PDF işleme hatası',
  
  // Rate Limit
  RATE_001: 'Çok fazla istek gönderdiniz, lütfen bekleyin',
  
  // Server
  SRV_001: 'Beklenmeyen bir hata oluştu',
  SRV_002: 'Servis şu anda kullanılamıyor',
};

/**
 * Enhanced API Error class
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly requestId?: string;
  public readonly timestamp: string;

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.error.message);
    this.name = 'ApiError';
    this.code = response.error.code;
    this.statusCode = statusCode;
    this.details = response.error.details;
    this.requestId = response.error.requestId;
    this.timestamp = response.error.timestamp;
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(): string {
    return errorMessages[this.code] || this.message || 'Bir hata oluştu';
  }

  /**
   * Check if error is authentication related
   */
  isAuthError(): boolean {
    return this.code.startsWith('AUTH_') || this.statusCode === 401;
  }

  /**
   * Check if error is validation related
   */
  isValidationError(): boolean {
    return this.code.startsWith('VAL_') || this.statusCode === 400;
  }

  /**
   * Check if error is server error
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * Check if error is rate limit
   */
  isRateLimited(): boolean {
    return this.code === 'RATE_001' || this.statusCode === 429;
  }
}

/**
 * Network Error (no response from server)
 */
export class NetworkError extends Error {
  constructor(message?: string) {
    super(message || 'Sunucuya bağlanılamıyor');
    this.name = 'NetworkError';
  }
}

/**
 * useApiError Hook
 * API hatalarını yönetmek için hook
 */
export function useApiError() {
  const [error, setError] = useState<ApiError | NetworkError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (err: unknown) => {
      let apiError: ApiError | NetworkError;

      if (err instanceof ApiError) {
        apiError = err;
      } else if (err instanceof NetworkError) {
        apiError = err;
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        apiError = new NetworkError();
      } else if (err instanceof Error) {
        apiError = new NetworkError(err.message);
      } else {
        apiError = new NetworkError('Bilinmeyen hata');
      }

      setError(apiError);

      // Show notification
      const message = apiError instanceof ApiError 
        ? apiError.getUserMessage() 
        : apiError.message;

      addNotification({
        type: 'error',
        title: 'Hata',
        message,
        duration: 5000,
      });

      // Handle auth errors
      if (apiError instanceof ApiError && apiError.isAuthError()) {
        // Redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
      }

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[API Error]', {
          error: apiError,
          code: apiError instanceof ApiError ? apiError.code : 'NETWORK_ERROR',
          details: apiError instanceof ApiError ? apiError.details : undefined,
        });
      }

      return apiError;
    },
    [addNotification]
  );

  const wrapAsync = useCallback(
    async <T>(promise: Promise<T>): Promise<T | null> => {
      setIsLoading(true);
      clearError();

      try {
        const result = await promise;
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  return {
    error,
    isLoading,
    clearError,
    handleError,
    wrapAsync,
  };
}

/**
 * Enhanced fetch wrapper
 * API response'ları parse eder ve hataları fırlatır
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const API_BASE = getApiBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Check if response has our standard error format
      if (data && data.success === false && data.error) {
        throw new ApiError(data as ApiErrorResponse, response.status);
      }

      // Fallback for non-standard errors
      throw new ApiError(
        {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data?.message || response.statusText || 'Request failed',
            timestamp: new Date().toISOString(),
            path: url,
          },
        },
        response.status
      );
    }

    // Return data directly or unwrap from success response
    if (data && data.success === true) {
      return data.data as T;
    }

    return data as T;
  } catch (err) {
    // Re-throw ApiError
    if (err instanceof ApiError) {
      throw err;
    }

    // Network errors
    if (err instanceof TypeError) {
      throw new NetworkError('Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.');
    }

    // Unknown errors
    throw new NetworkError(err instanceof Error ? err.message : 'Bilinmeyen hata');
  }
}

/**
 * Retry wrapper for failed requests
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry auth or validation errors
      if (err instanceof ApiError) {
        if (err.isAuthError() || err.isValidationError()) {
          throw err;
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}
