'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
import { cn } from '@/lib/utils'

const THEME_KEY = 'gg_theme_mode'

export function Header() {
  const [showSettings, setShowSettings] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const { logout, user } = useAuth()

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY)
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
      return
    }
    if (storedTheme === 'light') {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
      return
    }

    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    setShowMobileMenu(false)
  }, [pathname])

  const toggleDarkMode = () => {
    const enabled = document.documentElement.classList.toggle('dark')
    localStorage.setItem(THEME_KEY, enabled ? 'dark' : 'light')
    setIsDark(enabled)
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

  const todayLabel = useMemo(() => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US'
    return new Date().toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
    })
  }, [language])

  return (
    <>
      <header className="header-blur sticky top-0 z-50 border-b border-border/70 shadow-[0_10px_26px_rgba(15,76,92,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[4.25rem]">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
                <span className="text-lg text-white font-display">TL</span>
                <span className="absolute -inset-1 -z-10 rounded-2xl bg-primary/25 blur-md" />
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-bold text-foreground font-display leading-none">Gelir-Gider</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Finance Command Center</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all',
                      active
                        ? 'bg-primary/12 text-primary border border-primary/25 shadow-[0_8px_18px_rgba(15,76,92,0.16)]'
                        : 'text-muted-foreground border border-transparent hover:bg-muted/65 hover:text-foreground hover:border-border/70'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 mr-1">
                <span className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {todayLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Canli
                </span>
              </div>

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

              <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-border/80">
                <div className="text-right max-w-[180px] truncate">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'Kullanici'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  data-testid="logout-button"
                  aria-label={t('logout')}
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

        <div className="md:hidden border-t border-border/70">
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-thin">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all border',
                    active
                      ? 'bg-primary/12 text-primary border-primary/30'
                      : 'bg-card/60 text-muted-foreground border-border hover:text-foreground'
                  )}
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
          <div className="md:hidden border-t border-border/70 animate-slide-up bg-card/85 backdrop-blur-xl">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  <span className="font-medium text-foreground">{link.label}</span>
                </Link>
              ))}
              <hr className="my-2 border-border" />
              <button
                onClick={logout}
                data-testid="mobile-logout-button"
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
