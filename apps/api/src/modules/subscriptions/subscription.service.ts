import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface DetectedSubscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  categoryLabel: string;
  lastPayment: Date;
  nextPayment: Date;
  isActive: boolean;
  totalSpentYear: number;
  matchSource: 'known' | 'pattern';
}

export interface SubscriptionRecord {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: string;
  categoryId: string;
  categoryLabel: string;
  isActive: boolean;
  notes?: string;
  monthlyCost: number;
  annualCost: number;
  daysUntilBilling: number;
}

export interface CreateSubscriptionDto {
  name: string;
  amount: number;
  currency?: string;
  billingCycle?: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate: string;
  categoryId?: string;
  categoryLabel?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSubscriptionDto {
  name?: string;
  amount?: number;
  currency?: string;
  billingCycle?: 'weekly' | 'monthly' | 'yearly';
  nextBillingDate?: string;
  categoryId?: string;
  categoryLabel?: string;
  notes?: string;
  isActive?: boolean;
}

export interface DismissDetectedSubscriptionDto {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextPayment: string;
  categoryLabel?: string;
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
];

const DISMISSED_DETECTION_NOTE = '[dismissed-detection]';

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
    });

    return subscriptions.map((subscription) => this.mapSavedSubscription(subscription));
  }

  async create(userId: string, dto: CreateSubscriptionDto): Promise<SubscriptionRecord> {
    this.validateSubscriptionInput(dto.name, dto.amount, dto.nextBillingDate);

    const existing = await this.findByNormalizedName(userId, dto.name);
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
    };

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
        });

    return this.mapSavedSubscription(subscription);
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto): Promise<SubscriptionRecord> {
    const existing = await this.prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
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
    });

    return this.mapSavedSubscription(updated);
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.subscription.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.delete({ where: { id } });
    return { success: true };
  }

  async getDetectedSuggestions(userId: string): Promise<DetectedSubscription[]> {
    const [savedSubscriptions, detected] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId },
        select: { name: true },
      }),
      this.detectSubscriptions(userId),
    ]);

    const savedNames = new Set(savedSubscriptions.map((subscription) => this.normalizeName(subscription.name)));
    return detected.filter((subscription) => !savedNames.has(this.normalizeName(subscription.name)));
  }

  async dismissSuggestion(
    userId: string,
    dto: DismissDetectedSubscriptionDto,
  ): Promise<{ success: boolean }> {
    this.validateSubscriptionInput(dto.name, dto.amount, dto.nextPayment);

    const existing = await this.findByNormalizedName(userId, dto.name);
    if (existing && this.isDismissedDetection(existing.notes)) {
      return { success: true };
    }

    const suggestions = await this.getDetectedSuggestions(userId);
    const detectedSuggestion = suggestions.find(
      (suggestion) => this.normalizeName(suggestion.name) === this.normalizeName(dto.name),
    );

    if (!detectedSuggestion) {
      throw new NotFoundException('Detected subscription not found');
    }

    await this.prisma.subscription.create({
      data: {
        userId,
        name: detectedSuggestion.name,
        amount: Math.abs(Number(detectedSuggestion.amount)),
        currency: 'TRY',
        billingCycle: detectedSuggestion.frequency,
        nextBillingDate: new Date(detectedSuggestion.nextPayment),
        categoryId: 'subscription',
        categoryLabel: detectedSuggestion.categoryLabel || dto.categoryLabel || 'Abonelik',
        isActive: false,
        notes: this.buildDismissedDetectionNote(),
      },
    });

    return { success: true };
  }

  async detectSubscriptions(userId: string): Promise<DetectedSubscription[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    const subscriptions: DetectedSubscription[] = [];
    const processedNames = new Set<string>();

    for (const transaction of transactions) {
      const description = transaction.description.toLowerCase();

      for (const known of KNOWN_SUBSCRIPTIONS) {
        if (processedNames.has(known.name)) {
          continue;
        }

        const matches = known.patterns.some((pattern) => description.includes(pattern));
        if (!matches) {
          continue;
        }

        const relatedTransactions = transactions.filter((candidate) =>
          known.patterns.some((pattern) => candidate.description.toLowerCase().includes(pattern)),
        );

        if (relatedTransactions.length < 2) {
          continue;
        }

        const subscription = this.analyzeSubscription(
          known.name,
          known.categoryLabel,
          relatedTransactions,
          'known',
        );

        if (subscription) {
          subscriptions.push(subscription);
          processedNames.add(known.name);
        }
      }
    }

    const unknownRecurring = this.detectUnknownRecurring(transactions);
    subscriptions.push(...unknownRecurring);

    return subscriptions.sort((left, right) => right.amount - left.amount);
  }

  async getSubscriptionSummary(userId: string) {
    const [subscriptions, detectedSuggestions] = await Promise.all([
      this.findAll(userId),
      this.getDetectedSuggestions(userId),
    ]);

    const activeSubscriptions = subscriptions.filter((subscription) => subscription.isActive);
    const totalMonthly = Number(
      activeSubscriptions.reduce((sum, subscription) => sum + subscription.monthlyCost, 0).toFixed(2),
    );
    const totalYearly = Number(
      activeSubscriptions.reduce((sum, subscription) => sum + subscription.annualCost, 0).toFixed(2),
    );

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
      }));

    const savingsOpportunities = activeSubscriptions
      .slice()
      .sort((left, right) => right.monthlyCost - left.monthlyCost)
      .slice(0, 3)
      .map((subscription) => ({
        id: subscription.id,
        name: subscription.name,
        monthlyCost: subscription.monthlyCost,
      }));

    return {
      subscriptions,
      detectedSuggestions,
      totalMonthly,
      totalYearly,
      activeCount: activeSubscriptions.length,
      upcomingPayments,
      savingsOpportunities,
    };
  }

  private analyzeSubscription(
    name: string,
    categoryLabel: string,
    transactions: Array<{ amount: number; createdAt: Date; id: string }>,
    matchSource: 'known' | 'pattern',
  ): DetectedSubscription | null {
    if (transactions.length < 2) {
      return null;
    }

    const amounts = transactions.map((transaction) => Math.abs(Number(transaction.amount)));
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const isConsistent = amounts.every(
      (amount) => Math.abs(amount - averageAmount) / averageAmount < 0.1,
    );

    if (!isConsistent) {
      return null;
    }

    const sortedDates = transactions
      .map((transaction) => new Date(transaction.createdAt).getTime())
      .sort((left, right) => right - left);

    const intervals: number[] = [];
    for (let index = 0; index < sortedDates.length - 1; index += 1) {
      intervals.push((sortedDates[index] - sortedDates[index + 1]) / (24 * 60 * 60 * 1000));
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    let frequency: 'weekly' | 'monthly' | 'yearly' = 'monthly';
    if (averageInterval <= 10) {
      frequency = 'weekly';
    } else if (averageInterval > 45) {
      frequency = 'yearly';
    }

    const lastPayment = new Date(sortedDates[0]);
    const nextPayment = new Date(lastPayment);
    if (frequency === 'weekly') {
      nextPayment.setDate(nextPayment.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    } else {
      nextPayment.setFullYear(nextPayment.getFullYear() + 1);
    }

    return {
      id: `detected-${this.normalizeName(name)}`,
      name,
      amount: Number(averageAmount.toFixed(2)),
      frequency,
      categoryLabel,
      lastPayment,
      nextPayment,
      isActive:
        Date.now() - lastPayment.getTime() < (averageInterval + 15) * 24 * 60 * 60 * 1000,
      totalSpentYear: Number(
        transactions.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0).toFixed(2),
      ),
      matchSource,
    };
  }

  private detectUnknownRecurring(
    transactions: Array<{
      description: string;
      amount: number;
      createdAt: Date;
      id: string;
    }>,
  ): DetectedSubscription[] {
    const groups = new Map<string, typeof transactions>();

    for (const transaction of transactions) {
      const normalized = transaction.description
        .toLowerCase()
        .replace(/[0-9]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (normalized.length < 3) {
        continue;
      }

      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)!.push(transaction);
    }

    const recurring: DetectedSubscription[] = [];

    for (const [description, groupedTransactions] of groups.entries()) {
      if (groupedTransactions.length < 3) {
        continue;
      }

      const subscription = this.analyzeSubscription(
        this.capitalizeFirst(description),
        'Recurring Payment',
        groupedTransactions,
        'pattern',
      );

      if (subscription?.isActive) {
        recurring.push(subscription);
      }
    }

    return recurring;
  }

  private mapSavedSubscription(subscription: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    billingCycle: string;
    nextBillingDate: Date;
    categoryId: string;
    categoryLabel: string;
    isActive: boolean;
    notes: string | null;
  }): SubscriptionRecord {
    const billingCycle = this.normalizeFrequency(subscription.billingCycle);
    const monthlyCost = this.toMonthlyCost(Math.abs(Number(subscription.amount)), billingCycle);
    const annualCost = Number((monthlyCost * 12).toFixed(2));
    const daysUntilBilling = Math.max(
      0,
      Math.ceil((subscription.nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );

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
    };
  }

  private validateSubscriptionInput(name: string, amount: number, nextBillingDate: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Subscription name is required');
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new BadRequestException('Subscription amount must be greater than 0');
    }

    const date = new Date(nextBillingDate);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Subscription next billing date is invalid');
    }
  }

  private normalizeFrequency(value: string): 'weekly' | 'monthly' | 'yearly' {
    if (value === 'weekly' || value === 'monthly' || value === 'yearly') {
      return value;
    }
    return 'monthly';
  }

  private toMonthlyCost(amount: number, billingCycle: 'weekly' | 'monthly' | 'yearly') {
    if (billingCycle === 'weekly') {
      return Number((amount * 4).toFixed(2));
    }
    if (billingCycle === 'yearly') {
      return Number((amount / 12).toFixed(2));
    }
    return Number(amount.toFixed(2));
  }

  private normalizeName(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private capitalizeFirst(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private async findByNormalizedName(userId: string, name: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        notes: true,
      },
    });

    return subscriptions.find(
      (subscription) => this.normalizeName(subscription.name) === this.normalizeName(name),
    );
  }

  private isDismissedDetection(notes?: string | null) {
    return notes?.startsWith(DISMISSED_DETECTION_NOTE) ?? false;
  }

  private buildDismissedDetectionNote(existingNotes?: string | null) {
    const trimmed = existingNotes?.trim();
    if (!trimmed) {
      return DISMISSED_DETECTION_NOTE;
    }

    if (this.isDismissedDetection(trimmed)) {
      return trimmed;
    }

    return `${DISMISSED_DETECTION_NOTE} ${trimmed}`;
  }
}
