'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  LayoutDashboard,
  ListChecks,
  FileUp,
  Target,
  Wallet,
  Copy,
} from 'lucide-react'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { useAuth } from '@/components/auth-provider'

export function Header() {
  const [showSettings, setShowSettings] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const { logout, user } = useAuth()

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/transactions', label: t('transactions'), icon: ListChecks },
    { href: '/dashboard/duplicates', label: t('duplicates'), icon: Copy },
    { href: '/dashboard/upload', label: 'PDF', icon: FileUp },
    { href: '/dashboard/goals', label: t('savings_goals'), icon: Target },
    { href: '/dashboard/budgets', label: t('budget') || 'Butce', icon: Wallet },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      <header className="header-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                <span className="text-lg text-white font-display">TL</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-foreground font-display">Gelir-Gider</span>
                <span className="text-lg font-light text-muted-foreground ml-1">Takip</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-item text-sm ${active ? 'active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              </button>

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

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                title={t('settings')}
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'Kullanici'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
                aria-label="Menu"
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

        <div className="md:hidden border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-thin">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`tab-link whitespace-nowrap ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

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
                  <link.icon className="w-4 h-4" />
                  <span className="font-medium text-foreground">{link.label}</span>
                </Link>
              ))}
              <hr className="my-2 border-border" />
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t('logout')}</span>
              </button>
            </nav>
          </div>
        )}
      </header>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}

