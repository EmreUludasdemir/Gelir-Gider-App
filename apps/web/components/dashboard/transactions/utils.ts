import type { Transaction, TransactionType } from '@/lib/api'

const GENERIC_CATEGORY_IDS = new Set(['other'])

export interface SimilarTransactionCluster {
  id: string
  normalizedKey: string
  title: string
  type: TransactionType
  transactionIds: string[]
  transactions: Transaction[]
  count: number
  totalAmount: number
  sampleDescriptions: string[]
  categories: Array<{
    categoryId: string
    categoryLabel: string
    count: number
  }>
  suggestedCategoryId: string
  suggestedCategoryLabel: string
}

export const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    salary: 'bg-green-100 text-green-800',
    freelance: 'bg-blue-100 text-blue-800',
    investment: 'bg-primary-100 text-primary-800',
    bank_fees: 'bg-stone-100 text-stone-800',
    market: 'bg-orange-100 text-orange-800',
    restaurant: 'bg-red-100 text-red-800',
    transport: 'bg-primary-100 text-primary-800',
    subscription: 'bg-pink-100 text-pink-800',
    utilities: 'bg-yellow-100 text-yellow-800',
    health: 'bg-teal-100 text-teal-800',
    shopping: 'bg-cyan-100 text-cyan-800',
    education: 'bg-lime-100 text-lime-800',
    entertainment: 'bg-fuchsia-100 text-fuchsia-800',
    rent: 'bg-rose-100 text-rose-800',
    transfer: 'bg-muted text-foreground',
    atm: 'bg-slate-100 text-slate-800',
    insurance: 'bg-amber-100 text-amber-800',
    other: 'bg-neutral-100 text-neutral-800',
  }
  return colors[categoryId] || 'bg-muted text-foreground'
}

export function normalizeSimilarityKey(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[0-9]/g, ' ')
    .replace(/[^a-zA-Z\u00C0-\u024F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join(' ')

  return normalized
}

function sanitizeClusterId(normalizedKey: string, type: TransactionType) {
  return `${normalizedKey}-${type}`.replace(/\s+/g, '-')
}

function toTitle(transactions: Transaction[]) {
  return [...new Set(transactions.map((transaction) => transaction.description.trim()))]
    .sort((left, right) => left.length - right.length || left.localeCompare(right, 'tr'))
    .at(0) || 'Benzer islemler'
}

function shouldSurfaceCluster(transactions: Transaction[]) {
  const categoryIds = new Set(transactions.map((transaction) => transaction.categoryId))

  return (
    categoryIds.size > 1 ||
    categoryIds.has('other') ||
    transactions.some((transaction) => transaction.confidence < 80)
  )
}

export function buildSimilarTransactionClusters(
  transactions: Transaction[],
): SimilarTransactionCluster[] {
  const groups = new Map<string, Transaction[]>()

  transactions.forEach((transaction) => {
    const normalizedKey = normalizeSimilarityKey(transaction.description)
    if (!normalizedKey) {
      return
    }

    const key = `${transaction.type}:${normalizedKey}`
    const current = groups.get(key) || []
    current.push(transaction)
    groups.set(key, current)
  })

  return Array.from(groups.entries())
    .map(([groupKey, groupedTransactions]) => {
      if (groupedTransactions.length < 2 || !shouldSurfaceCluster(groupedTransactions)) {
        return null
      }

      const [, normalizedKey] = groupKey.split(':')
      const categoryStats = Array.from(
        groupedTransactions
          .reduce((map, transaction) => {
            const current = map.get(transaction.categoryId) || {
              categoryId: transaction.categoryId,
              categoryLabel: transaction.categoryLabel,
              count: 0,
              confidenceSum: 0,
            }

            current.count += 1
            current.confidenceSum += transaction.confidence || 0
            current.categoryLabel = transaction.categoryLabel
            map.set(transaction.categoryId, current)
            return map
          }, new Map<string, { categoryId: string; categoryLabel: string; count: number; confidenceSum: number }>())
          .values(),
      )
        .sort((left, right) => {
          const genericDelta =
            Number(GENERIC_CATEGORY_IDS.has(left.categoryId)) -
            Number(GENERIC_CATEGORY_IDS.has(right.categoryId))
          if (genericDelta !== 0) {
            return genericDelta
          }

          if (right.count !== left.count) {
            return right.count - left.count
          }

          if (right.confidenceSum !== left.confidenceSum) {
            return right.confidenceSum - left.confidenceSum
          }

          return left.categoryLabel.localeCompare(right.categoryLabel, 'tr')
        })
        .map(({ confidenceSum: _confidenceSum, ...rest }) => rest)

      const suggestedCategory = categoryStats[0]
      const totalAmount = groupedTransactions.reduce(
        (sum, transaction) => sum + Math.abs(Number(transaction.amount || 0)),
        0,
      )

      return {
        id: sanitizeClusterId(normalizedKey, groupedTransactions[0].type),
        normalizedKey,
        title: toTitle(groupedTransactions),
        type: groupedTransactions[0].type,
        transactionIds: groupedTransactions.map((transaction) => transaction.id),
        transactions: groupedTransactions,
        count: groupedTransactions.length,
        totalAmount,
        sampleDescriptions: [...new Set(groupedTransactions.map((transaction) => transaction.description))].slice(0, 3),
        categories: categoryStats,
        suggestedCategoryId: suggestedCategory.categoryId,
        suggestedCategoryLabel: suggestedCategory.categoryLabel,
      } satisfies SimilarTransactionCluster
    })
    .filter((cluster): cluster is SimilarTransactionCluster => cluster !== null)
    .sort((left, right) => right.count - left.count || right.totalAmount - left.totalAmount)
}
