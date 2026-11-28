import { BadRequestException, Logger } from '@nestjs/common'
import { UploadsService, type ConfirmPdfUploadDto } from './uploads.service'
import { createMockCacheService, createMockPrismaService } from '../../../test/test-utils'

describe('UploadsService', () => {
  let service: UploadsService
  let prisma: ReturnType<typeof createMockPrismaService>
  let cache: ReturnType<typeof createMockCacheService>
  let redis: {
    del: jest.Mock
  }
  let autoCategorizer: {
    categorize: jest.Mock
  }
  let realtime: {
    notifyNewTransaction: jest.Mock
    notifyReviewRequested: jest.Mock
  }

  const mockFile = {
    originalname: 'mart-ekstre.pdf',
    size: 4096,
    buffer: Buffer.from('%PDF-1.4 fake pdf'),
  } as Express.Multer.File

  const confirmation: ConfirmPdfUploadDto = {
    filename: 'mart-ekstre.pdf',
    fileHash: 'file-hash',
    fileSize: 4096,
    totalParsed: 1,
    transactions: [{
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
    }],
  }

  beforeEach(() => {
    prisma = createMockPrismaService()
    prisma.$transaction.mockImplementation((operations) => Promise.all(operations))
    cache = createMockCacheService()
    redis = {
      del: jest.fn().mockResolvedValue(undefined),
    }
    autoCategorizer = {
      categorize: jest.fn().mockResolvedValue({
        categoryId: 'market',
        categoryLabel: 'Market',
        confidence: 82,
      }),
    }
    realtime = {
      notifyNewTransaction: jest.fn(),
      notifyReviewRequested: jest.fn(),
    }

    jest.restoreAllMocks()
    jest.spyOn(Logger.prototype, 'error').mockImplementation()
    jest.spyOn(Logger.prototype, 'warn').mockImplementation()
    service = new UploadsService(prisma as never, cache as never, redis as never, realtime as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should mark duplicate previews without calling the parser', async () => {
    prisma.pdfUpload.findFirst.mockResolvedValue({
      uploadedAt: new Date('2026-03-10T10:00:00.000Z'),
      filename: 'mart-ekstre.pdf',
    })
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        transactions: [],
        totalParsed: 0,
        errors: [],
      }),
    }
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never)

    const result = await service.previewPdf('user-123', mockFile)

    expect(result.duplicate).toBe(true)
    expect(result.success).toBe(true)
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('should return a graceful preview failure when the parser is unavailable', async () => {
    prisma.pdfUpload.findFirst.mockResolvedValue(null)
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('fetch failed'))

    const result = await service.previewPdf('user-123', mockFile)

    expect(result.success).toBe(false)
    expect(result.duplicate).toBeUndefined()
    expect(result.transactions).toEqual([])
    expect(result.errors[0]).toContain('PDF parser servisine su anda ulasilamiyor')
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

  it('should report row validation errors and commit the valid rows with the PDF record', async () => {
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
          date: 'invalid-date',
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
    expect(result.errors).toContain('Transaction 2: Transaction date is invalid')
    expect(prisma.transaction.create).toHaveBeenCalledTimes(1)
    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.pdfUpload.create.mock.results[0].value,
      prisma.transaction.create.mock.results[0].value,
    ])
    expect(prisma.pdfUpload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalSaved: 1,
          lowConfidenceCount: 1,
        }),
      }),
    )
    expect(cache.invalidateTransactions).toHaveBeenCalledWith('user-123')
    expect(redis.del).toHaveBeenCalledWith('analytics:action-feed:user-123')
    expect(redis.del).toHaveBeenCalledWith('analytics:savings-actions:user-123')
    expect(realtime.notifyNewTransaction).toHaveBeenCalledTimes(1)
    expect(realtime.notifyReviewRequested).not.toHaveBeenCalled()
  })

  it('should leave an entirely invalid statement editable without creating a PDF record', async () => {
    const invalid = {
      ...confirmation,
      transactions: [{ ...confirmation.transactions[0], description: ' ' }],
    }
    await expect(service.confirmPdfUpload('user-123', invalid)).rejects.toThrow(BadRequestException)
    expect(prisma.pdfUpload.create).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('should fail the confirmation and skip side effects if a write fails', async () => {
    prisma.transaction.create.mockRejectedValueOnce(new Error('DB write failed'))

    await expect(service.confirmPdfUpload('user-123', confirmation)).rejects.toMatchObject({ code: 'DB_003' })
    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.pdfUpload.create.mock.results[0].value,
      prisma.transaction.create.mock.results[0].value,
    ])
    expect(realtime.notifyNewTransaction).not.toHaveBeenCalled()
    expect(cache.invalidateTransactions).not.toHaveBeenCalled()
    expect(redis.del).not.toHaveBeenCalled()
  })

  it('should return the existing duplicate response when another confirmation wins the race', async () => {
    prisma.pdfUpload.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ uploadedAt: new Date('2026-03-10T10:00:00Z'), filename: 'other.pdf' })
    prisma.pdfUpload.create.mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
    )

    await expect(service.confirmPdfUpload('user-123', confirmation)).resolves.toMatchObject({
      success: false,
      duplicate: true,
      totalSaved: 0,
    })
    expect(prisma.pdfUpload.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: 'user-123', fileHash: confirmation.fileHash } }),
    )
    expect(realtime.notifyNewTransaction).not.toHaveBeenCalled()
    expect(cache.invalidateTransactions).not.toHaveBeenCalled()
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
    expect(redis.del).toHaveBeenCalledWith('analytics:action-feed:user-123')
    expect(redis.del).toHaveBeenCalledWith('analytics:savings-actions:user-123')
    expect(realtime.notifyNewTransaction).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({
        id: 'tx-1',
        description: 'Freelance Odemesi',
        amount: 12000,
        type: 'income',
        categoryLabel: 'Maas',
      }),
    )
    expect(realtime.notifyReviewRequested).not.toHaveBeenCalled()
  })

  it('should return committed rows even when notification or cache updates fail', async () => {
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
      tags: '{broken-json}',
      notes: 'Parsed from mart-ekstre.pdf',
      createdAt: new Date('2026-03-09T12:00:00.000Z'),
      updatedAt: new Date('2026-03-09T12:00:00.000Z'),
    })
    prisma.pdfUpload.create.mockResolvedValue({
      id: 'upload-3',
    })

    realtime.notifyNewTransaction.mockImplementation(() => { throw new Error('Unavailable') })
    cache.invalidateTransactions.mockRejectedValueOnce(new Error('Unavailable'))

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
    expect(result.transactions[0]?.tags).toEqual([])
    expect(redis.del).toHaveBeenCalledTimes(2)
    expect(Logger.prototype.warn).toHaveBeenCalledTimes(2)
  })
})
