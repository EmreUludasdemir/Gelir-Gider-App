import trLocale from '../locales/tr.json';
import enLocale from '../locales/en.json';

export type Locale = 'tr' | 'en';

export const locales: Record<Locale, typeof trLocale> = {
  tr: trLocale,
  en: enLocale,
};

export const localeNames: Record<Locale, string> = {
  tr: 'Turkce',
  en: 'English',
};

export const defaultLocale: Locale = 'tr';

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  
  return typeof result === 'string' ? result : path;
}

/**
 * Translate a key with optional interpolation
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = locales[locale] || locales[defaultLocale];
  let text = getNestedValue(messages as unknown as Record<string, unknown>, key);
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp('\\{' + paramKey + '\\}', 'g'), String(value));
    });
  }
  
  return text;
}

/**
 * Format currency based on locale
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: string = 'TRY'
): string {
  const localeCode = locale === 'tr' ? 'tr-TR' : 'en-US';
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date based on locale
 */
export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const localeCode = locale === 'tr' ? 'tr-TR' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(localeCode, defaultOptions).format(dateObj);
}

/**
 * Format relative time
 */
export function formatRelativeTime(
  date: Date | string,
  locale: Locale
): string {
  const localeCode = locale === 'tr' ? 'tr-TR' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return rtf.format(-diffMinutes, 'minute');
    }
    return rtf.format(-diffHours, 'hour');
  } else if (diffDays < 30) {
    return rtf.format(-diffDays, 'day');
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return rtf.format(-diffMonths, 'month');
  } else {
    const diffYears = Math.floor(diffDays / 365);
    return rtf.format(-diffYears, 'year');
  }
}
