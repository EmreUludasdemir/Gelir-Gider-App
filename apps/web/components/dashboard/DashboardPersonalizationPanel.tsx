'use client'

import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LayoutDashboard,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { usePreferences } from '@/lib/PreferencesContext'
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  DashboardWidgetId,
} from '@/lib/dashboard-widgets'
import { cn } from '@/lib/utils'

export function DashboardPersonalizationPanel() {
  const {
    language,
    dashboardPreferences,
    setDashboardDensity,
    toggleDashboardWidget,
    moveDashboardWidget,
    resetDashboardPreferences,
  } = usePreferences()
  const [isOpen, setIsOpen] = useState(false)
  const visibleCount = dashboardPreferences.widgetOrder.filter(
    (widgetId) => dashboardPreferences.visibleWidgets[widgetId],
  ).length
  const localeKey = language === 'tr' ? 'tr' : 'en'

  const copy = language === 'tr'
    ? {
        title: 'Dashboard gorunumu',
        edit: 'Duzenle',
        close: 'Kapat',
        focus: 'Odak',
        full: 'Tam',
        reset: 'Sifirla',
        visible: 'aktif',
        hidden: 'gizli',
      }
    : {
        title: 'Dashboard view',
        edit: 'Edit',
        close: 'Close',
        focus: 'Focus',
        full: 'Full',
        reset: 'Reset',
        visible: 'active',
        hidden: 'hidden',
      }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/72 p-3 shadow-[0_10px_24px_rgba(15,76,92,0.08)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{copy.title}</h2>
            <p className="text-xs text-muted-foreground">
              {visibleCount} {copy.visible}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border/70 bg-background/75 p-1">
            {(['focus', 'full'] as const).map((density) => (
              <button
                key={density}
                type="button"
                onClick={() => setDashboardDensity(density)}
                className={cn(
                  'min-h-[34px] rounded-lg px-3 text-sm font-medium transition-colors',
                  dashboardPreferences.density === density
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
              >
                {density === 'focus' ? copy.focus : copy.full}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            className="gap-2"
          >
            {isOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
            {isOpen ? copy.close : copy.edit}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {dashboardPreferences.widgetOrder.map((widgetId, index) => {
            const isVisible = dashboardPreferences.visibleWidgets[widgetId]
            const label = DASHBOARD_WIDGET_DEFINITIONS[widgetId][localeKey]

            return (
              <div
                key={widgetId}
                className={cn(
                  'flex min-h-[58px] items-center justify-between gap-3 rounded-xl border p-3 transition-colors',
                  isVisible
                    ? 'border-border/70 bg-background/80'
                    : 'border-border/50 bg-muted/35 text-muted-foreground',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleDashboardWidget(widgetId)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
                    {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {isVisible ? copy.visible : copy.hidden}
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <IconButton
                    disabled={index === 0}
                    onClick={() => moveDashboardWidget(widgetId as DashboardWidgetId, 'up')}
                    label="Yukari"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    disabled={index === dashboardPreferences.widgetOrder.length - 1}
                    onClick={() => moveDashboardWidget(widgetId as DashboardWidgetId, 'down')}
                    label="Asagi"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={resetDashboardPreferences}
            className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-background/55 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" />
            {copy.reset}
          </button>
        </div>
      )}
    </section>
  )
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  )
}
