'use client'

import { RecurringPayment } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface RecurringPaymentsProps {
  payments: RecurringPayment[]
}

export function RecurringPayments({ payments }: RecurringPaymentsProps) {
  if (payments.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tekrarlayan Ödemeler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {payment.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sonraki: {formatDate(payment.nextDate)}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
                <Badge variant="warning" className="mt-1">
                  {payment.frequency === 'monthly' && 'Aylık'}
                  {payment.frequency === 'weekly' && 'Haftalık'}
                  {payment.frequency === 'yearly' && 'Yıllık'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


