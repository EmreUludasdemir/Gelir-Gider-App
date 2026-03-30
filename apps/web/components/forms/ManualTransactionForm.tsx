'use client'

import { useState, useCallback, useMemo } from 'react'
import { createTransaction, CreateTransactionDto, TransactionType } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ManualTransactionFormProps {
  onSuccess?: () => void
}

interface FormErrors {
  description?: string
  amount?: string
  date?: string
}

export function ManualTransactionForm({ onSuccess }: ManualTransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const { showToast } = useToast()
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    date: new Date().toISOString().split('T')[0],
  })

  // Validation messages
  const validationMessages = useMemo(() => ({
    descriptionRequired: language === 'tr' ? 'Açıklama zorunludur' : 'Description is required',
    descriptionTooShort: language === 'tr' ? 'Açıklama en az 3 karakter olmalı' : 'Description must be at least 3 characters',
    amountRequired: language === 'tr' ? 'Tutar zorunludur' : 'Amount is required',
    amountPositive: language === 'tr' ? 'Tutar 0\'dan büyük olmalı' : 'Amount must be greater than 0',
    amountTooLarge: language === 'tr' ? 'Tutar çok büyük' : 'Amount is too large',
    dateRequired: language === 'tr' ? 'Tarih zorunludur' : 'Date is required',
    dateFuture: language === 'tr' ? 'Gelecek tarih seçilemez' : 'Future date is not allowed',
  }), [language])

  // Validate single field
  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'description':
        if (!value.trim()) return validationMessages.descriptionRequired
        if (value.trim().length < 3) return validationMessages.descriptionTooShort
        break
      case 'amount':
        if (!value) return validationMessages.amountRequired
        const amount = parseFloat(value)
        if (isNaN(amount) || amount <= 0) return validationMessages.amountPositive
        if (amount > 999999999) return validationMessages.amountTooLarge
        break
      case 'date':
        if (!value) return validationMessages.dateRequired
        const selectedDate = new Date(value)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        if (selectedDate > today) return validationMessages.dateFuture
        break
    }
    return undefined
  }, [validationMessages])

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    const descError = validateField('description', formData.description)
    if (descError) newErrors.description = descError
    
    const amountError = validateField('amount', formData.amount)
    if (amountError) newErrors.amount = amountError
    
    const dateError = validateField('date', formData.date)
    if (dateError) newErrors.date = dateError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validateField])

  // Handle field change with validation
  const handleChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validate on change if field was touched
    if (touched[name]) {
      const fieldError = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: fieldError }))
    }
  }, [touched, validateField])

  // Handle field blur
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const fieldError = validateField(name, formData[name as keyof typeof formData])
    setErrors(prev => ({ ...prev, [name]: fieldError }))
  }, [formData, validateField])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({ description: true, amount: true, date: true })
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const dto: CreateTransactionDto = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
        type: formData.type,
        date: formData.date,
      }

      await createTransaction(dto)
      
      // Show success animation
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      })
      setTouched({})
      setErrors({})
      
      showToast(t('transaction_added'), 'success')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transaction_add_error'))
    } finally {
      setLoading(false)
    }
  }

  // Check if form has changes
  const isDirty = useMemo(() => {
    return formData.description !== '' || formData.amount !== ''
  }, [formData.description, formData.amount])

  return (
    <Card className={showSuccess ? 'ring-2 ring-success/50 transition-all' : 'transition-all'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('manual_transaction')}
          {showSuccess && (
            <CheckCircle2 className="w-5 h-5 text-success animate-bounce-in" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Input
              name="description"
              label={t('description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder={language === 'tr' ? 'ör: Market alışverişi' : 'e.g., Grocery shopping'}
              required
              error={touched.description ? errors.description : undefined}
              aria-invalid={touched.description && !!errors.description}
            />
          </div>

          <div>
            <Input
              name="amount"
              label={t('amount')}
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              placeholder="100.00"
              required
              error={touched.amount ? errors.amount : undefined}
              aria-invalid={touched.amount && !!errors.amount}
            />
          </div>

          <Select
            name="type"
            label={t('type')}
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            options={[
              { value: 'expense', label: t('expense') },
              { value: 'income', label: t('income') },
            ]}
          />

          <div>
            <Input
              name="date"
              label={t('date')}
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              onBlur={() => handleBlur('date')}
              max={new Date().toISOString().split('T')[0]}
              required
              error={touched.date ? errors.date : undefined}
              aria-invalid={touched.date && !!errors.date}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            loading={loading} 
            className="w-full"
            disabled={Object.keys(errors).some(k => errors[k as keyof FormErrors])}
          >
            {t('add_transaction')}
          </Button>
          
          {isDirty && !loading && (
            <p className="text-xs text-center text-muted-foreground animate-fade-in">
              {language === 'tr' ? '• Kaydedilmemiş değişiklikler var' : '• You have unsaved changes'}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

