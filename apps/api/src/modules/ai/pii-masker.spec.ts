/**
 * PII Masker Tests
 * Tests for PII detection and masking functionality
 */

import {
  maskIBAN,
  maskCard,
  maskEmail,
  maskPhone,
  maskTCKN,
  maskPII,
  maskPIIInObject,
  containsPII,
  extractAndMaskPII,
} from './pii-masker';

describe('PII Masker', () => {
  describe('maskIBAN', () => {
    it('should mask IBAN keeping only last 4 characters', () => {
      const iban = 'TR330006100519786457841326';
      const masked = maskIBAN(iban);
      expect(masked).toBe('TR********************1326');
      expect(masked).toContain('1326');
      expect(masked).not.toContain('0006100519');
    });

    it('should handle IBAN with spaces', () => {
      const iban = 'TR33 0006 1005 1978 6457 8413 26';
      const masked = maskIBAN(iban);
      expect(masked).toContain('1326');
      expect(masked).not.toContain('0006');
    });

    it('should return original for short strings', () => {
      const short = 'TR1234';
      expect(maskIBAN(short)).toBe('TR1234');
    });
  });

  describe('maskCard', () => {
    it('should mask card number keeping only last 4 digits', () => {
      const card = '1234567890123456';
      const masked = maskCard(card);
      expect(masked).toBe('****-****-****-3456');
    });

    it('should handle card with spaces', () => {
      const card = '1234 5678 9012 3456';
      const masked = maskCard(card);
      expect(masked).toBe('****-****-****-3456');
    });

    it('should handle card with dashes', () => {
      const card = '1234-5678-9012-3456';
      const masked = maskCard(card);
      expect(masked).toBe('****-****-****-3456');
    });

    it('should return original for short strings', () => {
      const short = '123456';
      expect(maskCard(short)).toBe('123456');
    });
  });

  describe('maskEmail', () => {
    it('should mask email keeping first char and domain', () => {
      const email = 'john.doe@example.com';
      const masked = maskEmail(email);
      expect(masked).toBe('j***@example.com');
    });

    it('should handle different email formats', () => {
      expect(maskEmail('a@b.co')).toBe('a***@b.co');
      expect(maskEmail('test123@domain.org')).toBe('t***@domain.org');
    });

    it('should return original for invalid email', () => {
      expect(maskEmail('notanemail')).toBe('notanemail');
    });
  });

  describe('maskPhone', () => {
    it('should mask Turkish phone number', () => {
      const phone = '+90 532 123 45 67';
      const masked = maskPhone(phone);
      expect(masked).toBe('***-***-**-67');
    });

    it('should handle different formats', () => {
      expect(maskPhone('05321234567')).toBe('***-***-**-67');
      expect(maskPhone('0532 123 45 67')).toBe('***-***-**-67');
    });

    it('should return original for short numbers', () => {
      expect(maskPhone('12345')).toBe('12345');
    });
  });

  describe('maskTCKN', () => {
    it('should mask TC Kimlik No', () => {
      const tckn = '12345678901';
      const masked = maskTCKN(tckn);
      expect(masked).toBe('123******01');
    });

    it('should return original for invalid TCKN', () => {
      expect(maskTCKN('1234567890')).toBe('1234567890'); // 10 digits
      expect(maskTCKN('123456789012')).toBe('123456789012'); // 12 digits
    });
  });

  describe('maskPII', () => {
    it('should mask IBAN in text', () => {
      const text = 'Transfer to TR330006100519786457841326';
      const masked = maskPII(text);
      expect(masked).toContain('TR**');
      expect(masked).not.toContain('0006100519');
    });

    it('should mask credit card in text', () => {
      const text = 'Card ending 1234 5678 9012 3456';
      const masked = maskPII(text);
      expect(masked).toContain('****-****-****-3456');
    });

    it('should mask email in text', () => {
      const text = 'Contact: john.doe@example.com';
      const masked = maskPII(text);
      expect(masked).toContain('j***@example.com');
    });

    it('should mask multiple PII types', () => {
      const text = 'IBAN: TR330006100519786457841326, Email: test@test.com';
      const masked = maskPII(text);
      expect(masked).not.toContain('0006100519');
      expect(masked).toContain('t***@test.com');
    });

    it('should respect mask options', () => {
      const text = 'Email: test@test.com, IBAN: TR330006100519786457841326';
      const masked = maskPII(text, { maskEmail: false, maskIBAN: true });
      expect(masked).toContain('test@test.com'); // Not masked
      expect(masked).not.toContain('0006100519'); // Masked
    });
  });

  describe('maskPIIInObject', () => {
    it('should mask PII in nested objects', () => {
      const obj = {
        user: {
          email: 'test@example.com',
          payment: {
            iban: 'TR330006100519786457841326',
          },
        },
      };
      const masked = maskPIIInObject(obj);
      expect(masked.user.email).toBe('t***@example.com');
      expect(masked.user.payment.iban).not.toContain('0006100519');
    });

    it('should mask PII in arrays', () => {
      const arr = ['test@test.com', 'normal text'];
      const masked = maskPIIInObject(arr);
      expect(masked[0]).toBe('t***@test.com');
      expect(masked[1]).toBe('normal text');
    });

    it('should preserve non-string values', () => {
      const obj = { amount: 100, date: new Date('2024-01-01'), flag: true };
      const masked = maskPIIInObject(obj);
      expect(masked.amount).toBe(100);
      expect(masked.flag).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(maskPIIInObject(null)).toBe(null);
      expect(maskPIIInObject(undefined)).toBe(undefined);
    });
  });

  describe('containsPII', () => {
    it('should detect IBAN', () => {
      expect(containsPII('Transfer to TR330006100519786457841326')).toBe(true);
    });

    it('should detect credit card', () => {
      expect(containsPII('Card: 1234 5678 9012 3456')).toBe(true);
    });

    it('should detect email', () => {
      expect(containsPII('Email: test@example.com')).toBe(true);
    });

    it('should detect phone', () => {
      expect(containsPII('Call +90 532 123 45 67')).toBe(true);
    });

    it('should return false for clean text', () => {
      expect(containsPII('This is a normal description')).toBe(false);
    });

    it('should not leak regex state across repeated calls', () => {
      const text = 'Transfer to TR330006100519786457841326';
      expect(containsPII(text)).toBe(true);
      expect(containsPII(text)).toBe(true);
    });
  });

  describe('extractAndMaskPII', () => {
    it('should extract PII and provide mapping', () => {
      const text = 'IBAN: TR330006100519786457841326, Email: test@test.com';
      const { masked, mapping } = extractAndMaskPII(text);

      expect(masked).toContain('[IBAN_1]');
      expect(masked).toContain('[EMAIL_2]');
      expect(mapping.size).toBe(2);
    });

    it('should preserve original values in mapping', () => {
      const text = 'Contact: john@example.com';
      const { mapping } = extractAndMaskPII(text);

      const values = [...mapping.values()];
      expect(values).toContain('john@example.com');
    });
  });
});
