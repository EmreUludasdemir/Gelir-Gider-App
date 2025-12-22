import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

/**
 * Input Sanitization Middleware
 * XSS ve injection saldırılarını önler
 */
@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query as Record<string, any>);
    }

    // Sanitize body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize params
    if (req.params) {
      req.params = this.sanitizeObject(req.params) as typeof req.params;
    }

    next();
  }

  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : 
          typeof item === 'object' ? this.sanitizeObject(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeString(str: string): string {
    // Remove HTML tags
    let sanitized = sanitizeHtml(str, {
      allowedTags: [],
      allowedAttributes: {},
    });

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Escape special characters for SQL (additional layer)
    sanitized = validator.escape(sanitized);

    // Unescape safe characters for readability
    sanitized = sanitized
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    return sanitized;
  }
}

/**
 * Sanitization utility functions
 */
export const Sanitize = {
  /**
   * Sanitize string for general use
   */
  string(value: string): string {
    if (!value || typeof value !== 'string') return '';
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
  },

  /**
   * Sanitize email
   */
  email(value: string): string {
    if (!value || typeof value !== 'string') return '';
    const sanitized = value.toLowerCase().trim();
    return validator.isEmail(sanitized) ? validator.normalizeEmail(sanitized) || sanitized : '';
  },

  /**
   * Sanitize number
   */
  number(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  /**
   * Sanitize boolean
   */
  boolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  },

  /**
   * Sanitize UUID
   */
  uuid(value: string): string | null {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return validator.isUUID(trimmed) ? trimmed : null;
  },

  /**
   * Sanitize date string
   */
  date(value: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },

  /**
   * Sanitize URL
   */
  url(value: string): string | null {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return validator.isURL(trimmed, { require_protocol: true }) ? trimmed : null;
  },

  /**
   * Sanitize filename
   */
  filename(value: string): string {
    if (!value || typeof value !== 'string') return '';
    // Remove path traversal and special characters
    return value
      .replace(/\.\./g, '')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .trim();
  },

  /**
   * Sanitize phone number
   */
  phone(value: string): string {
    if (!value || typeof value !== 'string') return '';
    // Keep only digits, +, and spaces
    return value.replace(/[^\d+\s-]/g, '').trim();
  },

  /**
   * Sanitize money amount
   */
  money(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d.-]/g, ''))
      : Number(value);
    return isNaN(num) || num < 0 ? null : Math.round(num * 100) / 100;
  },
};

/**
 * Validation utility functions
 */
export const Validate = {
  /**
   * Validate email format
   */
  email(value: string): boolean {
    return typeof value === 'string' && validator.isEmail(value);
  },

  /**
   * Validate password strength
   */
  password(value: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!value || typeof value !== 'string') {
      return { valid: false, errors: ['Şifre gerekli'] };
    }

    if (value.length < 8) {
      errors.push('Şifre en az 8 karakter olmalı');
    }

    if (value.length > 128) {
      errors.push('Şifre en fazla 128 karakter olabilir');
    }

    if (!/[a-z]/.test(value)) {
      errors.push('Şifre en az bir küçük harf içermeli');
    }

    if (!/[A-Z]/.test(value)) {
      errors.push('Şifre en az bir büyük harf içermeli');
    }

    if (!/\d/.test(value)) {
      errors.push('Şifre en az bir rakam içermeli');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.push('Şifre en az bir özel karakter içermeli');
    }

    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(p => value.toLowerCase().includes(p))) {
      errors.push('Şifre çok yaygın, daha güçlü bir şifre seçin');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Validate UUID
   */
  uuid(value: string): boolean {
    return typeof value === 'string' && validator.isUUID(value);
  },

  /**
   * Validate date string
   */
  date(value: string): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  /**
   * Validate money amount
   */
  money(value: number, min = 0, max = 999999999): boolean {
    return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
  },

  /**
   * Validate Turkish phone number
   */
  turkishPhone(value: string): boolean {
    if (!value) return false;
    const cleaned = value.replace(/\D/g, '');
    return /^(90)?5\d{9}$/.test(cleaned);
  },

  /**
   * Validate Turkish IBAN
   */
  turkishIban(value: string): boolean {
    if (!value) return false;
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return /^TR\d{24}$/.test(cleaned);
  },
};
