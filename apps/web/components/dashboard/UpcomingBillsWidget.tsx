'use client'

import { Receipt, AlertCircle, CheckCircle, Calendar, Plus } from 'lucide-react'

interface Bill {
  id: string
  name: string
  amount: number
  currency: string
  dueDate: string
  isPaid: boolean
  categoryLabel: string
}

interface UpcomingBillsWidgetProps {
  bills: Bill[]
  onAddBill?: () => void
  onBillClick?: (bill: Bill) => void
  onPayBill?: (billId: string) => void
}

export function UpcomingBillsWidget({
  bills,
  onAddBill,
  onBillClick,
  onPayBill,
}: UpcomingBillsWidgetProps) {
  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
    }).format(date)
  }

  const getDaysUntil = (dateStr: string) => {
    const now = new Date()
    const due = new Date(dateStr)
    now.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getBillPriority = (bill: Bill) => {
    if (bill.isPaid) return 'paid'
    const days = getDaysUntil(bill.dueDate)
    if (days < 0) return 'overdue'
    if (days === 0) return 'today'
    if (days <= 3) return 'urgent'
    return 'upcoming'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'bg-red-50 border-red-200'
      case 'today': return 'bg-orange-50 border-orange-200'
      case 'urgent': return 'bg-yellow-50 border-yellow-200'
      case 'paid': return 'bg-green-50 border-green-200'
      default: return 'bg-card border-border'
    }
  }

  const getPriorityBadge = (priority: string, days: number) => {
    switch (priority) {
      case 'overdue':
        return <span className="text-xs font-medium text-red-600">{Math.abs(days)} gün gecikti</span>
      case 'today':
        return <span className="text-xs font-medium text-orange-600">Bugün</span>
      case 'urgent':
        return <span className="text-xs font-medium text-yellow-600">{days} gün kaldı</span>
      case 'paid':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle className="w-3 h-3" />
            Ödendi
          </span>
        )
      default:
        return <span className="text-xs text-muted-foreground">{days} gün</span>
    }
  }

  const sortedBills = [...bills].sort((a, b) => {
    // Paid bills go to bottom
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1
    // Then sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const unpaidBills = bills.filter(b => !b.isPaid)
  const totalAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="glass-card rounded-[28px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary-600" />
          Yaklaşan Faturalar
        </h3>
        {onAddBill && (
          <button
            onClick={onAddBill}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Fatura
          </button>
        )}
      </div>

      {sortedBills.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Yaklaşan faturanız yok</p>
          {onAddBill && (
            <button
              onClick={onAddBill}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              İlk faturanızı ekleyin
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBills.slice(0, 5).map((bill) => {
            const priority = getBillPriority(bill)
            const days = getDaysUntil(bill.dueDate)

            return (
              <div
                key={bill.id}
                onClick={() => onBillClick?.(bill)}
                className={`border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${getPriorityColor(priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{bill.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{bill.categoryLabel}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(bill.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(bill.amount, bill.currency)}
                    </p>
                    <div className="mt-1">
                      {getPriorityBadge(priority, days)}
                    </div>
                  </div>
                </div>

                {!bill.isPaid && onPayBill && priority !== 'paid' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPayBill(bill.id)
                    }}
                    className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/40"
                  >
                    Ödendi Olarak İşaretle
                  </button>
                )}
              </div>
            )
          })}

          {sortedBills.length > 5 && (
            <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2">
              Tümünü Gör ({sortedBills.length - 5} daha)
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {unpaidBills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Toplam Ödenmemiş</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(totalAmount, unpaidBills[0]?.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Fatura Sayısı</p>
              <p className="text-lg font-semibold text-primary-600">
                {unpaidBills.length}
              </p>
            </div>
          </div>

          {unpaidBills.some(b => getDaysUntil(b.dueDate) < 0) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Gecikmiş faturalarınız var!</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


