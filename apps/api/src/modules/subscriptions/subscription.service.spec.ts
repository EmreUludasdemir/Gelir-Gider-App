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

  describe('getSubscriptionSummary', () => {
    it('returns totals, upcoming payments, and filtered detected suggestions', async () => {
      const detectSpy = jest.spyOn(service, 'detectSubscriptions').mockResolvedValue([
        {
          id: 'detected-spotify',
          name: 'Spotify',
          amount: 59.99,
          frequency: 'monthly',
          categoryLabel: 'Entertainment',
          lastPayment: new Date('2026-02-11T00:00:00.000Z'),
          nextPayment: new Date('2026-03-11T00:00:00.000Z'),
          isActive: true,
          totalSpentYear: 719.88,
          matchSource: 'known',
        },
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
  })
})
