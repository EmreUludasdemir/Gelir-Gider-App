'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, CurrencyCode, ThemeMode, UserPreferences, CURRENCY_SYMBOLS } from './types';

interface PreferencesContextType {
  language: Language;
  currency: CurrencyCode;
  theme: ThemeMode;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
}

const defaultPreferences: UserPreferences = {
  language: 'tr',
  currency: 'TRY',
  theme: 'light',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'user_preferences';

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch {
        console.error('Failed to parse stored preferences');
      }
    }
    setMounted(true);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [preferences, mounted]);

  // Apply theme
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    let effectiveTheme = preferences.theme;

    if (effectiveTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme, mounted]);

  const setLanguage = (language: Language) => {
    setPreferences((prev) => ({ ...prev, language }));
  };

  const setCurrency = (currency: CurrencyCode) => {
    setPreferences((prev) => ({ ...prev, currency }));
  };

  const setTheme = (theme: ThemeMode) => {
    setPreferences((prev) => ({ ...prev, theme }));
  };

  const formatCurrency = (amount: number): string => {
    const symbol = CURRENCY_SYMBOLS[preferences.currency];
    const formatted = new Intl.NumberFormat(preferences.language === 'tr' ? 'tr-TR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    if (preferences.currency === 'TRY') {
      return `${formatted} ${symbol}`;
    }
    return `${symbol}${formatted}`;
  };

  const currencySymbol = CURRENCY_SYMBOLS[preferences.currency];

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <PreferencesContext.Provider
      value={{
        language: preferences.language,
        currency: preferences.currency,
        theme: preferences.theme,
        setLanguage,
        setCurrency,
        setTheme,
        formatCurrency,
        currencySymbol,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
