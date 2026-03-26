import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../../prisma.service'
import { SubscriptionService } from './subscription.service'
import { createMockPrismaService } from '../../../test/test-utils'

describe('SubscriptionService', () => {
  let service: SubscriptionService
  let prisma: ReturnType<typeof createMockPrismaService>

  const userId = 'user-123'

  const createExpenseTransaction = (overrides: Partial<{ id: string; description: string; amount: number; createdAt: Date }> = {}) => ({
    id: overrides.id || `tx-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    description: overrides.description || 'Test transaction',
    amount: overrides.amount ?? 99.99,
    createdAt: overrides.createdAt || new Date('2026-03-10T00:00:00.000Z'),
  })

  const createSavedSubscription = (overrides: Partial<{
    id: string
    name: string
    amount: number
    currency: string
    billingCycle: 'weekly' | 'monthly' | 'yearly'
    nextBillingDate: Date
    categoryId: string
    categoryLabel: string
    isActive: boolean
    notes: string | null
  }> = {}) => ({
    id: overrides.id || 'sub-1',
    userId,
    name: overrides.name || 'Netflix',
    amount: overrides.amount ?? 199.99,
    currency: overrides.currency || 'TRY',
    billingCycle: overrides.billingCycle || 'monthly',
    nextBillingDate: overrides.nextBillingDate || new Date('2026-03-15T00:00:00.000Z'),
    categoryId: overrides.categoryId || 'subscription',
    categoryLabel: overrides.categoryLabel || 'Abonelik',
    isActive: overrides.isActive ?? true,
    notes: overrides.notes ?? null,
  })

  const createDetectedSubscription = (overrides: Partial<{
    id: string
    name: string
    amount: number
    frequency: 'weekly' | 'monthly' | 'yearly'
    categoryLabel: string
    lastPayment: Date
    nextPayment: Date
    isActive: boolean
    totalSpentYear: number
    matchSource: 'known' | 'pattern'
    confidenceScore: number
    reasonCodes: string[]
  }> = {}) => ({
    id: overrides.id || 'detected-spotify',
    name: overrides.name || 'Spotify',
    amount: overrides.amount ?? 59.99,
    frequency: overrides.frequency || 'monthly',
    categoryLabel: overrides.categoryLabel || 'Entertainment',
    lastPayment: overrides.lastPayment || new Date('2026-02-11T00:00:00.000Z'),
    nextPayment: overrides.nextPayment || new Date('2026-03-11T00:00:00.000Z'),
    isActive: overrides.isActive ?? true,
    totalSpentYear: overrides.totalSpentYear ?? 719.88,
    matchSource: overrides.matchSource || 'known',
    confidenceScore: overrides.confidenceScore ?? 88,
    reasonCodes: overrides.reasonCodes || ['known_merchant_match', 'cadence_stable'],
  })

  beforeEach(async () => {
    prisma = createMockPrismaService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<SubscriptionService>(SubscriptionService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('detectSubscriptions', () => {
    it('detects known monthly subscriptions', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        createExpenseTransaction({ description: 'Netflix Odeme', amount: 199.99, createdAt: new Date('2026-03-10T00:00:00.000Z') }),
        createExpenseTransaction({ description: 'Netflix Odeme', amount: 199.99, createdAt: new Date('2026-02-10T00:00:00.000Z') }),
        createExpenseTransaction({ description: 'Netflix Odeme', amount: 199.99, createdAt: new Date('2026-01-10T00:00:00.000Z') }),
      ])

      const result = await service.detectSubscriptions(userId)

      const netflix = result.find((subscription) => subscription.name === 'Netflix')

      expect(netflix).toMatchObject({
        name: 'Netflix',
        frequency: 'monthly',
        categoryLabel: 'Entertainment',
        matchSource: 'known',
      })
    })

    it('detects recurring unknown payments with stable amounts', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        createExpenseTransaction({ description: 'Acme Workspace', amount: 150, createdAt: new Date('2026-03-08T00:00:00.000Z') }),
        createExpenseTransaction({ description: 'Acme Workspace', amount: 150, createdAt: new Date('2026-02-08T00:00:00.000Z') }),
        createExpenseTransaction({ description: 'Acme Workspace', amount: 150, createdAt: new Date('2026-01-08T00:00:00.000Z') }),
      ])

      const result = await service.detectSubscriptions(userId)

      expect(result[0]).toMatchObject({
        name: 'Acme workspace',
        matchSource: 'pattern',
        isActive: true,
      })
    })

    it('ignores recurring names when amounts are inconsistent', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        createExpenseTransaction({ description: 'Netflix', amount: 99.99, createdAt: new Date('2026-03-01T00:00:00.000Z') }),
        createExpenseTransaction({ description: 'Netflix', amount: 49.99, createdAt: new Date('2026-02-01T00:00:00.000Z') }),
      ])

      const result = await service.detectSubscriptions(userId)

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('creates a subscription with sane defaults', async () => {
      prisma.subscription.findMany.mockResolvedValue([])
      prisma.subscription.create.mockResolvedValue(createSavedSubscription())

      const result = await service.create(userId, {
        name: ' Netflix ',
        amount: 199.99,
        nextBillingDate: '2026-03-15',
      })

      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: 'Netflix',
          amount: 199.99,
          currency: 'TRY',
          billingCycle: 'monthly',
          categoryId: 'subscription',
          categoryLabel: 'Abonelik',
          isActive: true,
        }),
      })
      expect(result.name).toBe('Netflix')
      expect(result.monthlyCost).toBe(199.99)
    })

    it('reactivates a previously dismissed suggestion instead of creating a duplicate', async () => {
      prisma.subscription.findMany.mockResolvedValue([
        { id: 'sub-dismissed', name: 'Spotify', notes: '[dismissed-detection]' },
      ])
      prisma.subscription.update.mockResolvedValue(
        createSavedSubscription({
          id: 'sub-dismissed',
          name: 'Spotify',
          amount: 59.99,
          notes: null,
        }),
      )

      const result = await service.create(userId, {
        name: 'Spotify',
        amount: 59.99,
        nextBillingDate: '2026-04-11',
      })

      expect(prisma.subscription.create).not.toHaveBeenCalled()
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-dismissed' },
        data: expect.objectContaining({
          name: 'Spotify',
          amount: 59.99,
          isActive: true,
          notes: null,
        }),
      })
      expect(result.id).toBe('sub-dismissed')
    })

    it('rejects invalid input', async () => {
      await expect(
        service.create(userId, {
          name: '',
          amount: 0,
          nextBillingDate: 'invalid-date',
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('updates an existing subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(createSavedSubscription())
      prisma.subscription.update.mockResolvedValue(
        createSavedSubscription({ name: 'Spotify', amount: 59.99, isActive: false }),
      )

      const result = await service.update(userId, 'sub-1', {
        name: 'Spotify',
        amount: 59.99,
        isActive: false,
      })

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          name: 'Spotify',
          amount: 59.99,
          isActive: false,
        }),
      })
      expect(result.name).toBe('Spotify')
      expect(result.isActive).toBe(false)
    })

    it('throws when subscription does not exist', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null)

      await expect(service.update(userId, 'missing', { isActive: false })).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('deletes an existing subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({ id: 'sub-1' })
      prisma.subscription.delete.mockResolvedValue(createSavedSubscription())

      const result = await service.remove(userId, 'sub-1')

      expect(prisma.subscription.delete).toHaveBeenCalledWith({ where: { id: 'sub-1' } })
      expect(result).toEqual({ success: true })
    })
  })

  describe('dismissSuggestion', () => {
    it('stores a dismissed suggestion as hidden inactive state', async () => {
      const detectSpy = jest.spyOn(service, 'detectSubscriptions').mockResolvedValue([
        createDetectedSubscription(),
      ])

      prisma.subscription.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      prisma.subscriptionDetectionFeedback.upsert.mockResolvedValue({
        id: 'feedback-1',
        userId,
        fingerprint: 'spotify-monthly-59.99-entertainment',
        status: 'rejected',
        detectedSubscriptionId: 'detected-spotify',
        reasonCodes: JSON.stringify(['known_merchant_match', 'cadence_stable']),
        metadata: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      prisma.subscription.create.mockResolvedValue(
        createSavedSubscription({
          id: 'sub-dismissed',
          name: 'Spotify',
          amount: 59.99,
          isActive: false,
          notes: '[dismissed-detection]',
        }),
      )

      const result = await service.dismissSuggestion(userId, {
        name: 'Spotify',
        amount: 59.99,
        frequency: 'monthly',
        nextPayment: '2026-04-11',
        categoryLabel: 'Abonelik',
      })

      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: 'Spotify',
          amount: 59.99,
          billingCycle: 'monthly',
          isActive: false,
          notes: '[dismissed-detection]',
        }),
      })
      expect(result).toEqual({ success: true })
      expect(prisma.subscriptionDetectionFeedback.upsert).toHaveBeenCalled()

      detectSpy.mockRestore()
    })

    it('rejects dismiss requests when the subscription is not currently detected', async () => {
      const detectSpy = jest.spyOn(service, 'detectSubscriptions').mockResolvedValue([])

      prisma.subscription.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      await expect(
        service.dismissSuggestion(userId, {
          name: 'Spotify Premium',
          amount: 59.99,
          frequency: 'monthly',
          nextPayment: '2026-04-11',
        }),
      ).rejects.toThrow(NotFoundException)

      expect(prisma.subscription.create).not.toHaveBeenCalled()
      expect(prisma.subscription.update).not.toHaveBeenCalled()

      detectSpy.mockRestore()
    })
  })

  describe('getSubscriptionSummary', () => {
    it('returns totals, upcoming payments, and filtered detected suggestions', async () => {
      const detectSpy = jest.spyOn(service, 'detectSubscriptions').mockResolvedValue([
        createDetectedSubscription(),
      ])

      prisma.subscription.findMany
        .mockResolvedValueOnce([
          createSavedSubscription({ name: 'Netflix', amount: 199.99 }),
          createSavedSubscription({ id: 'sub-2', name: 'Adobe CC', amount: 399.99, categoryLabel: 'Work' }),
        ])
        .mockResolvedValueOnce([{ name: 'Netflix' }, { name: 'Adobe CC' }])

      const result = await service.getSubscriptionSummary(userId)

      expect(result.totalMonthly).toBeCloseTo(599.98)
      expect(result.totalYearly).toBeCloseTo(7199.76)
      expect(result.activeCount).toBe(2)
      expect(result.upcomingPayments).toHaveLength(2)
      expect(result.detectedSuggestions).toHaveLength(1)
      expect(result.detectedSuggestions[0].name).toBe('Spotify')
      expect(result.detectedSuggestions[0].confidenceScore).toBe(88)
      expect(result.savingsOpportunities[0].name).toBe('Adobe CC')

      detectSpy.mockRestore()
    })

    it('returns empty totals when there are no subscriptions', async () => {
      const detectSpy = jest.spyOn(service, 'detectSubscriptions').mockResolvedValue([])

      prisma.subscription.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await service.getSubscriptionSummary(userId)

      expect(result).toMatchObject({
        subscriptions: [],
        detectedSuggestions: [],
        totalMonthly: 0,
        totalYearly: 0,
        activeCount: 0,
      })
      expect(result.upcomingPayments).toEqual([])
      expect(result.savingsOpportunities).toEqual([])

      detectSpy.mockRestore()
    })

    it('hides dismissed suggestion stubs from the visible subscription list', async () => {
      const detectSpy = jest.spyOn(service, 'detectSubscriptions').mockResolvedValue([])

      prisma.subscription.findMany
        .mockResolvedValueOnce([
          createSavedSubscription({ name: 'Netflix' }),
        ])
        .mockResolvedValueOnce([
          { name: 'Netflix' },
          { name: 'Spotify' },
        ])

      const result = await service.getSubscriptionSummary(userId)

      expect(result.subscriptions).toHaveLength(1)
      expect(result.subscriptions[0].name).toBe('Netflix')

      detectSpy.mockRestore()
    })
  })

  describe('submitDetectedFeedback', () => {
    it('persists confirmed feedback using detection fingerprint', async () => {
      const detectSpy = jest
        .spyOn(service as any, 'buildDetectedSubscriptions')
        .mockResolvedValue([createDetectedSubscription()])

      prisma.subscriptionDetectionFeedback.upsert.mockResolvedValue({
        id: 'feedback-1',
        userId,
        fingerprint: 'spotify-monthly-59.99-entertainment',
        status: 'confirmed',
        detectedSubscriptionId: 'detected-spotify',
        reasonCodes: JSON.stringify(['known_merchant_match']),
        metadata: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.submitDetectedFeedback(userId, 'detected-spotify', {
        status: 'confirmed',
        reasonCodes: ['known_merchant_match'],
      })

      expect(prisma.subscriptionDetectionFeedback.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId,
            detectedSubscriptionId: 'detected-spotify',
            status: 'confirmed',
          }),
          update: expect.objectContaining({
            status: 'confirmed',
          }),
        }),
      )
      expect(result).toEqual({
        success: true,
        fingerprint: 'spotify',
        status: 'confirmed',
      })

      detectSpy.mockRestore()
    })
  })
})
