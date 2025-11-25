import { Transaction } from './api'
import { formatDate, formatCurrency } from './utils'

export function exportToCSV(transactions: Transaction[], filename: string = 'transactions.csv') {
  // CSV Headers
  const headers = [
    'Tarih',
    'Açıklama',
    'Tutar',
    'Para Birimi',
    'Tip',
    'Kategori',
    'Kaynak',
    'Güven',
    'Notlar',
  ]

  // CSV Rows
  const rows = transactions.map(tx => [
    formatDate(tx.date),
    `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes
    tx.amount.toString(),
    tx.currency,
    tx.type === 'income' ? 'Gelir' : 'Gider',
    tx.categoryLabel,
    tx.source === 'pdf' ? 'PDF' : 'Manuel',
    `${tx.confidence}%`,
    tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '',
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // Trigger download
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToJSON(transactions: Transaction[], filename: string = 'transactions.json') {
  const jsonContent = JSON.stringify(transactions, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })

  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
