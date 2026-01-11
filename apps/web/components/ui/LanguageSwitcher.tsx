'use client';

import React from 'react';
import { useI18n } from '../../contexts/i18n-context';
import { Locale } from '../../lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'buttons';
}

export function LanguageSwitcher({ className = '', variant = 'dropdown' }: LanguageSwitcherProps) {
  const { locale, setLocale, localeNames } = useI18n();

  if (variant === 'buttons') {
    return (
      <div className={'flex gap-2 ' + className}>
        {(Object.keys(localeNames) as Locale[]).map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc)}
            className={
              'px-3 py-1 rounded text-sm font-medium transition-colors ' +
              (locale === loc
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600')
            }
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={
        'px-3 py-2 rounded-md border border-border bg-card text-gray-700 ' +
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
        'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 ' +
        className
      }
    >
      {(Object.keys(localeNames) as Locale[]).map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}

export default LanguageSwitcher;


