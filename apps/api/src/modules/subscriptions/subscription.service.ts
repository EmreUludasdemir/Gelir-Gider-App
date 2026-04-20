import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'

export interface DetectedSubscription {
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
}

export interface SubscriptionRecord {
  id: string
  name: string
  amount: number
  currency: string
  billingCycle: 'weekly' | 'monthly' | 'yearly'
  nextBillingDate: string
  categoryId: string
  categoryLabel: string
  isActive: boolean
  notes?: string
  monthlyCost: number
  annualCost: number
  daysUntilBilling: number
}

export interface CreateSubscriptionDto {
  name: string
  amount: number
  currency?: string
  billingCycle?: 'weekly' | 'monthly' | 'yearly'
  nextBillingDate: string
  categoryId?: string
  categoryLabel?: string
  notes?: string
  isActive?: boolean
}

export interface UpdateSubscriptionDto {
  name?: string
  amount?: number
  currency?: string
  billingCycle?: 'weekly' | 'monthly' | 'yearly'
  nextBillingDate?: string
  categoryId?: string
  categoryLabel?: string
  notes?: string
  isActive?: boolean
}

export interface DismissDetectedSubscriptionDto {
  name: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  nextPayment: string
  categoryLabel?: string
}

export interface SubscriptionFeedbackDto {
  status: 'confirmed' | 'rejected'
  reasonCodes?: string[]
  note?: string
}

interface DetectionTransaction {
  id: string
  description: string
  amount: number
  createdAt: Date
}

interface StoredDetectionFeedback {
  fingerprint: string
  status: 'confirmed' | 'rejected'
  reasonCodes: string[]
}

const KNOWN_SUBSCRIPTIONS = [
  { patterns: ['netflix'], name: 'Netflix', categoryLabel: 'Entertainment' },
  { patterns: ['spotify'], name: 'Spotify', categoryLabel: 'Entertainment' },
  { patterns: ['youtube premium', 'youtube music'], name: 'YouTube Premium', categoryLabel: 'Entertainment' },
  { patterns: ['amazon prime'], name: 'Amazon Prime', categoryLabel: 'Entertainment' },
  { patterns: ['disney+', 'disney plus'], name: 'Disney+', categoryLabel: 'Entertainment' },
  { patterns: ['apple music', 'icloud', 'apple one'], name: 'Apple Services', categoryLabel: 'Technology' },
  { patterns: ['google one', 'google storage'], name: 'Google One', categoryLabel: 'Technology' },
  { patterns: ['microsoft 365', 'office 365'], name: 'Microsoft 365', categoryLabel: 'Work' },
  { patterns: ['adobe', 'creative cloud'], name: 'Adobe CC', categoryLabel: 'Work' },
  { patterns: ['chatgpt', 'openai'], name: 'ChatGPT Plus', categoryLabel: 'Technology' },
  { patterns: ['github'], name: 'GitHub', categoryLabel: 'Technology' },
  { patterns: ['linkedin premium'], name: 'LinkedIn Premium', categoryLabel: 'Work' },
  { patterns: ['gym', 'fitness', 'spor salonu'], name: 'Gym Membership', categoryLabel: 'Health' },
  { patterns: ['turkcell', 'vodafone', 'turk telekom'], name: 'Mobile Plan', categoryLabel: 'Utilities' },
  { patterns: ['exxen', 'gain', 'blutv', 'puhutv'], name: 'Digital TV', categoryLabel: 'Entertainment' },
]

