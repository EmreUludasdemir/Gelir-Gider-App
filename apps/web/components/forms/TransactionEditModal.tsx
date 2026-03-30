'use client'

import { useState, useEffect } from 'react'
import { Transaction, updateTransaction, deleteTransaction } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CATEGORIES } from '@/lib/categories'
import { useToast } from '@/components/ui/Toast'
import { usePreferences } from '@/lib/PreferencesContext'
import { useTranslation } from '@/lib/translations'

interface TransactionEditModalProps {
  transaction: Transaction
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TransactionEditModal({
  transaction,
  isOpen,
  onClose,
  onSuccess
}: TransactionEditModalProps) {
  const { showToast } = useToast()
  const { language } = usePreferences()
  const { t } = useTranslation(language)
  const [formData, setFormData] = useState({
    description: transaction.description,
    amount: Math.abs(transaction.amount),
    categoryId: transaction.categoryId,
    categoryLabel: transaction.categoryLabel,
    notes: transaction.notes || '',
    tags: transaction.tags?.join(', ') || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        categoryId: transaction.categoryId,
        categoryLabel: transaction.categoryLabel,
        notes: transaction.notes || '',
        tags: transaction.tags?.join(', ') || ''
      })
      setError(null)
      setShowDeleteConfirm(false)
    }
  }, [isOpen, transaction])

  const handleCategoryChange = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId)
    if (category) {
      setFormData({
        ...formData,
        categoryId: category.id,
        categoryLabel: category.label
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t)

      await updateTransaction(transaction.id, {
        description: formData.description,
        amount: formData.amount,
        categoryId: formData.categoryId,
        categoryLabel: formData.categoryLabel,
        notes: formData.notes || undefined,
        tags
      })

      showToast(t('transaction_updated'), 'success')
      onSuccess()
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : (language === 'tr' ? 'Güncelleme başarısız' : 'Update failed')
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      await deleteTransaction(transaction.id)
      showToast(t('transaction_deleted'), 'success')
      onSuccess()
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : (language === 'tr' ? 'Silme başarısız' : 'Delete failed')
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // i18n labels
  const labels = language === 'tr' ? {
    editTransaction: 'İşlemi Düzenle',
    pdf: 'PDF',
    manual: 'Manuel',
    description: 'Açıklama',
    descriptionPlaceholder: 'İşlem açıklaması',
    amount: 'Tutar (₺)',
    type: 'Tür',
    income: 'Gelir',
    expense: 'Gider',
    category: 'Kategori',
    confidenceScore: 'Güven skoru',
    tags: 'Etiketler',
    tagsPlaceholder: 'Virgülle ayırarak: iş, proje, önemli',
    tagsHelp: 'Virgülle ayırarak birden fazla etiket ekleyebilirsiniz',
    notes: 'Notlar',
    notesPlaceholder: 'Ek notlar...',
    deleteConfirm: 'Bu işlemi silmek istediğinizden emin misiniz?',
    yesDelete: 'Evet, Sil',
    cancel: 'İptal',
    delete: '🗑️ Sil',
    save: 'Kaydet',
  } : {
    editTransaction: 'Edit Transaction',
    pdf: 'PDF',
    manual: 'Manual',
    description: 'Description',
    descriptionPlaceholder: 'Transaction description',
    amount: 'Amount',
    type: 'Type',
    income: 'Income',
    expense: 'Expense',
    category: 'Category',
    confidenceScore: 'Confidence score',
    tags: 'Tags',
    tagsPlaceholder: 'Comma separated: work, project, important',
    tagsHelp: 'You can add multiple tags separated by commas',
    notes: 'Notes',
    notesPlaceholder: 'Additional notes...',
    deleteConfirm: 'Are you sure you want to delete this transaction?',
    yesDelete: 'Yes, Delete',
    cancel: 'Cancel',
    delete: '🗑️ Delete',
    save: 'Save',
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-muted/80 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-muted/40 px-6 py-4 border-b border-border">
              <h3 id="modal-title" className="text-lg font-semibold text-foreground">
                {labels.editTransaction}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(transaction.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')} •{' '}
                {transaction.source === 'pdf' ? labels.pdf : labels.manual}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {labels.description}
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={labels.descriptionPlaceholder}
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {labels.amount}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) })
                  }
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {labels.type}: {transaction.type === 'income' ? labels.income : labels.expense}
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {labels.category}
                </label>
                <Select
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {labels.confidenceScore}: {transaction.confidence.toFixed(0)}%
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {labels.tags}
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder={labels.tagsPlaceholder}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {labels.tagsHelp}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {labels.notes}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder={labels.notesPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in" role="alert">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
                  <p className="text-sm font-medium text-foreground mb-3">
                    {labels.deleteConfirm}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleDelete}
                      loading={loading}
                      className="flex-1 bg-destructive hover:bg-destructive/90"
                    >
                      {labels.yesDelete}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      {labels.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-muted/40 px-6 py-4 border-t border-border flex justify-between gap-3">
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="text-destructive hover:text-destructive hover:border-destructive/30"
                disabled={loading || showDeleteConfirm}
              >
                {labels.delete}
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                >
                  {labels.cancel}
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={showDeleteConfirm}
                >
                  {labels.save}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

