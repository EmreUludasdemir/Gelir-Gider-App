'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl mr-2">💰</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Gelir-Gider Takip</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/transactions"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              İşlemler
            </Link>
            <Link
              href="/dashboard/budgets"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Bütçeler
            </Link>
            <Link
              href="/dashboard/upload"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              PDF Yükle
            </Link>
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Tema değiştir"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
