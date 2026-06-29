'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  Wallet,
  XCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { CATEGORIES } from '@/lib/categories'
import { useBudgetStatus } from '@/lib/hooks'
import { createBudget, deleteBudget, Budget } from '@/lib/api'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

type BudgetStatus = 'safe' | 'watch' | 'over'

function getBudgetStatus(percentage: number, apiStatus?: 'ok' | 'warning' | 'over'): BudgetStatus {
  if (apiStatus === 'over') return 'over'
  if (apiStatus === 'warning') return 'watch'
  if (apiStatus === 'ok') return 'safe'
  if (percentage > 100) return 'over'
  if (percentage >= 70) return 'watch'
  return 'safe'
}

function getBudgetVisuals(status: BudgetStatus) {
  switch (status) {
    case 'safe':
      return {
        tone: 'border-success/25 bg-success/10 text-success',
        bar: 'bg-success',
        bg: 'bg-success/20',
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: 'Guvenli',
      }
    case 'watch':
      return {
        tone: 'border-warning/25 bg-warning/10 text-warning',
        bar: 'bg-warning',
        bg: 'bg-warning/20',
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Dikkat',
      }
    case 'over':
      return {
        tone: 'border-destructive/25 bg-destructive/10 text-destructive',
        bar: 'bg-destructive',
        bg: 'bg-destructive/20',
        icon: <XCircle className="h-4 w-4" />,
        label: 'Asildi',
      }
  }
}