const DISMISSED_DETECTION_NOTE = '[dismissed-detection]'
const MIN_PATTERN_CONFIDENCE = 68
const MIN_KNOWN_CONFIDENCE = 58

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<SubscriptionRecord[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        NOT: {
          notes: {
            startsWith: DISMISSED_DETECTION_NOTE,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { nextBillingDate: 'asc' }],
    })

    return subscriptions.map((subscription) => this.mapSavedSubscription(subscription))
  }

  async create(userId: string, dto: CreateSubscriptionDto): Promise<SubscriptionRecord> {
    this.validateSubscriptionInput(dto.name, dto.amount, dto.nextBillingDate)

    const existing = await this.findByNormalizedName(userId, dto.name)
    const data = {
      userId,
      name: dto.name.trim(),
      amount: Math.abs(Number(dto.amount)),
      currency: dto.currency || 'TRY',
      billingCycle: dto.billingCycle || 'monthly',
      nextBillingDate: new Date(dto.nextBillingDate),
      categoryId: dto.categoryId || 'subscription',
      categoryLabel: dto.categoryLabel || 'Abonelik',
      isActive: dto.isActive ?? true,
      notes: dto.notes?.trim() || null,
    }

    const subscription = existing
      ? await this.prisma.subscription.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            amount: data.amount,
            currency: data.currency,
            billingCycle: data.billingCycle,
            nextBillingDate: data.nextBillingDate,
            categoryId: data.categoryId,
            categoryLabel: data.categoryLabel,
            isActive: data.isActive,
            notes: data.notes,
          },
        })
      : await this.prisma.subscription.create({
          data,
        })

    return this.mapSavedSubscription(subscription)
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto): Promise<SubscriptionRecord> {
    const existing = await this.prisma.subscription.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      throw new NotFoundException('Subscription not found')
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        amount: dto.amount !== undefined ? Math.abs(Number(dto.amount)) : undefined,
        currency: dto.currency,
        billingCycle: dto.billingCycle,
        nextBillingDate: dto.nextBillingDate ? new Date(dto.nextBillingDate) : undefined,
        categoryId: dto.categoryId,
        categoryLabel: dto.categoryLabel,
        isActive: dto.isActive,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
      },
    })

    return this.mapSavedSubscription(updated)
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.subscription.findFirst({
      where: { id, userId },
      select: { id: true },
    })

    if (!existing) {
      throw new NotFoundException('Subscription not found')
    }

    await this.prisma.subscription.delete({ where: { id } })
    return { success: true }
  }

  async getDetectedSuggestions(userId: string): Promise<DetectedSubscription[]> {
    const [savedSubscriptions, detected] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId },
        select: { name: true },
      }),
      this.detectSubscriptions(userId),
    ])

    const savedNames = new Set(savedSubscriptions.map((subscription) => this.normalizeName(subscription.name)))
    return detected.filter((subscription) => !savedNames.has(this.normalizeName(subscription.name)))
  }

  async dismissSuggestion(
    userId: string,
    dto: DismissDetectedSubscriptionDto,
  ): Promise<{ success: boolean }> {
    this.validateSubscriptionInput(dto.name, dto.amount, dto.nextPayment)

    const existing = await this.findByNormalizedName(userId, dto.name)
    if (existing && this.isDismissedDetection(existing.notes)) {
      return { success: true }
    }

    const suggestion = await this.findDetectedSuggestionByName(userId, dto.name)
    if (!suggestion) {
      throw new NotFoundException('Detected subscription not found')
    }

    await this.upsertFeedback(userId, suggestion, {
      status: 'rejected',
      reasonCodes: suggestion.reasonCodes,
    })

    if (!existing) {
      await this.prisma.subscription.create({
        data: {
          userId,
          name: suggestion.name,
          amount: Math.abs(Number(suggestion.amount)),
          currency: 'TRY',
          billingCycle: suggestion.frequency,
          nextBillingDate: new Date(suggestion.nextPayment),
          categoryId: 'subscription',
          categoryLabel: suggestion.categoryLabel || dto.categoryLabel || 'Abonelik',
          isActive: false,
          notes: this.buildDismissedDetectionNote(),
        },
      })
    }

    return { success: true }
  }

  async submitDetectedFeedback(
    userId: string,
    detectedId: string,
    dto: SubscriptionFeedbackDto,
  ): Promise<{ success: boolean; fingerprint: string; status: 'confirmed' | 'rejected' }> {
    if (dto.status !== 'confirmed' && dto.status !== 'rejected') {
      throw new BadRequestException('Feedback status is invalid')
    }

    const detected = await this.findDetectedSuggestionById(userId, detectedId)
    const fingerprint = detected ? this.extractFingerprint(detected.id) : this.extractFingerprint(detectedId)
    const reasonCodes = Array.from(new Set([...(detected?.reasonCodes || []), ...(dto.reasonCodes || [])]))

    await this.prisma.subscriptionDetectionFeedback.upsert({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint,
        },
      },
      create: {
        userId,
        fingerprint,
        status: dto.status,
        detectedSubscriptionId: detectedId,
        reasonCodes: JSON.stringify(reasonCodes),
        metadata: JSON.stringify({
          note: dto.note || null,
          name: detected?.name || null,
          amount: detected?.amount || null,
          frequency: detected?.frequency || null,
        }),
      },
      update: {
        status: dto.status,
        detectedSubscriptionId: detectedId,
        reasonCodes: JSON.stringify(reasonCodes),
        metadata: JSON.stringify({
          note: dto.note || null,
          name: detected?.name || null,
          amount: detected?.amount || null,
          frequency: detected?.frequency || null,
        }),
      },
    })

    return {
      success: true,
      fingerprint,
      status: dto.status,
    }
  }

  async detectSubscriptions(userId: string): Promise<DetectedSubscription[]> {
    return this.buildDetectedSubscriptions(userId, { includeRejected: false })
  }

  async getSubscriptionSummary(userId: string) {
    const [subscriptions, detectedSuggestions] = await Promise.all([
      this.findAll(userId),
      this.getDetectedSuggestions(userId),
    ])

    const activeSubscriptions = subscriptions.filter((subscription) => subscription.isActive)
    const totalMonthly = Number(
      activeSubscriptions.reduce((sum, subscription) => sum + subscription.monthlyCost, 0).toFixed(2),
    )
    const totalYearly = Number(
      activeSubscriptions.reduce((sum, subscription) => sum + subscription.annualCost, 0).toFixed(2),
    )

    const upcomingPayments = activeSubscriptions
      .slice()
      .sort(
        (left, right) =>
          new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime(),
      )
      .slice(0, 5)
      .map((subscription) => ({
        id: subscription.id,
        name: subscription.name,
        amount: subscription.amount,
        currency: subscription.currency,
        date: subscription.nextBillingDate,
      }))

    const savingsOpportunities = activeSubscriptions
      .slice()
      .sort((left, right) => right.monthlyCost - left.monthlyCost)
      .slice(0, 3)
      .map((subscription) => ({
        id: subscription.id,
        name: subscription.name,
        monthlyCost: subscription.monthlyCost,
      }))

    return {
      subscriptions,
      detectedSuggestions,
      totalMonthly,
      totalYearly,
      activeCount: activeSubscriptions.length,
      upcomingPayments,
      savingsOpportunities,
    }
  }

  private async buildDetectedSubscriptions(
    userId: string,
    options: { includeRejected: boolean },
  ): Promise<DetectedSubscription[]> {
    const [transactions, feedbacks] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscriptionDetectionFeedback.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    const feedbackMap = new Map<string, StoredDetectionFeedback>(
      feedbacks.map((feedback) => [
        feedback.fingerprint,
        {
          fingerprint: feedback.fingerprint,
          status: feedback.status as 'confirmed' | 'rejected',
          reasonCodes: this.parseReasonCodes(feedback.reasonCodes),
        },
      ]),
    )

    const detected: DetectedSubscription[] = []
    const processedNames = new Set<string>()

    for (const transaction of transactions) {
      const description = transaction.description.toLowerCase()

      for (const known of KNOWN_SUBSCRIPTIONS) {
        if (processedNames.has(known.name)) {
          continue
        }

        const matches = known.patterns.some((pattern) => description.includes(pattern))
        if (!matches) {
          continue
        }

        const relatedTransactions = transactions.filter((candidate) =>
          known.patterns.some((pattern) => candidate.description.toLowerCase().includes(pattern)),
        )

        if (relatedTransactions.length < 2) {
          continue
        }

        const subscription = this.analyzeSubscription(
          known.name,
          known.categoryLabel,
          relatedTransactions,
          'known',
        )

        if (!subscription || subscription.confidenceScore < MIN_KNOWN_CONFIDENCE) {
          continue
        }

        const applied = this.applyFeedback(subscription, feedbackMap.get(this.extractFingerprint(subscription.id)))
        if (applied) {
          detected.push(applied)
          processedNames.add(known.name)
        }
      }
    }

    const unknownRecurring = this.detectUnknownRecurring(transactions)
      .map((subscription) => this.applyFeedback(subscription, feedbackMap.get(this.extractFingerprint(subscription.id))))
      .filter((subscription): subscription is DetectedSubscription => Boolean(subscription))

    detected.push(...unknownRecurring)

    return detected
      .filter((subscription) => options.includeRejected || !subscription.reasonCodes.includes('user_rejected_history'))
      .sort((left, right) => {
        if (right.confidenceScore !== left.confidenceScore) {
          return right.confidenceScore - left.confidenceScore
        }

        return right.amount - left.amount
      })
  }

  private analyzeSubscription(
    name: string,
    categoryLabel: string,
    transactions: DetectionTransaction[],
    matchSource: 'known' | 'pattern',
  ): DetectedSubscription | null {
    if (transactions.length < 2) {
      return null
    }

    const amounts = transactions.map((transaction) => Math.abs(Number(transaction.amount)))
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    if (!Number.isFinite(averageAmount) || averageAmount <= 0) {
      return null
    }

    const sortedDates = transactions
      .map((transaction) => new Date(transaction.createdAt).getTime())
      .sort((left, right) => right - left)

    const intervals: number[] = []
    for (let index = 0; index < sortedDates.length - 1; index += 1) {
      intervals.push((sortedDates[index] - sortedDates[index + 1]) / (24 * 60 * 60 * 1000))
    }

    const averageInterval = intervals.length > 0
      ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      : 30
    const frequency = this.detectFrequency(averageInterval)
    const expectedInterval = this.getExpectedInterval(frequency)
    const cadenceVariance = intervals.length > 1 ? this.standardDeviation(intervals) : Math.abs(averageInterval - expectedInterval)
    const amountVariance = averageAmount > 0 ? this.standardDeviation(amounts) / averageAmount : 1
    const merchantSimilarity = this.calculateMerchantSimilarity(transactions.map((transaction) => transaction.description))
    const frequencyStability = this.calculateFrequencyStability(intervals, expectedInterval)

    const cadenceScore = this.toUnitScore(cadenceVariance, Math.max(expectedInterval * 0.25, 3))
    const amountScore = this.toUnitScore(amountVariance, 0.24)
    if (amountVariance > 0.22) {
      return null
    }

    const confidenceBase =
      cadenceScore * 0.3 +
      amountScore * 0.3 +
      merchantSimilarity * 0.2 +
      frequencyStability * 0.2

    let confidenceScore = Math.round(confidenceBase * 100)
    if (matchSource === 'known') confidenceScore += 8
    if (transactions.length >= 3) confidenceScore += 6

    const lastPayment = new Date(sortedDates[0])
    const nextPayment = new Date(lastPayment)
    if (frequency === 'weekly') {
      nextPayment.setDate(nextPayment.getDate() + 7)
    } else if (frequency === 'monthly') {
      nextPayment.setMonth(nextPayment.getMonth() + 1)
    } else {
      nextPayment.setFullYear(nextPayment.getFullYear() + 1)
    }

    const activityGraceDays = this.getActivityGraceDays(frequency, cadenceVariance)
    const isActive =
      Date.now() <= nextPayment.getTime() + activityGraceDays * 24 * 60 * 60 * 1000
    if (!isActive) confidenceScore -= 10

    confidenceScore = Math.max(35, Math.min(99, confidenceScore))

    const reasonCodes = ['recurring_pattern_detected']
    if (matchSource === 'known') reasonCodes.push('known_merchant_match')
    if (transactions.length >= 3) reasonCodes.push('frequency_history_strong')
    if (amountVariance <= 0.08) reasonCodes.push('amount_consistent')
    if (cadenceVariance <= Math.max(expectedInterval * 0.18, 3)) reasonCodes.push('cadence_stable')
    if (merchantSimilarity >= 0.7) reasonCodes.push('merchant_similarity_high')
    if (frequencyStability >= 0.7) reasonCodes.push('frequency_stable')
    if (isActive) reasonCodes.push('active_recently')

    const fingerprint = this.buildDetectionFingerprint(name, frequency, averageAmount, categoryLabel)

    return {
      id: `detected-${fingerprint}`,
      name,
      amount: Number(averageAmount.toFixed(2)),
      frequency,
      categoryLabel,
      lastPayment,
      nextPayment,
      isActive,
      totalSpentYear: Number(
        transactions.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0).toFixed(2),
      ),
      matchSource,
      confidenceScore,
      reasonCodes: Array.from(new Set(reasonCodes)),
    }
  }

  private detectUnknownRecurring(transactions: DetectionTransaction[]): DetectedSubscription[] {
    const groups = new Map<string, DetectionTransaction[]>()

    for (const transaction of transactions) {
      const normalized = this.normalizeMerchantKey(transaction.description)
      if (normalized.length < 3) {
        continue
      }

      if (!groups.has(normalized)) {
        groups.set(normalized, [])
      }
      groups.get(normalized)!.push(transaction)
    }

    const recurring: DetectedSubscription[] = []

    for (const [description, groupedTransactions] of groups.entries()) {
      if (groupedTransactions.length < 3) {
        continue
      }

      const subscription = this.analyzeSubscription(
        this.capitalizeFirst(description),
        'Recurring Payment',
        groupedTransactions,
        'pattern',
      )

      if (subscription && subscription.isActive && subscription.confidenceScore >= MIN_PATTERN_CONFIDENCE) {
        recurring.push(subscription)
      }
    }

    return recurring
  }

  private applyFeedback(
    subscription: DetectedSubscription,
    feedback?: StoredDetectionFeedback,
  ): DetectedSubscription | null {
    if (!feedback) {
      return subscription
    }

    if (feedback.status === 'rejected') {
      return {
        ...subscription,
        confidenceScore: Math.max(25, subscription.confidenceScore - 25),
        reasonCodes: Array.from(new Set([...subscription.reasonCodes, ...feedback.reasonCodes, 'user_rejected_history'])),
      }
    }

    return {
      ...subscription,
      confidenceScore: Math.min(99, subscription.confidenceScore + 12),
      reasonCodes: Array.from(new Set([...subscription.reasonCodes, ...feedback.reasonCodes, 'user_confirmed_history'])),
    }
  }

  private mapSavedSubscription(subscription: {
    id: string
    name: string
    amount: number
    currency: string
    billingCycle: string
    nextBillingDate: Date
    categoryId: string
    categoryLabel: string
    isActive: boolean
    notes: string | null
  }): SubscriptionRecord {
    const billingCycle = this.normalizeFrequency(subscription.billingCycle)
    const monthlyCost = this.toMonthlyCost(Math.abs(Number(subscription.amount)), billingCycle)
    const annualCost = Number((monthlyCost * 12).toFixed(2))
    const daysUntilBilling = Math.max(
      0,
      Math.ceil((subscription.nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    )

    return {
      id: subscription.id,
      name: subscription.name,
      amount: Math.abs(Number(subscription.amount)),
      currency: subscription.currency,
      billingCycle,
      nextBillingDate: subscription.nextBillingDate.toISOString(),
      categoryId: subscription.categoryId,
      categoryLabel: subscription.categoryLabel,
      isActive: subscription.isActive,
      notes: subscription.notes || undefined,
      monthlyCost,
      annualCost,
      daysUntilBilling,
    }
  }

  private validateSubscriptionInput(name: string, amount: number, nextBillingDate: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Subscription name is required')
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new BadRequestException('Subscription amount must be greater than 0')
    }

    const date = new Date(nextBillingDate)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Subscription next billing date is invalid')
    }
  }

  private normalizeFrequency(value: string): 'weekly' | 'monthly' | 'yearly' {
    if (value === 'weekly' || value === 'monthly' || value === 'yearly') {
      return value
    }

    return 'monthly'
  }

  private toMonthlyCost(amount: number, billingCycle: 'weekly' | 'monthly' | 'yearly') {
    if (billingCycle === 'weekly') {
      return Number((amount * 4).toFixed(2))
    }
    if (billingCycle === 'yearly') {
      return Number((amount / 12).toFixed(2))
    }
    return Number(amount.toFixed(2))
  }

  private normalizeName(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private normalizeMerchantKey(value: string) {
    return value
      .toLowerCase()
      .replace(/[0-9]/g, '')
      .replace(/[^a-zA-Z\s+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private capitalizeFirst(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  private detectFrequency(averageInterval: number): 'weekly' | 'monthly' | 'yearly' {
    if (averageInterval <= 10) {
      return 'weekly'
    }
    if (averageInterval > 60) {
      return 'yearly'
    }
    return 'monthly'
  }

  private getExpectedInterval(frequency: 'weekly' | 'monthly' | 'yearly') {
    if (frequency === 'weekly') return 7
    if (frequency === 'yearly') return 365
    return 30
  }

  private getActivityGraceDays(
    frequency: 'weekly' | 'monthly' | 'yearly',
    cadenceVariance: number,
  ) {
    const baseGraceDays = frequency === 'weekly' ? 4 : frequency === 'yearly' ? 45 : 14
    const varianceBuffer = Math.max(0, Math.round(cadenceVariance))
    const maxVarianceBuffer = frequency === 'weekly' ? 3 : frequency === 'yearly' ? 30 : 10

    return baseGraceDays + Math.min(varianceBuffer, maxVarianceBuffer)
  }

  private standardDeviation(values: number[]) {
    if (values.length <= 1) {
      return 0
    }

    const average = values.reduce((sum, value) => sum + value, 0) / values.length
    const variance =
      values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
    return Math.sqrt(variance)
  }

  private calculateMerchantSimilarity(descriptions: string[]) {
    if (descriptions.length <= 1) {
      return 1
    }

    const normalizedDescriptions = descriptions.map((description) =>
      this.normalizeMerchantKey(description).split(' ').filter(Boolean),
    )

    let pairCount = 0
    let similaritySum = 0

    for (let left = 0; left < normalizedDescriptions.length; left += 1) {
      for (let right = left + 1; right < normalizedDescriptions.length; right += 1) {
        const leftSet = new Set(normalizedDescriptions[left])
        const rightSet = new Set(normalizedDescriptions[right])
        const intersection = Array.from(leftSet).filter((token) => rightSet.has(token)).length
        const union = new Set([...leftSet, ...rightSet]).size || 1
        similaritySum += intersection / union
        pairCount += 1
      }
    }

    return pairCount > 0 ? similaritySum / pairCount : 1
  }

  private calculateFrequencyStability(intervals: number[], expectedInterval: number) {
    if (intervals.length === 0) {
      return expectedInterval === 30 ? 0.75 : 0.65
    }

    const averageDeviation =
      intervals.reduce((sum, interval) => sum + Math.abs(interval - expectedInterval), 0) /
      intervals.length

    return this.toUnitScore(averageDeviation, Math.max(expectedInterval * 0.3, 4))
  }

  private toUnitScore(value: number, tolerance: number) {
    if (!Number.isFinite(value)) {
      return 0
    }

    return Math.max(0, Math.min(1, 1 - value / Math.max(tolerance, 0.0001)))
  }

  private buildDetectionFingerprint(
    name: string,
    frequency: 'weekly' | 'monthly' | 'yearly',
    amount: number,
    categoryLabel: string,
  ) {
    return `${this.normalizeName(name)}-${frequency}-${Number(amount).toFixed(2)}-${this.normalizeName(categoryLabel)}`
  }

  private extractFingerprint(detectedId: string) {
    return detectedId.startsWith('detected-') ? detectedId.slice('detected-'.length) : detectedId
  }

  private parseReasonCodes(reasonCodes?: string | null) {
    if (!reasonCodes) {
      return []
    }

    try {
      const parsed = JSON.parse(reasonCodes)
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
    } catch {
      return []
    }
  }

  private async findByNormalizedName(userId: string, name: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        notes: true,
      },
    })

    return subscriptions.find(
      (subscription) => this.normalizeName(subscription.name) === this.normalizeName(name),
    )
  }

  private async findDetectedSuggestionByName(userId: string, name: string) {
    const suggestions = await this.getDetectedSuggestions(userId)
    return suggestions.find(
      (suggestion) => this.normalizeName(suggestion.name) === this.normalizeName(name),
    )
  }

  private async findDetectedSuggestionById(userId: string, detectedId: string) {
    const suggestions = await this.buildDetectedSubscriptions(userId, { includeRejected: true })
    return suggestions.find((suggestion) => suggestion.id === detectedId)
  }

  private async upsertFeedback(
    userId: string,
    suggestion: DetectedSubscription,
    dto: SubscriptionFeedbackDto,
  ) {
    const reasonCodes = Array.from(new Set([...(suggestion.reasonCodes || []), ...(dto.reasonCodes || [])]))
    const fingerprint = this.extractFingerprint(suggestion.id)

    await this.prisma.subscriptionDetectionFeedback.upsert({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint,
        },
      },
      create: {
        userId,
        fingerprint,
        status: dto.status,
        detectedSubscriptionId: suggestion.id,
        reasonCodes: JSON.stringify(reasonCodes),
        metadata: JSON.stringify({
          note: dto.note || null,
          name: suggestion.name,
          amount: suggestion.amount,
          frequency: suggestion.frequency,
        }),
      },
      update: {
        status: dto.status,
        detectedSubscriptionId: suggestion.id,
        reasonCodes: JSON.stringify(reasonCodes),
        metadata: JSON.stringify({
          note: dto.note || null,
          name: suggestion.name,
          amount: suggestion.amount,
          frequency: suggestion.frequency,
        }),
      },
    })
  }

  private isDismissedDetection(notes?: string | null) {
    return notes?.startsWith(DISMISSED_DETECTION_NOTE) ?? false
  }

  private buildDismissedDetectionNote(existingNotes?: string | null) {
    const trimmed = existingNotes?.trim()
    if (!trimmed) {
      return DISMISSED_DETECTION_NOTE
    }

    if (this.isDismissedDetection(trimmed)) {
      return trimmed
    }

    return `${DISMISSED_DETECTION_NOTE} ${trimmed}`
  }
}
