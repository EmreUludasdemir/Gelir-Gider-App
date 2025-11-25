'use client'

import { useState } from 'react'
import { Transaction } from '@/lib/api'
import { exportToCSV, exportToJSON } from '@/lib/export'
import { Button } from './Button'

interface ExportButtonProps {
  transactions: Transaction[]
  filename?: string
}

export function ExportButton({ transactions, filename }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = (format: 'csv' | 'json') => {
    const date = new Date().toISOString().split('T')[0]
    const defaultFilename = filename || `transactions-${date}`

    if (format === 'csv') {
      exportToCSV(transactions, `${defaultFilename}.csv`)
    } else {
      exportToJSON(transactions, `${defaultFilename}.json`)
    }

    setShowMenu(false)
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setShowMenu(!showMenu)}
      >
        📥 Dışa Aktar
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg"
            >
              📊 CSV Format
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg"
            >
              📄 JSON Format
            </button>
          </div>
        </>
      )}
    </div>
  )
}
