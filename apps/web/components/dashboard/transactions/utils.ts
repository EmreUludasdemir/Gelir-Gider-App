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
    salary: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    freelance: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    investment: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
    bank_fees: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
    market: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    restaurant: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    transport: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    subscription: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20',
    utilities: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
    health: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
    shopping: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    education: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-500/10 dark:text-lime-400 dark:border-lime-500/20',
    entertainment: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20',
    rent: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    transfer: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
    atm: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
    insurance: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    other: 'bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
  }
  return colors[categoryId] || 'bg-muted/80 text-muted-foreground border-border/40'
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
