'use client'

import { useState } from 'react'
import { createTransaction, CreateTransactionDto, TransactionType } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

interface ManualTransactionFormProps {
  onSuccess?: () => void
}

export function ManualTransactionForm({ onSuccess }: ManualTransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    date: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const dto: CreateTransactionDto = {
        description: formData.description,
        amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
        type: formData.type,
        date: formData.date,
      }

      await createTransaction(dto)
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      })
      showToast(t('transaction_added'), 'success')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transaction_add_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('manual_transaction')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="description"
            label={t('description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={language === 'tr' ? 'ör: Market alışverişi' : 'e.g., Grocery shopping'}
            required
          />

          <Input
            name="amount"
            label={t('amount')}
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="100.00"
            required
          />

          <Select
            name="type"
            label={t('type')}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
            options={[
              { value: 'expense', label: t('expense') },
              { value: 'income', label: t('income') },
            ]}
          />

          <Input
            name="date"
            label={t('date')}
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {t('add_transaction')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

