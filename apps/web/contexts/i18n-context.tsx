'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, translate, formatCurrency, formatDate, formatRelativeTime, localeNames } from '../lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string) => string;
  localeNames: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'app-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (savedLocale && (savedLocale === 'tr' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
    setIsInitialized(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(locale, key, params);
    },
    [locale]
  );

  const formatCurrencyFn = useCallback(
    (amount: number, currency?: string) => {
      return formatCurrency(amount, locale, currency);
    },
    [locale]
  );

  const formatDateFn = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(date, locale, options);
    },
    [locale]
  );

  const formatRelativeTimeFn = useCallback(
    (date: Date | string) => {
      return formatRelativeTime(date, locale);
    },
    [locale]
  );

  // Prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatCurrency: formatCurrencyFn,
        formatDate: formatDateFn,
        formatRelativeTime: formatRelativeTimeFn,
        localeNames,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook for just translation
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

