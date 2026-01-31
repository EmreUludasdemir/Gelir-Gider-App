'use client';

import { useState } from 'react';
import { X, Settings, Globe, DollarSign, Moon, Sun, Monitor } from 'lucide-react';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { Language, CurrencyCode, ThemeMode } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    language,
    currency,
    theme,
    setLanguage,
    setCurrency,
    setTheme,
  } = usePreferences();
  const { t } = useTranslation(language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              {t('settings')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <Globe className="w-4 h-4" />
              <label className="font-medium">{t('language')}</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLanguage('tr')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  language === 'tr'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-border dark:border-gray-600 text-foreground hover:bg-muted/40 dark:hover:bg-gray-700'
                }`}
              >
                🇹🇷 Türkçe
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  language === 'en'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-border dark:border-gray-600 text-foreground hover:bg-muted/40 dark:hover:bg-gray-700'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <DollarSign className="w-4 h-4" />
              <label className="font-medium">{t('currency')}</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['TRY', 'USD', 'EUR'] as CurrencyCode[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    currency === curr
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-border dark:border-gray-600 text-foreground hover:bg-muted/40 dark:hover:bg-gray-700'
                  }`}
                >
                  {curr === 'TRY' ? '₺ TRY' : curr === 'USD' ? '$ USD' : '€ EUR'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <Sun className="w-4 h-4" />
              <label className="font-medium">{t('theme')}</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'light'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-border dark:border-gray-600 text-foreground hover:bg-muted/40 dark:hover:bg-gray-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                {t('light')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-border dark:border-gray-600 text-foreground hover:bg-muted/40 dark:hover:bg-gray-700'
                }`}
              >
                <Moon className="w-4 h-4" />
                {t('dark')}
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'system'
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-border dark:border-gray-600 text-foreground hover:bg-muted/40 dark:hover:bg-gray-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                {t('system')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/40 dark:bg-gray-900 border-t border-border dark:border-gray-700">
          <p className="text-xs text-muted-foreground text-center">
            {language === 'tr'
              ? 'Tercihleriniz otomatik olarak kaydedilir.'
              : 'Your preferences are saved automatically.'}
          </p>
        </div>
      </div>
    </div>
  );
}


