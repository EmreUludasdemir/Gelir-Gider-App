'use client'

import { useState, useEffect } from 'react'
import { Transaction, updateTransaction, deleteTransaction } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CATEGORIES } from '@/lib/categories'
import { useToast } from '@/components/ui/Toast'

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

      showToast('İşlem başarıyla güncellendi! ✓', 'success')
      onSuccess()
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Güncelleme başarısız'
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
      showToast('İşlem başarıyla silindi! 🗑️', 'success')
      onSuccess()
      onClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Silme başarısız'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-muted/400 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-muted/40 px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                İşlemi Düzenle
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(transaction.date).toLocaleDateString('tr-TR')} •{' '}
                {transaction.source === 'pdf' ? 'PDF' : 'Manuel'}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="İşlem açıklaması"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (₺)
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
                  Tip: {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
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
                  Güven skoru: {transaction.confidence.toFixed(0)}%
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiketler
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="Virgülle ayırarak: iş, proje, önemli"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Virgülle ayırarak birden fazla etiket ekleyebilirsiniz
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-3">
                    Bu işlemi silmek istediğinizden emin misiniz?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleDelete}
                      loading={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Evet, Sil
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      İptal
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
                className="text-red-600 hover:text-red-700 hover:border-red-300"
                disabled={loading || showDeleteConfirm}
              >
                🗑️ Sil
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={showDeleteConfirm}
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

