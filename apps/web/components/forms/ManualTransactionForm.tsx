'use client'

import { useState } from 'react'
import { createTransaction, CreateTransactionDto, TransactionType } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

interface ManualTransactionFormProps {
  onSuccess?: () => void
}

export function ManualTransactionForm({ onSuccess }: ManualTransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
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
      showToast('Ä°ÅŸlem baÅŸarÄ±yla eklendi!', 'success')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ä°ÅŸlem eklenemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manuel Ä°ÅŸlem Ekle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="AÃ§Ä±klama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ã¶r: Market alÄ±ÅŸveriÅŸi"
            required
          />

          <Input
            label="Tutar"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="100.00"
            required
          />

          <Select
            label="Tip"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
            options={[
              { value: 'expense', label: 'Gider' },
              { value: 'income', label: 'Gelir' },
            ]}
          />

          <Input
            label="Tarih"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Ä°ÅŸlem Ekle
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

