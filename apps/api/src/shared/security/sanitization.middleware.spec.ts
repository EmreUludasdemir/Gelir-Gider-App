/**
 * Sanitization Middleware Unit Tests - FAZ 3
 */

import { SanitizationMiddleware, Validate } from './sanitization.middleware';
import { Request, Response } from 'express';

describe('SanitizationMiddleware', () => {
  let middleware: SanitizationMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    middleware = new SanitizationMiddleware();

    mockRequest = {
      body: {},
    };

    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next for normal requests', () => {
    mockRequest.body = { name: 'John Doe' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should sanitize HTML tags from body', () => {
    mockRequest.body = { name: '<b>John</b> Doe' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.name).toBe('John Doe');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should remove script tags', () => {
    mockRequest.body = { content: "Hello <script>alert('xss')</script> World" };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.content).not.toContain('<script>');
    expect(mockRequest.body.content).not.toContain('</script>');
  });

  it('should handle nested objects', () => {
    mockRequest.body = {
      user: {
        name: '<b>John</b>',
        profile: {
          bio: '<script>evil()</script>Hello',
        },
      },
    };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.user.name).toBe('John');
    expect(mockRequest.body.user.profile.bio).toBe('Hello');
  });

  it('should sanitize arrays', () => {
    mockRequest.body = {
      items: ['<b>Bold</b>', '<i>Italic</i>', 'Normal'],
    };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.items[0]).toBe('Bold');
    expect(mockRequest.body.items[1]).toBe('Italic');
    expect(mockRequest.body.items[2]).toBe('Normal');
  });

  it('should preserve numbers', () => {
    mockRequest.body = { amount: 100.50, count: 5 };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.amount).toBe(100.50);
    expect(mockRequest.body.count).toBe(5);
  });

  it('should preserve booleans', () => {
    mockRequest.body = { active: true, deleted: false };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.active).toBe(true);
    expect(mockRequest.body.deleted).toBe(false);
  });

  it('should handle null values', () => {
    mockRequest.body = { notes: null };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.notes).toBeNull();
  });

  it('should handle empty body', () => {
    mockRequest.body = {};

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle undefined body', () => {
    mockRequest.body = undefined;

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should remove event handlers', () => {
    mockRequest.body = { content: '<div onclick="evil()">Click me</div>' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.content).not.toContain('onclick');
  });

  it('should trim whitespace', () => {
    mockRequest.body = { name: '  John Doe  ' };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.body.name).toBe('John Doe');
  });
});

describe('Validate', () => {
  describe('email', () => {
    it('should validate correct email', () => {
      expect(Validate.email('test@example.com')).toBe(true);
      expect(Validate.email('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(Validate.email('not-an-email')).toBe(false);
      expect(Validate.email('missing@domain')).toBe(false);
      expect(Validate.email('@nodomain.com')).toBe(false);
    });
  });

  describe('password', () => {
    it('should validate strong password', () => {
      expect(Validate.password('SecurePass123!').valid).toBe(true);
      expect(Validate.password('MyP@ssw0rd').valid).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(Validate.password('short').valid).toBe(false);
      expect(Validate.password('nouppercase123!').valid).toBe(false);
      expect(Validate.password('NOLOWERCASE123!').valid).toBe(false);
      expect(Validate.password('NoNumbers!').valid).toBe(false);
      expect(Validate.password('NoSpecial123').valid).toBe(false);
    });

    it('should require minimum 8 characters', () => {
      expect(Validate.password('Short1!').valid).toBe(false);
      expect(Validate.password('LongEnough1!').valid).toBe(true);
    });

    it('should return error messages for invalid password', () => {
      const result = Validate.password('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('uuid', () => {
    it('should validate correct UUID', () => {
      expect(Validate.uuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(Validate.uuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(Validate.uuid('not-a-uuid')).toBe(false);
      expect(Validate.uuid('12345')).toBe(false);
      expect(Validate.uuid('')).toBe(false);
    });
  });

  describe('date', () => {
    it('should validate ISO date strings', () => {
      expect(Validate.date('2024-01-15')).toBe(true);
      expect(Validate.date('2024-12-31T23:59:59Z')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(Validate.date('not-a-date')).toBe(false);
      expect(Validate.date('')).toBe(false);
    });
  });

  describe('money', () => {
    it('should validate money amounts within range', () => {
      expect(Validate.money(100)).toBe(true);
      expect(Validate.money(0)).toBe(true);
      expect(Validate.money(999999999)).toBe(true);
    });

    it('should reject invalid money amounts', () => {
      expect(Validate.money(-1)).toBe(false);
      expect(Validate.money(NaN)).toBe(false);
    });

    it('should validate with custom min/max', () => {
      expect(Validate.money(50, 0, 100)).toBe(true);
      expect(Validate.money(150, 0, 100)).toBe(false);
    });
  });

  describe('turkishPhone', () => {
    it('should validate Turkish phone numbers', () => {
      expect(Validate.turkishPhone('5551234567')).toBe(true);
      expect(Validate.turkishPhone('905551234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(Validate.turkishPhone('1234567890')).toBe(false);
      expect(Validate.turkishPhone('')).toBe(false);
    });
  });

  describe('turkishIban', () => {
    it('should validate Turkish IBAN', () => {
      expect(Validate.turkishIban('TR330006100519786457841326')).toBe(true);
    });

    it('should reject invalid IBAN', () => {
      expect(Validate.turkishIban('DE89370400440532013000')).toBe(false);
      expect(Validate.turkishIban('')).toBe(false);
    });
  });
});
