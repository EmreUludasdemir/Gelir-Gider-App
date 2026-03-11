/**
 * PII (Personally Identifiable Information) Masker
 * Masks sensitive data before sending to AI services
 */

// IBAN pattern: TR + 2 digits + 22 alphanumeric characters
const IBAN_PATTERN = /TR\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{2}/gi;

// Credit card pattern: 16 digits with optional spaces/dashes
const CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

// Email pattern
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Phone pattern (Turkish format)
const PHONE_PATTERN = /\b(?:\+90|0)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g;

// TC Kimlik No pattern (11 digits starting with 1-9)
const TCKN_PATTERN = /\b[1-9]\d{10}\b/g;

export interface MaskOptions {
  maskIBAN?: boolean;
  maskCard?: boolean;
  maskEmail?: boolean;
  maskPhone?: boolean;
  maskTCKN?: boolean;
}

const defaultOptions: MaskOptions = {
  maskIBAN: true,
  maskCard: true,
  maskEmail: true,
  maskPhone: true,
  maskTCKN: true,
};

function testPattern(pattern: RegExp, text: string): boolean {
  const flags = pattern.flags.replace(/g/g, '')
  return new RegExp(pattern.source, flags).test(text)
}

/**
 * Mask IBAN - shows only last 4 characters
 * TR330006100519786457841326 → TR**************1326
 */
export function maskIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length < 10) return iban;
  return `TR${'*'.repeat(cleaned.length - 6)}${cleaned.slice(-4)}`;
}

/**
 * Mask credit card - shows only last 4 digits
 * 1234 5678 9012 3456 → ****-****-****-3456
 */
export function maskCard(card: string): string {
  const cleaned = card.replace(/[\s-]/g, '');
  if (cleaned.length < 12) return card;
  return `****-****-****-${cleaned.slice(-4)}`;
}

/**
 * Mask email - shows only first char and domain
 * john.doe@example.com → j***@example.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length === 0) return email;
  return `${local[0]}***@${domain}`;
}

/**
 * Mask phone - shows only last 4 digits
 * +90 532 123 45 67 → ***-***-**-67
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone;
  return `***-***-**-${digits.slice(-2)}`;
}

/**
 * Mask TC Kimlik No - shows only first 3 and last 2 digits
 * 12345678901 → 123*****01
 */
export function maskTCKN(tckn: string): string {
  if (tckn.length !== 11) return tckn;
  return `${tckn.slice(0, 3)}${'*'.repeat(6)}${tckn.slice(-2)}`;
}

/**
 * Mask all PII in a text string
 */
export function maskPII(text: string, options: MaskOptions = defaultOptions): string {
  let masked = text;

  if (options.maskIBAN) {
    masked = masked.replace(IBAN_PATTERN, (match) => maskIBAN(match));
  }

  if (options.maskCard) {
    masked = masked.replace(CARD_PATTERN, (match) => maskCard(match));
  }

  if (options.maskEmail) {
    masked = masked.replace(EMAIL_PATTERN, (match) => maskEmail(match));
  }

  if (options.maskPhone) {
    masked = masked.replace(PHONE_PATTERN, (match) => maskPhone(match));
  }

  if (options.maskTCKN) {
    masked = masked.replace(TCKN_PATTERN, (match) => maskTCKN(match));
  }

  return masked;
}

/**
 * Mask PII in an object (deep)
 */
export function maskPIIInObject<T>(obj: T, options: MaskOptions = defaultOptions): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return maskPII(obj, options) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskPIIInObject(item, options)) as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = maskPIIInObject(value, options);
    }
    return result as T;
  }

  return obj;
}

/**
 * Check if text contains potential PII
 */
export function containsPII(text: string): boolean {
  return (
    testPattern(IBAN_PATTERN, text) ||
    testPattern(CARD_PATTERN, text) ||
    testPattern(EMAIL_PATTERN, text) ||
    testPattern(PHONE_PATTERN, text) ||
    testPattern(TCKN_PATTERN, text)
  );
}

/**
 * Extract and mask all PII, returning masked text and a map of originals
 * Useful for re-inserting after AI processing
 */
export function extractAndMaskPII(text: string): { masked: string; mapping: Map<string, string> } {
  const mapping = new Map<string, string>();
  let counter = 0;

  const generatePlaceholder = (type: string) => {
    counter++;
    return `[${type}_${counter}]`;
  };

  let masked = text;

  // Extract IBANs
  masked = masked.replace(IBAN_PATTERN, (match) => {
    const placeholder = generatePlaceholder('IBAN');
    mapping.set(placeholder, match);
    return placeholder;
  });

  // Extract cards
  masked = masked.replace(CARD_PATTERN, (match) => {
    const placeholder = generatePlaceholder('CARD');
    mapping.set(placeholder, match);
    return placeholder;
  });

  // Extract emails
  masked = masked.replace(EMAIL_PATTERN, (match) => {
    const placeholder = generatePlaceholder('EMAIL');
    mapping.set(placeholder, match);
    return placeholder;
  });

  return { masked, mapping };
}
