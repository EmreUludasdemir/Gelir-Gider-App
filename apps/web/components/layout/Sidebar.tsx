'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  LayoutDashboard,
  ListChecks,
  Repeat2,
  FileUp,
  Target,
  Wallet,
  Copy,
  Users,
  Settings,
  LogOut,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { useAuth } from '@/components/auth-provider'
import { cn } from '@/lib/utils'
import { SettingsModal } from '@/components/ui/SettingsModal'

export function Sidebar() {
  const [showSettings, setShowSettings] = useState(false)
  const pathname = usePathname()
  const { language, theme, setTheme } = usePreferences()
  const { t } = useTranslation(language)
  const { logout, user } = useAuth()

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/transactions', label: t('transactions'), icon: ListChecks },
    { href: '/dashboard/duplicates', label: t('duplicates'), icon: Copy },
    { href: '/dashboard/upload', label: 'PDF Import', icon: FileUp },
    { href: '/dashboard/subscriptions', label: 'Abonelikler', icon: Repeat2 },
    { href: '/dashboard/households', label: 'Households', icon: Users },
    { href: '/dashboard/goals', label: t('savings_goals'), icon: Target },
    { href: '/dashboard/budgets', label: t('budget') || 'Bütçe', icon: Wallet },
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
      weekday: 'short',
    })
  }, [language])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-border/70 bg-card/85 backdrop-blur-xl z-30 transition-all duration-300">
        {/* Brand Logo */}
        <div className="p-6 border-b border-border/70">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
              <span className="text-lg text-white font-display font-bold">TL</span>
              <span className="absolute -inset-1 -z-10 rounded-2xl bg-primary/25 blur-md" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground font-display leading-none">Gelir-Gider</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Finance Center</p>
            </div>
          </Link>
        </div>

        {/* Live Signal Info */}
        <div className="px-6 py-3 flex items-center justify-between bg-muted/20 border-b border-border/60 text-xs">
          <span className="text-muted-foreground">{todayLabel}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle" />
            Canli
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative',
                  active
                    ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-[inset_-4px_0_12px_rgba(15,76,92,0.01)]'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <link.icon className={cn('w-5 h-5 transition-transform group-hover:scale-105', active ? 'text-primary' : 'text-muted-foreground')} />
                <span>{link.label}</span>
                {active && (
                  <span className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Quick Actions / Theme / Settings Section */}
        <div className="p-4 border-t border-border/70 space-y-4">
          <div className="flex items-center justify-around bg-muted/40 rounded-xl p-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors flex-1 flex justify-center"
              title={theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-500 animate-pulse-subtle" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors flex-1 flex justify-center"
              title={t('settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'Kullanıcı'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 ml-2"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
