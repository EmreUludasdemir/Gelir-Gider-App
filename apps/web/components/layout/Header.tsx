'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Settings, LogOut, Menu, X, Bell, Moon, Sun } from 'lucide-react'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { useAuth } from '@/components/auth-provider'

export function Header() {
  const [showSettings, setShowSettings] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const { logout, user } = useAuth()

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: '📊' },
    { href: '/dashboard/transactions', label: t('transactions'), icon: '💳' },
    { href: '/dashboard/upload', label: 'PDF', icon: '📄' },
    { href: '/dashboard/goals', label: t('savings_goals'), icon: '🎯' },
    { href: '/dashboard/budgets', label: t('budget') || 'Bütçe', icon: '💰' },
  ]

  return (
    <>
      <header className="header-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                <span className="text-lg text-white">₺</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-foreground">Gelir-Gider</span>
                <span className="text-lg font-light text-muted-foreground ml-1">Takip</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-item text-sm"
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                title={t('settings')}
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* User Menu */}
              <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'Kullanıcı'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Çıkış"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5 text-foreground" />
                ) : (
                  <Menu className="w-5 h-5 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border animate-slide-up">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-medium text-foreground">{link.label}</span>
                </Link>
              ))}
              <hr className="my-2 border-border" />
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Çıkış Yap</span>
              </button>
            </nav>
          </div>
        )}
      </header>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
