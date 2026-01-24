'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Settings, LogOut } from 'lucide-react'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

export function Header() {
  const [showSettings, setShowSettings] = useState(false)
  const { language } = usePreferences()
  const { t } = useTranslation(language)

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl mr-2">💰</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Gelir-Gider Takip</span>
            </Link>
            <nav className="flex items-center space-x-2">
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t('dashboard')}
              </Link>
              <Link
                href="/dashboard/transactions"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t('transactions')}
              </Link>
              <Link
                href="/dashboard/upload"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                PDF
              </Link>
              <Link
                href="/dashboard/statements"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {language === 'tr' ? 'Ekstreler' : 'Statements'}
              </Link>
              <Link
                href="/dashboard/goals"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t('savings_goals')}
              </Link>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('settings')}
              >
                <Settings className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}

