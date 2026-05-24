export const DASHBOARD_WIDGET_ORDER = [
  'command-center',
  'action-feed',
  'cash-flow',
  'scenario-planner',
  'financial-analysis',
  'stats',
  'ai-insights',
  'monthly-trend',
  'weekly-category',
  'categories-recurring',
  'transactions',
] as const

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_ORDER)[number]
export type DashboardDensity = 'focus' | 'full'

export interface DashboardPreferences {
  density: DashboardDensity
  visibleWidgets: Record<DashboardWidgetId, boolean>
  widgetOrder: DashboardWidgetId[]
}

export const DASHBOARD_WIDGET_DEFINITIONS: Record<
  DashboardWidgetId,
  {
    tr: string
    en: string
  }
> = {
  'command-center': {
    tr: 'Komuta paneli',
    en: 'Command center',
  },
  'action-feed': {
    tr: 'Oncelikli hamleler',
    en: 'Priority actions',
  },
  'cash-flow': {
    tr: 'Nakit akisi',
    en: 'Cash flow',
  },
  'scenario-planner': {
    tr: 'Tasarruf senaryosu',
    en: 'Savings scenario',
  },
  'financial-analysis': {
    tr: 'Finans analizi',
    en: 'Financial analysis',
  },
  stats: {
    tr: 'Gelir gider ozeti',
    en: 'Income expense summary',
  },
  'ai-insights': {
    tr: 'AI icgoruler',
    en: 'AI insights',
  },
  'monthly-trend': {
    tr: 'Aylik trend',
    en: 'Monthly trend',
  },
  'weekly-category': {
    tr: 'Haftalik ve kategori',
    en: 'Weekly and category',
  },
  'categories-recurring': {
    tr: 'Kategoriler ve tekrar edenler',
    en: 'Categories and recurring',
  },
  transactions: {
    tr: 'Son islemler',
    en: 'Recent transactions',
  },
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  density: 'focus',
  visibleWidgets: DASHBOARD_WIDGET_ORDER.reduce(
    (acc, widgetId) => ({
      ...acc,
      [widgetId]: true,
    }),
    {} as Record<DashboardWidgetId, boolean>,
  ),
  widgetOrder: [...DASHBOARD_WIDGET_ORDER],
}

export function normalizeDashboardPreferences(value: unknown): DashboardPreferences {
  if (!value || typeof value !== 'object') {
    return DEFAULT_DASHBOARD_PREFERENCES
  }

  const candidate = value as Partial<DashboardPreferences>
  const knownIds = new Set<DashboardWidgetId>(DASHBOARD_WIDGET_ORDER as readonly DashboardWidgetId[])
  const candidateOrder = Array.isArray(candidate.widgetOrder)
    ? candidate.widgetOrder.filter((id): id is DashboardWidgetId => knownIds.has(id as DashboardWidgetId))
    : []

  const widgetOrder = [
    ...candidateOrder,
    ...DASHBOARD_WIDGET_ORDER.filter((id) => !candidateOrder.includes(id)),
  ]

  const visibleWidgets = DASHBOARD_WIDGET_ORDER.reduce((acc, widgetId) => {
    const storedValue = candidate.visibleWidgets?.[widgetId]
    acc[widgetId] = typeof storedValue === 'boolean' ? storedValue : true
    return acc
  }, {} as Record<DashboardWidgetId, boolean>)

  if (!Object.values(visibleWidgets).some(Boolean)) {
    visibleWidgets['command-center'] = true
  }

  return {
    density: candidate.density === 'full' ? 'full' : 'focus',
    visibleWidgets,
    widgetOrder,
  }
}