export default function BudgetsPage() {
  const { showToast } = useToast()
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)
  const { data: budgetsWithSpending = [], isLoading, mutate } = useBudgetStatus()
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'safe' | 'watch' | 'over'>('all')
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'weekly'
  })

  const { totalAllocated, totalSpent, safeCount, watchCount, overCount } = useMemo(() => {
    let alloc = 0
    let spent = 0
    let safe = 0
    let watch = 0
    let over = 0

    budgetsWithSpending.forEach(b => {
      alloc += b.limitAmount
      spent += b.spent || 0
      const status = getBudgetStatus(b.percentage || 0, b.status)
      if (status === 'safe') safe++
      else if (status === 'watch') watch++
      else over++
    })

    return { totalAllocated: alloc, totalSpent: spent, safeCount: safe, watchCount: watch, overCount: over }
  }, [budgetsWithSpending])

  const overallUsage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
  const totalRemaining = totalAllocated - totalSpent
  const overallStatus = getBudgetStatus(overallUsage)

  const filteredBudgets = useMemo(() => {
    if (filter === 'all') return budgetsWithSpending
    return budgetsWithSpending.filter(b => getBudgetStatus(b.percentage || 0, b.status) === filter)
  }, [budgetsWithSpending, filter])

  // Show alerts when budgets exceed thresholds
  useEffect(() => {
    budgetsWithSpending.forEach(budget => {
      const percentage = budget.percentage || 0
      const spent = budget.spent || 0
      if ((budget.status === 'over' || percentage >= 100) && spent > 0) {
        showToast(`🚨 ${budget.categoryLabel} butcesi asildi!`, 'error')
      } else if ((budget.status === 'warning' || percentage >= 80) && percentage < 100) {
        showToast(`⚠️  ${budget.categoryLabel} butcesi %${Math.round(percentage)} doldu`, 'warning')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetsWithSpending.length, budgetsWithSpending.map(b => Math.floor((b.percentage || 0) / 10)).join(',')])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const category = CATEGORIES.find(c => c.id === formData.categoryId)
    if (!category) return

    // Prevent duplicates
    if (budgetsWithSpending.some(b => b.categoryId === formData.categoryId && b.period === formData.period)) {
      showToast('Bu kategori ve periyot icin zaten bir butce var.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await createBudget({
        categoryId: formData.categoryId,
        categoryLabel: category.label,
        limitAmount: parseFloat(formData.amount),
        period: formData.period
      })
      await mutate()
      setFormData({ categoryId: '', amount: '', period: 'monthly' })
      setShowForm(false)
      showToast('Butce basariyla olusturuldu.', 'success')
    } catch (error: any) {
      showToast(error.message || 'Butce olusturulurken bir hata olustu.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id)
    try {
      await deleteBudget(id)
      await mutate()
      showToast(`${name} butcesi silindi.`, 'success')
    } catch (error: any) {
      showToast(error.message || 'Butce silinirken bir hata olustu.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const overallVisuals = getBudgetVisuals(overallStatus)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-page-enter">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-primary/[0.08] via-card to-destructive/[0.05] p-6 shadow-[0_20px_44px_rgba(15,76,92,0.12)]">
        <div className="pointer-events-none absolute -right-14 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-32 w-32 rounded-full bg-destructive/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Target className="h-3.5 w-3.5" />
              Budget Center
            </p>
            <h1 className="mt-3 text-3xl font-display font-bold text-foreground">Butce Planlama</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Harcama limitlerinizi belirleyin, guncel durumunuzu takip edin ve ay sonu hedeflerinize ulasin.
            </p>
          </div>
          
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:min-w-[280px]">
            <div className={`rounded-[24px] border p-4 backdrop-blur-sm animate-scale-in border-border/70 bg-background/75`}>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Toplam Butce</p>
              </div>
              <p className="mt-2 text-xl font-display font-semibold text-foreground truncate">{formatCurrency(totalAllocated)}</p>
            </div>
            <div className={`rounded-[24px] border p-4 backdrop-blur-sm animate-scale-in border-border/70 bg-background/75`}>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Toplam Harcanan</p>
              </div>
              <p className="mt-2 text-xl font-display font-semibold text-foreground truncate">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HEALTH & SUMMARY + FORM ═══════════════ */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Health Summary */}
        <section className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_16px_34px_rgba(15,76,92,0.08)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${overallVisuals.bg}`}>
                <Activity className={`h-5 w-5 ${overallVisuals.tone.split(' ')[2]}`} />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Genel Durum</h2>
                <p className="text-sm text-muted-foreground">Tum butcelerin ortak saglik durumu.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-success/20 bg-success/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-success/80">Guvenli</p>
                <p className="mt-2 text-2xl font-display font-semibold text-success">{safeCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">kategori</p>
              </div>
              <div className="rounded-[20px] border border-warning/25 bg-warning/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-warning/80">Dikkat</p>
                <p className="mt-2 text-2xl font-display font-semibold text-warning">{watchCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">kategori</p>
              </div>
              <div className="rounded-[20px] border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-destructive/80">Asildi</p>
                <p className="mt-2 text-2xl font-display font-semibold text-destructive">{overCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">kategori</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] border border-border/60 bg-muted/30 p-4 flex items-center justify-between gap-4">
             <div>
               <p className="text-sm font-medium text-foreground">Kalan Butce (Tahmini)</p>
               <p className={`text-lg font-bold truncate mt-1 ${totalRemaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                 {formatCurrency(totalRemaining)}
               </p>
             </div>
             <div className="text-right flex-shrink-0">
               <p className="text-sm font-medium text-foreground">Kullanim</p>
               <p className={`text-lg font-bold mt-1 ${overallVisuals.tone.split(' ')[2]}`}>
                 %{overallUsage.toFixed(1)}
               </p>
             </div>
          </div>
        </section>

        {/* New Budget Form */}
        <section className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_16px_34px_rgba(15,76,92,0.08)]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Yeni butce</h2>
                <p className="text-sm text-muted-foreground">Harcama limiti tanimlayin.</p>
              </div>
            </div>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)} className="flex-shrink-0">
                Oluştur
              </Button>
            )}
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              <Select
                label="Kategori"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                options={[
                  { value: '', label: 'Kategori secin' },
                  ...CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both').map(cat => ({
                    value: cat.id,
                    label: `${cat.emoji} ${cat.label}`
                  }))
                ]}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Limit Tutari"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
                <Select
                  label="Periyot"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'weekly' })}
                  options={[
                    { value: 'monthly', label: 'Aylik' },
                    { value: 'weekly', label: 'Haftalik' }
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Iptal
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kaydet
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-[20px] border border-dashed border-border/70 bg-muted/20 p-6 text-center animate-fade-in">
              <PiggyBank className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">Kategori bazli harcama hedefleri koyarak birikimlerinizi artirin.</p>
            </div>
          )}
        </section>
      </div>

      {/* ═══════════════ BUDGET LIST ═══════════════ */}
      <section className="space-y-4">
        {budgetsWithSpending.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
            <h2 className="text-xl font-display font-semibold text-foreground">Aktif Butceler</h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
              {(['all', 'safe', 'watch', 'over'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {f === 'all' && 'Tumu'}
                  {f === 'safe' && 'Guvenli'}
                  {f === 'watch' && 'Dikkat'}
                  {f === 'over' && 'Asildi'}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredBudgets.length === 0 ? (
          <div className="rounded-[32px] border border-border/70 bg-card/85 p-12 text-center shadow-[0_16px_34px_rgba(15,76,92,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">Henuz butce bulunmuyor</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter !== 'all' 
                ? 'Bu filtreye uygun butce yok.' 
                : 'Yukaridaki formu kullanarak ilk butcenizi olusturun.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
            {filteredBudgets.map((budget, index) => {
              const status = getBudgetStatus(budget.percentage || 0, budget.status)
              const visuals = getBudgetVisuals(status)
              
              return (
                <div
                  key={budget.id}
                  className="rounded-[24px] border border-border/70 bg-gradient-to-b from-background/90 to-background/60 p-5 transition-all hover:shadow-[0_12px_28px_rgba(15,76,92,0.1)] animate-list-item"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">{budget.categoryLabel}</p>
                      <p className="mt-1 text-sm text-muted-foreground capitalize">{budget.period === 'weekly' ? 'Haftalik' : 'Aylik'}</p>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${visuals.tone}`}>
                      {visuals.icon}
                      {visuals.label}
                    </span>
                  </div>

                  {/* Progress Section */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-foreground truncate">{formatCurrency(budget.spent || 0)} harcandi</span>
                      <span className="text-muted-foreground flex-shrink-0">%{Math.round(budget.percentage || 0)}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${visuals.bar}`}
                        style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-[16px] border border-border/60 bg-card/60 p-3">
                      <p className="text-xs text-muted-foreground">Hedef Limit</p>
                      <p className="mt-1 text-sm font-semibold text-foreground truncate">{formatCurrency(budget.limitAmount)}</p>
                    </div>
                    <div className={`rounded-[16px] border p-3 ${
                      status === 'over' 
                        ? 'border-destructive/20 bg-destructive/5' 
                        : 'border-border/60 bg-card/60'
                    }`}>
                      <p className={`text-xs ${status === 'over' ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                        {status === 'over' ? 'Limit Asimi' : 'Kalan'}
                      </p>
                      <p className={`mt-1 text-sm font-semibold truncate ${
                        status === 'over' ? 'text-destructive' : 'text-foreground'
                      }`}>
                        {formatCurrency(Math.abs(budget.remaining || 0))}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Microcopy */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                    <p className={`text-xs font-medium ${
                      status === 'over' ? 'text-destructive' :
                      status === 'watch' ? 'text-warning' : 'text-success'
                    }`}>
                      {status === 'over' ? 'Lutfen harcamalara dikkat edin.' : 
                       status === 'watch' ? 'Limite oldukca yaklasildi.' : 
                       'Hedeflerinize uygun ilerliyorsunuz.'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(budget.id, budget.categoryLabel)}
                      disabled={deletingId === budget.id}
                      className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                      aria-label={`${budget.categoryLabel} butcesini sil`}
                    >
                      {deletingId === budget.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
