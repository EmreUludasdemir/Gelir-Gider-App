'use client'

import { useState, useMemo, useCallback } from 'react'

interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
}

interface PaginationResult<T> {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
  paginatedItems: T[]
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPrevPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void
  pageSizeOptions: number[]
}

export function usePagination<T>(
  items: T[],
  options: PaginationOptions = {}
): PaginationResult<T> {
  const {
    initialPage = 1,
    initialPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / pageSize)

  // Reset to page 1 if current page is out of bounds
  const validPage = useMemo(() => {
    if (currentPage > totalPages) return Math.max(1, totalPages)
    if (currentPage < 1) return 1
    return currentPage
  }, [currentPage, totalPages])

  const startIndex = (validPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  const hasNextPage = validPage < totalPages
  const hasPrevPage = validPage > 1

  const goToPage = useCallback((page: number) => {
    const validatedPage = Math.max(1, Math.min(page, totalPages || 1))
    setCurrentPage(validatedPage)
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (hasNextPage) setCurrentPage((p) => p + 1)
  }, [hasNextPage])

  const prevPage = useCallback(() => {
    if (hasPrevPage) setCurrentPage((p) => p - 1)
  }, [hasPrevPage])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  return {
    currentPage: validPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex: startIndex + 1, // 1-indexed for display
    endIndex,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    pageSizeOptions,
  }
}
