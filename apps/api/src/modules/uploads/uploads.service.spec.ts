import { UploadsService } from './uploads.service'
import { createMockCacheService, createMockPrismaService } from '../../../test/test-utils'

describe('UploadsService', () => {
  let service: UploadsService
  let prisma: ReturnType<typeof createMockPrismaService>
  let cache: ReturnType<typeof createMockCacheService>
  let autoCategorizer: {
    categorize: jest.Mock
  }

  const mockFile = {
    originalname: 'mart-ekstre.pdf',
    size: 4096,
    buffer: Buffer.from('%PDF-1.4 fake pdf'),
  } as Express.Multer.File

  beforeEach(() => {
    prisma = createMockPrismaService()
    cache = createMockCacheService()
    autoCategorizer = {
      categorize: jest.fn().mockResolvedValue({
        categoryId: 'market',
        categoryLabel: 'Market',
        confidence: 82,
      }),
    }

    service = new UploadsService(prisma as never, cache as never, autoCategorizer as never)
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should mark duplicate previews without calling the parser', async () => {
    prisma.pdfUpload.findFirst.mockResolvedValue({
      uploadedAt: new Date('2026-03-10T10:00:00.000Z'),
      filename: 'mart-ekstre.pdf',
    })
    const fetchSpy = jest.spyOn(global, 'fetch')

    const result = await service.previewPdf('user-123', mockFile)

    expect(result.duplicate).toBe(true)
    expect(result.success).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should return a graceful preview failure when the parser is unavailable', async () => {
    prisma.pdfUpload.findFirst.mockResolvedValue(null)
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('fetch failed'))

    const result = await service.previewPdf('user-123', mockFile)

    expect(result.success).toBe(false)
    expect(result.duplicate).toBeUndefined()
    expect(result.transactions).toEqual([])
    expect(result.errors[0]).toContain('PDF Parser service is not available')
  })

  it('should reject confirm requests for files that became duplicate after preview', async () => {
    prisma.pdfUpload.findFirst.mockResolvedValue({
      uploadedAt: new Date('2026-03-10T10:00:00.000Z'),
      filename: 'mart-ekstre.pdf',
    })

    const result = await service.confirmPdfUpload('user-123', {
      filename: 'mart-ekstre.pdf',
      fileHash: 'file-hash',
      fileSize: 4096,
      totalParsed: 1,
      transactions: [
        {
          id: 'preview-1',
          date: '2026-03-09T12:00:00.000Z',
          description: 'Migros Market',
          amount: 540,
          currency: 'TRY',
          type: 'expense',
          categoryId: 'market',
          categoryLabel: 'Market',
          confidence: 82,
          tags: ['pdf-upload'],
        },
      ],
    })

    expect(result.success).toBe(false)
    expect(result.duplicate).toBe(true)
    expect(prisma.transaction.create).not.toHaveBeenCalled()
  })

  it('should report partial save failures and still persist successful rows', async () => {
    prisma.pdfUpload.findFirst.mockResolvedValue(null)
    prisma.transaction.create
      .mockResolvedValueOnce({
        id: 'tx-1',
        userId: 'user-123',
        accountId: 'pdf-upload',
        date: new Date('2026-03-09T12:00:00.000Z'),
        description: 'Migros Market',
        amount: 540,
        currency: 'TRY',
        source: 'pdf',
        type: 'expense',
        categoryId: 'market',
        categoryLabel: 'Market',
        confidence: 55,
        tags: JSON.stringify(['pdf-upload']),
        notes: 'Parsed from mart-ekstre.pdf',
        createdAt: new Date('2026-03-09T12:00:00.000Z'),
        updatedAt: new Date('2026-03-09T12:00:00.000Z'),
      })
      .mockRejectedValueOnce(new Error('DB write failed'))
    prisma.pdfUpload.create.mockResolvedValue({
      id: 'upload-1',
    })

    const result = await service.confirmPdfUpload('user-123', {
      filename: 'mart-ekstre.pdf',
      fileHash: 'file-hash',
      fileSize: 4096,
      totalParsed: 2,
      transactions: [
        {
          id: 'preview-1',
          date: '2026-03-09T12:00:00.000Z',
          description: 'Migros Market',
          amount: 540,
          currency: 'TRY',
          type: 'expense',
          categoryId: 'market',
          categoryLabel: 'Market',
          confidence: 55,
          tags: ['pdf-upload'],
        },
        {
          id: 'preview-2',
          date: '2026-03-09T14:00:00.000Z',
          description: 'Shell',
          amount: 880,
          currency: 'TRY',
          type: 'expense',
          categoryId: 'transport',
          categoryLabel: 'Ulasim',
          confidence: 81,
          tags: ['pdf-upload'],
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.totalSaved).toBe(1)
    expect(result.errors).toContain('Transaction 2: DB write failed')
    expect(prisma.pdfUpload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalSaved: 1,
          lowConfidenceCount: 1,
        }),
      }),
    )
    expect(cache.invalidateTransactions).toHaveBeenCalledWith('user-123')
  })

  it('should invalidate transaction cache after a successful confirm', async () => {
    prisma.pdfUpload.findFirst.mockResolvedValue(null)
    prisma.transaction.create.mockResolvedValue({
      id: 'tx-1',
      userId: 'user-123',
      accountId: 'pdf-upload',
      date: new Date('2026-03-09T12:00:00.000Z'),
      description: 'Freelance Odemesi',
      amount: 12000,
      currency: 'TRY',
      source: 'pdf',
      type: 'income',
      categoryId: 'salary',
      categoryLabel: 'Maas',
      confidence: 94,
      tags: JSON.stringify(['pdf-upload']),
      notes: 'Parsed from mart-ekstre.pdf',
      createdAt: new Date('2026-03-09T12:00:00.000Z'),
      updatedAt: new Date('2026-03-09T12:00:00.000Z'),
    })
    prisma.pdfUpload.create.mockResolvedValue({
      id: 'upload-2',
    })

    const result = await service.confirmPdfUpload('user-123', {
      filename: 'mart-ekstre.pdf',
      fileHash: 'file-hash',
      fileSize: 4096,
      totalParsed: 1,
      transactions: [
        {
          id: 'preview-1',
          date: '2026-03-09T12:00:00.000Z',
          description: 'Freelance Odemesi',
          amount: 12000,
          currency: 'TRY',
          type: 'income',
          categoryId: 'salary',
          categoryLabel: 'Maas',
          confidence: 94,
          tags: ['pdf-upload'],
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.totalSaved).toBe(1)
    expect(cache.invalidateTransactions).toHaveBeenCalledWith('user-123')
  })
})
