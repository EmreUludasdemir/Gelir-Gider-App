'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, CurrencyCode, ThemeMode, UserPreferences, CURRENCY_SYMBOLS } from './types';
import {
  DashboardDensity,
  DashboardPreferences,
  DashboardWidgetId,
  DEFAULT_DASHBOARD_PREFERENCES,
  normalizeDashboardPreferences,
} from './dashboard-widgets';

interface PreferencesContextType {
  language: Language;
  currency: CurrencyCode;
  theme: ThemeMode;
  dashboardPreferences: DashboardPreferences;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;
  setDashboardDensity: (density: DashboardDensity) => void;
  toggleDashboardWidget: (widgetId: DashboardWidgetId) => void;
  moveDashboardWidget: (widgetId: DashboardWidgetId, direction: 'up' | 'down') => void;
  resetDashboardPreferences: () => void;
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
}

type StoredPreferences = UserPreferences & {
  dashboard: DashboardPreferences;
};

const defaultPreferences: StoredPreferences = {
  language: 'tr',
  currency: 'TRY',
  theme: 'light',
  dashboard: DEFAULT_DASHBOARD_PREFERENCES,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'user_preferences';

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StoredPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const storedPreferences =
          parsed && typeof parsed === 'object' ? parsed : {};
        setPreferences({
          ...defaultPreferences,
          ...storedPreferences,
          dashboard: normalizeDashboardPreferences(
            (storedPreferences as Partial<StoredPreferences>).dashboard,
          ),
        });
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

  const setDashboardDensity = (density: DashboardDensity) => {
    setPreferences((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        density,
      },
    }));
  };

  const toggleDashboardWidget = (widgetId: DashboardWidgetId) => {
    setPreferences((prev) => {
      const visibleWidgets = {
        ...prev.dashboard.visibleWidgets,
        [widgetId]: !prev.dashboard.visibleWidgets[widgetId],
      };

      if (!Object.values(visibleWidgets).some(Boolean)) {
        return prev;
      }

      return {
        ...prev,
        dashboard: {
          ...prev.dashboard,
          visibleWidgets,
        },
      };
    });
  };

  const moveDashboardWidget = (widgetId: DashboardWidgetId, direction: 'up' | 'down') => {
    setPreferences((prev) => {
      const widgetOrder = [...prev.dashboard.widgetOrder];
      const currentIndex = widgetOrder.indexOf(widgetId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= widgetOrder.length) {
        return prev;
      }

      [widgetOrder[currentIndex], widgetOrder[nextIndex]] = [
        widgetOrder[nextIndex],
        widgetOrder[currentIndex],
      ];

      return {
        ...prev,
        dashboard: {
          ...prev.dashboard,
          widgetOrder,
        },
      };
    });
  };

  const resetDashboardPreferences = () => {
    setPreferences((prev) => ({
      ...prev,
      dashboard: DEFAULT_DASHBOARD_PREFERENCES,
    }));
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
        dashboardPreferences: preferences.dashboard,
        setLanguage,
        setCurrency,
        setTheme,
        setDashboardDensity,
        toggleDashboardWidget,
        moveDashboardWidget,
        resetDashboardPreferences,
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

