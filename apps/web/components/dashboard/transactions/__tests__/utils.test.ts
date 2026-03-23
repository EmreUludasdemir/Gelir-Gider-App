import { buildSimilarTransactionClusters, normalizeSimilarityKey } from '../utils'
import type { Transaction } from '@/lib/api'

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id || 'tx-1',
    date: overrides.date || '2026-03-01T00:00:00.000Z',
    description: overrides.description || 'Kira Odemesi',
    amount: overrides.amount ?? -25000,
    currency: overrides.currency || 'TRY',
    type: overrides.type || 'expense',
    categoryId: overrides.categoryId || 'rent',
    categoryLabel: overrides.categoryLabel || 'Kira',
    source: overrides.source || 'manual',
    confidence: overrides.confidence ?? 100,
    tags: overrides.tags || [],
    notes: overrides.notes,
    createdAt: overrides.createdAt || '2026-03-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-03-01T00:00:00.000Z',
  }
}

describe('transaction clustering utils', () => {
  it('normalizes merchant keys deterministically', () => {
    expect(normalizeSimilarityKey('Kira Odemesi 03/2026')).toBe('kira odemesi')
    expect(normalizeSimilarityKey('Migros Market!!!')).toBe('migros market')
  })

  it('builds actionable similar clusters and prefers non-generic categories', () => {
    const clusters = buildSimilarTransactionClusters([
      createTransaction({
        id: 'tx-1',
        description: 'Kira Odemesi 03/2026',
        categoryId: 'rent',
        categoryLabel: 'Kira',
        confidence: 92,
      }),
      createTransaction({
        id: 'tx-2',
        description: 'Kira Odemesi',
        categoryId: 'other',
        categoryLabel: 'Diger',
        confidence: 55,
      }),
      createTransaction({
        id: 'tx-3',
        description: 'Maas',
        type: 'income',
        categoryId: 'salary',
        categoryLabel: 'Maas',
        amount: 50000,
      }),
    ])

    expect(clusters).toHaveLength(1)
    expect(clusters[0]).toMatchObject({
      normalizedKey: 'kira odemesi',
      title: 'Kira Odemesi',
      count: 2,
      suggestedCategoryId: 'rent',
      suggestedCategoryLabel: 'Kira',
    })
    expect(clusters[0].transactionIds).toEqual(['tx-1', 'tx-2'])
  })

  it('does not surface already-consistent clusters', () => {
    const clusters = buildSimilarTransactionClusters([
      createTransaction({
        id: 'tx-1',
        description: 'Migros Market 1',
        categoryId: 'market',
        categoryLabel: 'Market',
      }),
      createTransaction({
        id: 'tx-2',
        description: 'Migros Market 2',
        categoryId: 'market',
        categoryLabel: 'Market',
      }),
    ])

    expect(clusters).toEqual([])
  })
})
