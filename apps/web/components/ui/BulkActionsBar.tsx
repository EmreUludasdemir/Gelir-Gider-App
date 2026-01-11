'use client'

import { useState } from 'react'
import { X, Trash2, Tag, Download, MoreHorizontal } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'

interface BulkActionsBarProps {
  selectedCount: number
  onDelete?: () => void
  onCategorize?: (categoryId: string, categoryLabel: string) => void
  onExport?: () => void
  onDeselect: () => void
  isDeleting?: boolean
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onCategorize,
  onExport,
  onDeselect,
  isDeleting = false,
}: BulkActionsBarProps) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  if (selectedCount === 0) return null

  const handleCategorySelect = (categoryId: string, categoryLabel: string) => {
    onCategorize?.(categoryId, categoryLabel)
    setShowCategoryMenu(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Selected Count */}
          <div className="flex items-center gap-3">
            <button
              onClick={onDeselect}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="SeÃ§imi kaldÄ±r"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {selectedCount} Ã¶ÄŸe seÃ§ildi
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Categorize */}
            {onCategorize && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCategoryMenu(!showCategoryMenu)
                    setShowMoreMenu(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-card border border-border rounded-md hover:bg-muted/40 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  Kategorize Et
                </button>

                {showCategoryMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCategoryMenu(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                          Kategori SeÃ§
                        </p>
                        {CATEGORIES.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id, category.label)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-muted rounded transition-colors"
                          >
                            <span className="text-lg">{category.emoji}</span>
                            <span>{category.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Export */}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-card border border-border rounded-md hover:bg-muted/40 transition-colors"
              >
                <Download className="w-4 h-4" />
                DÄ±ÅŸa Aktar
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            )}

            {/* More Actions */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMoreMenu(!showMoreMenu)
                  setShowCategoryMenu(false)
                }}
                className="p-2 text-gray-700 hover:bg-muted rounded-md transition-colors"
                aria-label="Daha fazla iÅŸlem"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMoreMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMoreMenu(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20">
                    <div className="p-1">
                      <button
                        onClick={() => {
                          // Add future bulk actions here
                          setShowMoreMenu(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-muted rounded transition-colors"
                      >
                        Toplu DÃ¼zenle
                      </button>
                      <button
                        onClick={() => {
                          // Add future bulk actions here
                          setShowMoreMenu(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-muted rounded transition-colors"
                      >
                        Etiket Ekle
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add slide-up animation to globals.css:
/*
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
*/


