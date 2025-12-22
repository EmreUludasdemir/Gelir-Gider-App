'use client'

import { useState, useCallback, useMemo } from 'react'

interface UseBulkSelectionOptions<T> {
  items: T[]
  getItemId: (item: T) => string
  onSelectionChange?: (selectedIds: string[]) => void
}

export function useBulkSelection<T>({
  items,
  getItemId,
  onSelectionChange,
}: UseBulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allIds = useMemo(() => items.map(getItemId), [items, getItemId])

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(id)) {
          newSet.delete(id)
        } else {
          newSet.add(id)
        }
        onSelectionChange?.(Array.from(newSet))
        return newSet
      })
    },
    [onSelectionChange]
  )

  const select = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.has(id)) return prev
        const newSet = new Set(prev)
        newSet.add(id)
        onSelectionChange?.(Array.from(newSet))
        return newSet
      })
    },
    [onSelectionChange]
  )

  const deselect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev
        const newSet = new Set(prev)
        newSet.delete(id)
        onSelectionChange?.(Array.from(newSet))
        return newSet
      })
    },
    [onSelectionChange]
  )

  const selectAll = useCallback(() => {
    const newSet = new Set(allIds)
    setSelectedIds(newSet)
    onSelectionChange?.(allIds)
  }, [allIds, onSelectionChange])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
    onSelectionChange?.([])
  }, [onSelectionChange])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === allIds.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selectedIds.size, allIds.length, deselectAll, selectAll])

  const selectRange = useCallback(
    (startId: string, endId: string) => {
      const startIndex = allIds.indexOf(startId)
      const endIndex = allIds.indexOf(endId)

      if (startIndex === -1 || endIndex === -1) return

      const [minIndex, maxIndex] = [
        Math.min(startIndex, endIndex),
        Math.max(startIndex, endIndex),
      ]

      const rangeIds = allIds.slice(minIndex, maxIndex + 1)
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        rangeIds.forEach((id) => newSet.add(id))
        onSelectionChange?.(Array.from(newSet))
        return newSet
      })
    },
    [allIds, onSelectionChange]
  )

  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectedIds.has(getItemId(item)))
  }, [items, selectedIds, getItemId])

  const selectedCount = selectedIds.size
  const isAllSelected = allIds.length > 0 && selectedIds.size === allIds.length
  const isNoneSelected = selectedIds.size === 0
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < allIds.length

  return {
    // State
    selectedIds: Array.from(selectedIds),
    selectedCount,
    isAllSelected,
    isNoneSelected,
    isSomeSelected,

    // Actions
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    toggleAll,
    selectRange,
    getSelectedItems,
  }
}
