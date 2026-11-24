import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PdfBatchWorkbench } from '../PdfBatchWorkbench'
import { previewPdfImportBatch, type UploadPreview } from '@/lib/api'

const statement: UploadPreview = {
  success: true,
  filename: 'ekstre.pdf',
  fileHash: 'same-statement',
  fileSize: 1024,
  totalParsed: 1,
  lowConfidenceCount: 1,
  errors: [],
  transactions: [{
    id: 'statement-row',
    date: '2026-10-02',
    description: 'Test işlemi',
    amount: 75,
    currency: 'TRY',
    type: 'expense',
    categoryId: 'market',
    categoryLabel: 'Market',
    confidence: 65,
    tags: [],
  }],
}

const previousStatement: UploadPreview = {
  ...statement,
  fileHash: 'previously-imported',
  duplicate: true,
}

function mockPreviews(...previews: UploadPreview[]) {
  const fetchMock = jest.fn()
  for (const preview of previews) {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => preview })
  }
  global.fetch = fetchMock
}

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  localStorage.clear()
})

it('explains both kinds of duplicate and submits only the first copy', async () => {
  const filenames = ['ekstre.pdf', 'ekstre-kopya.pdf', 'eski-ekstre.pdf']
  mockPreviews(statement, statement, previousStatement)
  const batch = await previewPdfImportBatch(filenames.map((name) => new File(['%PDF-1.4'], name)))
  const onConfirm = jest.fn().mockResolvedValue(undefined)

  expect(batch).toMatchObject({
    totalFiles: 3,
    actionableFiles: 1,
    duplicateFiles: 2,
    errorFiles: 0,
    totalParsed: 1,
    totalLowConfidenceCount: 1,
  })
  render(<PdfBatchWorkbench batch={batch} language="tr" onConfirm={onConfirm} onDiscard={jest.fn()} />)

  fireEvent.click(screen.getByRole('button', { name: /eski-ekstre\.pdf/ }))
  expect(screen.getByText('Bu ekstre daha önce içe aktarıldı.')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: /ekstre-kopya\.pdf/ }))
  expect(screen.getByText('Bu dosyanın ilk kopyası kuyrukta: ekstre.pdf.')).toBeVisible()
  expect(screen.queryByRole('checkbox', { name: /import anyway/i })).toBeNull()
  expect(screen.getByText('1 dosya · 1 satir kayda hazir')).toBeVisible()

  const confirm = screen.getByTestId('pdf-import-confirm')
  fireEvent.click(confirm)
  await waitFor(() => expect(confirm).toBeEnabled())
  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(onConfirm).toHaveBeenCalledWith([expect.objectContaining({
    filename: filenames[0],
    fileHash: statement.fileHash,
    transactions: statement.transactions,
  })])
})

it('disables confirmation when all files were already imported', async () => {
  mockPreviews(previousStatement)
  const batch = await previewPdfImportBatch([new File(['%PDF-1.4'], 'eski-ekstre.pdf')])
  const onConfirm = jest.fn()

  render(<PdfBatchWorkbench batch={batch} language="en" onConfirm={onConfirm} onDiscard={jest.fn()} />)

  const confirm = screen.getByTestId('pdf-import-confirm')
  expect(confirm).toBeDisabled()
  expect(screen.getByText('This statement has already been imported.')).toBeVisible()
  expect(screen.getByText('There are no files left to save.')).toBeVisible()
  fireEvent.click(confirm)
  expect(onConfirm).not.toHaveBeenCalled()
})
