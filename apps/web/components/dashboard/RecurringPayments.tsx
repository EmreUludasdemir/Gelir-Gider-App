'use client'

import { RecurringPayment } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

interface RecurringPaymentsProps {
  payments: RecurringPayment[]
}

export function RecurringPayments({ payments }: RecurringPaymentsProps) {
  const { language, formatCurrency } = usePreferences()
  const { t } = useTranslation(language)
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  
  const getFrequencyLabel = (freq: string) => {
    if (language === 'tr') {
      if (freq === 'monthly') return 'Aylık'
      if (freq === 'weekly') return 'Haftalık'
      if (freq === 'yearly') return 'Yıllık'
      return freq
    } else {
      if (freq === 'monthly') return 'Monthly'
      if (freq === 'weekly') return 'Weekly'
      if (freq === 'yearly') return 'Yearly'
      return freq
    }
  }

  if (payments.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>{t('recurring_payments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            {language === 'tr' ? 'Tekrarlayan ödeme bulunamadı' : 'No recurring payments found'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{t('recurring_payments')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 bg-muted/40 rounded-lg animate-list-item hover:bg-muted/60 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {payment.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'tr' ? 'Sonraki:' : 'Next:'} {formatDate(payment.nextDate)}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(payment.amount)}
                </p>
                <Badge variant="warning" className="mt-1">
                  {getFrequencyLabel(payment.frequency)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


