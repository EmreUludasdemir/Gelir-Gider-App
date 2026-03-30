import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { v4 as uuidv4 } from "uuid";
import {
  TransactionEntity,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQuery,
  DashboardSummary,
  DuplicateGroup,
  Suggestion,
  RecurringPayment,
  CashFlowForecast,
  CashFlowForecastEvent,
  CategorySummary,
  WeeklyData,
  Currency,
  TransactionSource,
  TransactionType,
  PrismaTransaction,
} from "../../shared/types";
import { classifyTransaction } from "../../shared/categories";
import { PrismaService } from "../../prisma.service";
import { CacheService, CachePrefix, CacheTTL } from "../../shared/cache";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { AutoCategorizerService } from "../ai/auto-categorizer.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly realtime: RealtimeGateway,
    private readonly autoCategorizer: AutoCategorizerService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}

  async findAll(
    userId: string,
    query?: TransactionQuery
  ): Promise<TransactionEntity[]> {
    // Generate cache key based on query
    const queryHash = query ? this.cache.hashQuery(query) : "all";
    const cacheKey = this.cache.buildKey(
      CachePrefix.TRANSACTION_LIST,
      userId,
      queryHash
    );

    // Try cache first
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const visibilityScope = await this.buildTransactionVisibilityScope(userId);
        const where: Prisma.TransactionWhereInput = this.mergeTransactionWhere(
          visibilityScope,
          {}
        );

        if (query) {
          if (query.type) where.type = query.type;
          if (query.categoryId) where.categoryId = query.categoryId;
          if (query.source) where.source = query.source;

          // Build date filter properly
          const dateFilter: Prisma.DateTimeFilter = {};
          if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
          if (query.dateTo) dateFilter.lte = new Date(query.dateTo);
          if (Object.keys(dateFilter).length > 0) where.date = dateFilter;

          if (query.search) {
            where.OR = [
              { description: { contains: query.search } },
              { categoryLabel: { contains: query.search } },
            ];
          }
        }

        const transactions = await this.prisma.transaction.findMany({
          where,
          orderBy: query?.sortBy
            ? { [query.sortBy]: query.sortOrder || "desc" }
            : { date: "desc" },
          take: query?.limit,
          skip: query?.offset,
        });

        return this.withActorNames(
          transactions.map((transaction) => this.mapToEntity(transaction))
        );
      },
      CacheTTL.MEDIUM
    );
  }

  async findOne(userId: string, id: string): Promise<TransactionEntity> {
    const transaction = await this.prisma.transaction.findFirst({
      where: this.mergeTransactionWhere(
        await this.buildTransactionVisibilityScope(userId),
        { id }
      ),
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const [entity] = await this.withActorNames([this.mapToEntity(transaction)]);
    return entity;
  }

  async create(
    userId: string,
    dto: CreateTransactionDto
  ): Promise<TransactionEntity> {
    // Auto-classify if category not provided
    let categoryId = dto.categoryId;
    let categoryLabel = dto.categoryLabel;
    let confidence = 100;

    if (!categoryId || !categoryLabel) {
      const classification = await this.resolveCategory(
        dto.description,
        dto.type,
        userId
      );
      categoryId = classification.categoryId;
      categoryLabel = classification.categoryLabel;
      confidence = classification.confidence;
    }

    const householdContext = await this.resolveHouseholdContext(userId, confidence);

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        accountId: "default", // TODO: Add account support
        date: new Date(dto.date),
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || "TRY",
        source: "manual",
        type: dto.type,
        categoryId: categoryId!,
        categoryLabel: categoryLabel!,
        confidence,
        tags: JSON.stringify(dto.tags || []),
        notes: dto.notes,
        householdId: householdContext.householdId,
        ownerUserId: householdContext.ownerUserId,
        reviewerUserId: householdContext.reviewerUserId,
        needsReview: householdContext.needsReview,
      },
    });

    // Invalidate transaction caches
    await this.cache.invalidateTransactions(userId);
    this.logger.debug(
      `Transaction created, cache invalidated for user ${userId}`,
      {
        context: "TransactionsService",
      }
    );

    const [entity] = await this.withActorNames([this.mapToEntity(transaction)]);

    // Notify via WebSocket
    this.realtime.notifyNewTransaction(userId, {
      id: entity.id,
      description: entity.description,
      amount: entity.amount,
      type: entity.type as "income" | "expense",
      categoryLabel: entity.categoryLabel,
    });

    this.notifyReviewIfNeeded(entity);

    return entity;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto
  ): Promise<TransactionEntity> {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const data: Prisma.TransactionUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.categoryLabel !== undefined) data.categoryLabel = dto.categoryLabel;
    if (dto.tags !== undefined) data.tags = JSON.stringify(dto.tags);
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.transaction.update({
      where: { id },
      data,
    });

    // Invalidate transaction caches
    await this.cache.invalidateTransactions(userId);
    this.logger.debug(
      `Transaction updated, cache invalidated for user ${userId}`,
      {
        context: "TransactionsService",
      }
    );

    const [entity] = await this.withActorNames([this.mapToEntity(updated)]);

    // Notify via WebSocket
    this.realtime.notifyTransactionUpdated(userId, {
      id: entity.id,
      description: entity.description,
      amount: entity.amount,
      type: entity.type as "income" | "expense",
      categoryLabel: entity.categoryLabel,
    });

    return entity;
  }

  async bulkCategorize(
    userId: string,
    transactionIds: string[],
    categoryId: string,
    categoryLabel: string,
    options?: { applyToSimilar?: boolean }
  ): Promise<{ updated: number; matchedSimilar: number }> {
    return this.bulkUpdate(userId, {
      transactionIds,
      categoryId,
      categoryLabel,
      applyToSimilar: options?.applyToSimilar,
    });
  }

  async bulkUpdate(
    userId: string,
    payload: {
      transactionIds: string[];
      categoryId?: string;
      categoryLabel?: string;
      type?: TransactionType;
      tags?: string[];
      applyToSimilar?: boolean;
    }
  ): Promise<{ updated: number; matchedSimilar: number }> {
    const uniqueIds = [...new Set(payload.transactionIds.filter(Boolean))];
    const hasCategoryUpdate =
      payload.categoryId !== undefined || payload.categoryLabel !== undefined;
    const hasTypeUpdate = payload.type !== undefined;
    const hasTagsUpdate = payload.tags !== undefined;

    if (uniqueIds.length === 0) {
      throw new BadRequestException("En az 1 islem secilmeli");
    }

    if (!hasCategoryUpdate && !hasTypeUpdate && !hasTagsUpdate) {
      throw new BadRequestException("Toplu guncelleme icin en az bir alan secilmeli");
    }

    if (
      hasCategoryUpdate &&
      (!payload.categoryId?.trim() || !payload.categoryLabel?.trim())
    ) {
      throw new BadRequestException("Kategori bilgisi zorunlu");
    }

    if (
      hasTypeUpdate &&
      payload.type !== "income" &&
      payload.type !== "expense"
    ) {
      throw new BadRequestException("Gecersiz islem tipi");
    }

    if (hasTagsUpdate && !Array.isArray(payload.tags)) {
      throw new BadRequestException("Etiketler dizi olmalidir");
    }

    const tags = hasTagsUpdate ? this.normalizeTags(payload.tags || []) : undefined;
    const targetTransactions = await this.resolveBulkTargetTransactions(
      userId,
      uniqueIds,
      payload.applyToSimilar
    );
    const targetIds = [...new Set(targetTransactions.map((transaction) => transaction.id))];
    const data: Prisma.TransactionUpdateManyMutationInput = {};

    if (hasCategoryUpdate) {
      data.categoryId = payload.categoryId!.trim();
      data.categoryLabel = payload.categoryLabel!.trim();
    }

    if (hasTypeUpdate) {
      data.type = payload.type;
    }

    if (hasTagsUpdate) {
      data.tags = JSON.stringify(tags);
    }

    const result = await this.prisma.transaction.updateMany({
      where: {
        userId,
        id: { in: targetIds },
      },
      data,
    });

    await this.cache.invalidateTransactions(userId);
    this.logger.debug(
      `Transactions bulk updated, cache invalidated for user ${userId}`,
      {
        context: "TransactionsService",
      }
    );

    targetTransactions.forEach((transaction) =>
      this.realtime.notifyTransactionUpdated(userId, {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: (payload.type ?? transaction.type) as "income" | "expense",
        categoryLabel: payload.categoryLabel?.trim() || transaction.categoryLabel,
      })
    );

    return {
      updated: result.count,
      matchedSimilar: Math.max(0, targetIds.length - uniqueIds.length),
    };
  }

  async delete(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    await this.prisma.transaction.delete({ where: { id } });

    // Invalidate transaction caches
    await this.cache.invalidateTransactions(userId);
    this.logger.debug(
      `Transaction deleted, cache invalidated for user ${userId}`,
      {
        context: "TransactionsService",
      }
    );

    // Notify via WebSocket
    this.realtime.notifyTransactionDeleted(userId, id);

    return { success: true };
  }

  async getSummary(
    userId: string,
    query?: TransactionQuery
  ): Promise<DashboardSummary> {
    // Build cache key based on query parameters
    const queryHash = query ? this.cache.hashQuery(query) : "default";
    const cacheKey = this.cache.buildKey(
      CachePrefix.TRANSACTION_SUMMARY,
      userId,
      queryHash
    );

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const anchorDate = await this.resolveSummaryAnchorDate(userId, query);
        const currentMonth = anchorDate.getMonth();
        const currentYear = anchorDate.getFullYear();

        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(
          currentYear,
          currentMonth + 1,
          0,
          23,
          59,
          59
        );

        const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // Fetch current and previous month transactions
        const [currentTransactions, prevTransactions] = await Promise.all([
          this.prisma.transaction.findMany({
            where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
          }),
          this.prisma.transaction.findMany({
            where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
          }),
        ]);

        // Calculate totals
        const totals = {
          income: 0,
          expense: 0,
          balance: 0,
          transactionCount: currentTransactions.length,
        };

        currentTransactions.forEach((tx) => {
          if (tx.type === "income") totals.income += Math.abs(tx.amount);
          else totals.expense += Math.abs(tx.amount);
        });

        totals.balance = totals.income - totals.expense;

        // Previous month totals
        const prevTotals = { income: 0, expense: 0 };
        prevTransactions.forEach((tx) => {
          if (tx.type === "income") prevTotals.income += Math.abs(tx.amount);
          else prevTotals.expense += Math.abs(tx.amount);
        });

        // Comparison
        const comparison = {
          previousMonth: prevTotals,
          changePercentage: {
            income:
              prevTotals.income > 0
                ? ((totals.income - prevTotals.income) / prevTotals.income) *
                  100
                : 0,
            expense:
              prevTotals.expense > 0
                ? ((totals.expense - prevTotals.expense) / prevTotals.expense) *
                  100
                : 0,
          },
        };

        // Top categories (Expense)
        const categoryMap = new Map<
          string,
          { total: number; count: number; label: string }
        >();
        currentTransactions
          .filter((tx) => tx.type === "expense")
          .forEach((tx) => {
            const existing = categoryMap.get(tx.categoryId) || {
              total: 0,
              count: 0,
              label: tx.categoryLabel,
            };
            existing.total += Math.abs(tx.amount);
            existing.count += 1;
            categoryMap.set(tx.categoryId, existing);
          });

        const topCategories: CategorySummary[] = Array.from(
          categoryMap.entries()
        )
          .map(([categoryId, data]) => ({
            categoryId,
            categoryLabel: data.label,
            total: data.total,
            percentage:
              totals.expense > 0 ? (data.total / totals.expense) * 100 : 0,
            transactionCount: data.count,
            trend: "stable" as const,
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        // Weekly trend
        const weeklyTrend: WeeklyData[] = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(anchorDate);
          weekStart.setDate(anchorDate.getDate() - (i + 1) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);

          const weekTransactions = await this.prisma.transaction.findMany({
            where: { userId, date: { gte: weekStart, lte: weekEnd } },
          });

          let weekIncome = 0,
            weekExpense = 0;
          weekTransactions.forEach((tx) => {
            if (tx.type === "income") weekIncome += Math.abs(tx.amount);
            else weekExpense += Math.abs(tx.amount);
          });

          weeklyTrend.push({
            week: `Week ${4 - i}`,
            income: weekIncome,
            expense: weekExpense,
          });
        }

        return {
          period: {
            month: startOfMonth.toLocaleString("tr-TR", { month: "long" }),
            year: currentYear,
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString(),
          },
          totals,
          comparison,
          topCategories,
          weeklyTrend,
          recurringPayments: await this.getRecurringPayments(userId),
        };
      },
      CacheTTL.SHORT // 1 minute TTL for dashboard - data changes frequently
    );
  }

  async getSuggestions(userId: string): Promise<Suggestion[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, confidence: { lt: 60 } },
      take: 10,
    });

    return transactions.map((tx) => ({
      id: uuidv4(),
      transactionId: tx.id,
      description: tx.description,
      amount: tx.amount,
      currency: tx.currency as Currency,
      currentCategory: tx.categoryLabel,
      suggestedCategories: [
        { categoryId: "other", categoryLabel: "Diğer", confidence: 30 },
      ],
      createdAt: new Date().toISOString(),
    }));
  }

  async getRecurringPayments(userId: string): Promise<RecurringPayment[]> {
    const [subscriptions, bills] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId, isActive: true },
      }),
      this.prisma.bill.findMany({
        where: { userId, isPaid: false, frequency: { not: "once" } },
      }),
    ]);

    const recurring: RecurringPayment[] = [];

    subscriptions.forEach((sub) => {
      const frequency = this.normalizeFrequency(sub.billingCycle);
      const nextDate = sub.nextBillingDate;
      const lastDate = this.subtractFrequency(nextDate, frequency);

      recurring.push({
        id: `sub-${sub.id}`,
        description: sub.name,
        amount: Math.abs(sub.amount),
        currency: sub.currency as Currency,
        frequency,
        categoryLabel: sub.categoryLabel,
        lastDate: lastDate.toISOString(),
        nextDate: nextDate.toISOString(),
        isActive: sub.isActive,
      });
    });

    bills.forEach((bill) => {
      const frequency = this.normalizeFrequency(bill.frequency);
      const nextDate = bill.dueDate;
      const lastDate = this.subtractFrequency(nextDate, frequency);

      recurring.push({
        id: `bill-${bill.id}`,
        description: bill.name,
        amount: Math.abs(bill.amount),
        currency: bill.currency as Currency,
        frequency,
        categoryLabel: bill.categoryLabel,
        lastDate: lastDate.toISOString(),
        nextDate: nextDate.toISOString(),
        isActive: !bill.isPaid,
      });
    });

    return recurring
      .sort(
        (a, b) =>
          new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime()
      )
      .slice(0, 5);
  }

  async getCashFlowForecast(
    userId: string,
    days: number = 30
  ): Promise<CashFlowForecast> {
    const horizonDays = Number.isFinite(days) && days > 0 ? Math.min(days, 90) : 30;
    const now = new Date();
    const horizonEnd = new Date(now);
    horizonEnd.setDate(horizonEnd.getDate() + horizonDays);
    const recentStart = new Date(now);
    recentStart.setDate(recentStart.getDate() - 29);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [recentTransactions, monthTransactions, upcomingBills, upcomingSubscriptions] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where: { userId, date: { gte: recentStart, lte: now } },
        }),
        this.prisma.transaction.findMany({
          where: { userId, date: { gte: startOfMonth, lte: now } },
        }),
        this.prisma.bill.findMany({
          where: {
            userId,
            isPaid: false,
            dueDate: { gte: now, lte: horizonEnd },
          },
          orderBy: { dueDate: "asc" },
        }),
        this.prisma.subscription.findMany({
          where: {
            userId,
            isActive: true,
            nextBillingDate: { gte: now, lte: horizonEnd },
          },
          orderBy: { nextBillingDate: "asc" },
        }),
      ]);

    const currentBalance = monthTransactions.reduce((sum, transaction) => {
      if (transaction.type === "income") {
        return sum + Math.abs(Number(transaction.amount));
      }
      return sum - Math.abs(Number(transaction.amount));
    }, 0);

    const recentExpenseTotal = recentTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);

    const averageDailyExpense = recentExpenseTotal / 30;

    const upcomingEvents: CashFlowForecastEvent[] = [
      ...upcomingBills.map((bill) => ({
        id: `bill-${bill.id}`,
        label: bill.name,
        amount: Math.abs(Number(bill.amount)),
        currency: bill.currency as Currency,
        dueDate: bill.dueDate.toISOString(),
        source: "bill" as const,
        categoryLabel: bill.categoryLabel,
      })),
      ...upcomingSubscriptions.map((subscription) => ({
        id: `subscription-${subscription.id}`,
        label: subscription.name,
        amount: Math.abs(Number(subscription.amount)),
        currency: subscription.currency as Currency,
        dueDate: subscription.nextBillingDate.toISOString(),
        source: "subscription" as const,
        categoryLabel: subscription.categoryLabel,
      })),
    ].sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());

    const committedExpenses = upcomingEvents.reduce((sum, event) => sum + event.amount, 0);
    const daysRemainingInMonth = Math.max(
      0,
      Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const projectedVariableExpenses = Number((averageDailyExpense * daysRemainingInMonth).toFixed(2));
    const projectedEndBalance = Number(
      (currentBalance - committedExpenses - projectedVariableExpenses).toFixed(2)
    );
    const bufferTarget = Number((averageDailyExpense * 7).toFixed(2));

    let health: "stable" | "watch" | "critical" = "stable";
    if (projectedEndBalance < 0) {
      health = "critical";
    } else if (projectedEndBalance < bufferTarget) {
      health = "watch";
    }

    const availableAfterCommitments = currentBalance - committedExpenses;
    const runwayDays =
      averageDailyExpense > 0
        ? Math.max(0, Math.floor(availableAfterCommitments / averageDailyExpense))
        : null;

    return {
      days: horizonDays,
      currentBalance: Number(currentBalance.toFixed(2)),
      averageDailyExpense: Number(averageDailyExpense.toFixed(2)),
      committedExpenses: Number(committedExpenses.toFixed(2)),
      projectedVariableExpenses,
      projectedEndBalance,
      bufferTarget,
      health,
      runwayDays,
      upcomingEvents: upcomingEvents.slice(0, 6),
    };
  }

  // ============ EXPORT METHODS ============

  async exportToCSV(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const query: TransactionQuery = {};
    if (startDate) query.dateFrom = startDate.toISOString();
    if (endDate) query.dateTo = endDate.toISOString();

    const transactions = await this.findAll(userId, query);

    // CSV headers
    const headers = [
      "Tarih",
      "Açıklama",
      "Tutar",
      "Tür",
      "Kategori",
      "Para Birimi",
    ];
    const rows = transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString("tr-TR"),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type === "expense" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
      tx.type === "income" ? "Gelir" : "Gider",
      tx.categoryLabel,
      tx.currency,
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }

  async exportToExcel(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Buffer> {
    const ExcelJS = await import("exceljs");
    const query: TransactionQuery = {};
    if (startDate) query.dateFrom = startDate.toISOString();
    if (endDate) query.dateTo = endDate.toISOString();

    const transactions = await this.findAll(userId, query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("İşlemler");

    // Headers with styling
    worksheet.columns = [
      { header: "Tarih", key: "date", width: 15 },
      { header: "Açıklama", key: "description", width: 40 },
      { header: "Tutar", key: "amount", width: 15 },
      { header: "Tür", key: "type", width: 10 },
      { header: "Kategori", key: "category", width: 20 },
      { header: "Para Birimi", key: "currency", width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };

    // Add data rows
    transactions.forEach((tx) => {
      const row = worksheet.addRow({
        date: new Date(tx.date).toLocaleDateString("tr-TR"),
        description: tx.description,
        amount:
          tx.type === "expense" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
        type: tx.type === "income" ? "Gelir" : "Gider",
        category: tx.categoryLabel,
        currency: tx.currency,
      });

      // Color code income/expense
      const amountCell = row.getCell("amount");
      amountCell.numFmt = "#,##0.00";
      if (tx.type === "expense") {
        amountCell.font = { color: { argb: "FFFF0000" } };
      } else {
        amountCell.font = { color: { argb: "FF008000" } };
      }
    });

    // Add summary row
    const incomeTotal = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenseTotal = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    worksheet.addRow([]);
    worksheet.addRow(["", "Toplam Gelir:", incomeTotal, "", "", ""]);
    worksheet.addRow(["", "Toplam Gider:", -expenseTotal, "", "", ""]);
    worksheet.addRow([
      "",
      "Net Bakiye:",
      incomeTotal - expenseTotal,
      "",
      "",
      "",
    ]);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async getDuplicateGroups(
    userId: string,
    days: number = 90,
    windowDays: number = 1,
    amountTolerance: number = 0
  ): Promise<DuplicateGroup[]> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days);

    const transactions = await this.prisma.transaction.findMany({
      where: this.mergeTransactionWhere(
        await this.buildTransactionVisibilityScope(userId),
        {
          date: { gte: startDate },
        }
      ),
      orderBy: { date: "asc" },
      take: 2000,
    });

    const entities = await this.withActorNames(
      transactions.map((transaction) => this.mapToEntity(transaction))
    );
    const groups = this.buildDuplicateGroups(
      entities,
      windowDays,
      amountTolerance
    );

    return groups.sort(
      (a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime()
    );
  }

  async resolveDuplicateGroup(
    userId: string,
    keepId: string,
    transactionIds: string[]
  ): Promise<{ keptId: string; deleted: number }> {
    if (!keepId || !transactionIds || transactionIds.length < 2) {
      throw new BadRequestException("En az 2 islem secilmeli");
    }

    if (!transactionIds.includes(keepId)) {
      throw new BadRequestException("Koru islemi secilenler arasinda olmali");
    }

    const keep = await this.prisma.transaction.findFirst({
      where: { id: keepId, userId },
      select: { id: true },
    });

    if (!keep) {
      throw new NotFoundException("Koru islemi bulunamadi");
    }

    const deleteIds = transactionIds.filter((id) => id !== keepId);
    if (deleteIds.length === 0) {
      return { keptId: keepId, deleted: 0 };
    }

    const result = await this.prisma.transaction.deleteMany({
      where: { userId, id: { in: deleteIds } },
    });

    await this.cache.invalidateTransactions(userId);

    deleteIds.forEach((id) =>
      this.realtime.notifyTransactionDeleted(userId, id)
    );

    return { keptId: keepId, deleted: result.count };
  }

  private async resolveSummaryAnchorDate(
    userId: string,
    query?: TransactionQuery
  ): Promise<Date> {
    const queryDate = query?.dateFrom
      ? new Date(query.dateFrom)
      : query?.dateTo
        ? new Date(query.dateTo)
        : null;

    if (queryDate && !Number.isNaN(queryDate.getTime())) {
      return queryDate;
    }

    const latest = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    return latest?.date ?? new Date();
  }

  private mapToEntity(prismaTx: PrismaTransaction): TransactionEntity {
    return {
      id: prismaTx.id,
      userId: prismaTx.userId,
      accountId: prismaTx.accountId,
      date: prismaTx.date.toISOString(),
      description: prismaTx.description,
      amount: prismaTx.amount,
      currency: prismaTx.currency as Currency,
      source: prismaTx.source as TransactionSource,
      type: prismaTx.type as TransactionType,
      categoryId: prismaTx.categoryId,
      categoryLabel: prismaTx.categoryLabel,
      confidence: prismaTx.confidence,
      tags: this.parseTags(prismaTx.tags),
      notes: prismaTx.notes ?? undefined,
      householdId: prismaTx.householdId ?? undefined,
      ownerUserId: prismaTx.ownerUserId ?? undefined,
      reviewerUserId: prismaTx.reviewerUserId ?? undefined,
      needsReview: prismaTx.needsReview ?? false,
      createdAt: prismaTx.createdAt.toISOString(),
      updatedAt: prismaTx.updatedAt.toISOString(),
    };
  }

  private parseTags(raw?: string | null): string[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  private async withActorNames(
    transactions: TransactionEntity[]
  ): Promise<TransactionEntity[]> {
    const userIds = Array.from(
      new Set(
        transactions.flatMap((transaction) =>
          [transaction.ownerUserId, transaction.reviewerUserId].filter(
            (value): value is string => Boolean(value)
          )
        )
      )
    );

    if (userIds.length === 0) {
      return transactions;
    }

    const users =
      (await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })) || [];

    const userMap = new Map(
      users.map((user) => [user.id, user.name || user.email])
    );

    return transactions.map((transaction) => ({
      ...transaction,
      ownerName: transaction.ownerUserId
        ? userMap.get(transaction.ownerUserId)
        : undefined,
      reviewerName: transaction.reviewerUserId
        ? userMap.get(transaction.reviewerUserId)
        : undefined,
    }));
  }

  private async resolveHouseholdContext(userId: string, confidence: number) {
    const membership = await this.prisma.householdMember.findFirst({
      where: { userId },
      include: {
        household: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!membership) {
      return {
        householdId: null,
        ownerUserId: userId,
        reviewerUserId: null,
        needsReview: false,
      };
    }

    const reviewerUserId =
      confidence < 70 && membership.household.ownerId !== userId
        ? membership.household.ownerId
        : null;

    return {
      householdId: membership.household.id,
      ownerUserId: userId,
      reviewerUserId,
      needsReview: confidence < 70 && !!reviewerUserId,
    };
  }

  private async buildTransactionVisibilityScope(
    userId: string
  ): Promise<Prisma.TransactionWhereInput> {
    const membership = await this.prisma.householdMember.findFirst({
      where: { userId },
      select: { householdId: true },
    });

    if (!membership) {
      return { userId };
    }

    return {
      OR: [{ userId }, { householdId: membership.householdId }],
    };
  }

  private mergeTransactionWhere(
    visibilityScope: Prisma.TransactionWhereInput,
    extra: Prisma.TransactionWhereInput
  ): Prisma.TransactionWhereInput {
    if ("OR" in visibilityScope) {
      return {
        AND: [visibilityScope, extra],
      };
    }

    return {
      ...visibilityScope,
      ...extra,
    };
  }

  private notifyReviewIfNeeded(transaction: TransactionEntity) {
    if (!transaction.needsReview || !transaction.reviewerUserId) {
      return;
    }

    this.realtime.notifyReviewRequested([transaction.reviewerUserId], {
      transactionId: transaction.id,
      householdId: transaction.householdId,
      ownerUserId: transaction.ownerUserId,
      reviewerUserId: transaction.reviewerUserId,
      needsReview: true,
    });
  }

  private async resolveCategory(
    description: string,
    type: TransactionType,
    userId: string
  ): Promise<{ categoryId: string; categoryLabel: string; confidence: number }> {
    const auto = await this.autoCategorizer.categorize(description, userId);
    const fallback = classifyTransaction(description, type);

    if (fallback.confidence >= auto.confidence) {
      return fallback;
    }

    return {
      categoryId: auto.categoryId,
      categoryLabel: auto.categoryLabel,
      confidence: auto.confidence,
    };
  }

  private buildDuplicateGroups(
    transactions: TransactionEntity[],
    windowDays: number,
    amountTolerance: number
  ): DuplicateGroup[] {
    const byKey = new Map<string, TransactionEntity[]>();

    for (const tx of transactions) {
      const key = this.buildDuplicateKey(tx);
      const list = byKey.get(key) || [];
      list.push(tx);
      byKey.set(key, list);
    }

    const groups: DuplicateGroup[] = [];

    for (const list of byKey.values()) {
      if (list.length < 2) continue;

      const sorted = [...list].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const clusters: Array<{
        amount: number;
        lastDate: string;
        transactions: TransactionEntity[];
      }> = [];

      for (const tx of sorted) {
        const txAmount = Math.abs(tx.amount);
        let matched = false;

        for (const cluster of clusters) {
          if (
            this.isWithinDays(cluster.lastDate, tx.date, windowDays) &&
            this.isAmountWithinTolerance(
              cluster.amount,
              txAmount,
              amountTolerance
            )
          ) {
            cluster.transactions.push(tx);
            cluster.lastDate = tx.date;
            matched = true;
            break;
          }
        }

        if (!matched) {
          clusters.push({
            amount: txAmount,
            lastDate: tx.date,
            transactions: [tx],
          });
        }
      }

      for (const cluster of clusters) {
        if (cluster.transactions.length > 1) {
          groups.push(
            this.buildDuplicateGroup(
              cluster.transactions,
              windowDays,
              amountTolerance
            )
          );
        }
      }
    }

    return groups;
  }

  private buildDuplicateGroup(
    cluster: TransactionEntity[],
    windowDays: number,
    amountTolerance: number
  ): DuplicateGroup {
    const sorted = [...cluster].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      id: uuidv4(),
      reason: `Ayni aciklama ile ${windowDays} gun icinde tekrar eden islemler (tolerans: ${amountTolerance})`,
      description: first.description,
      amount: Math.abs(first.amount),
      currency: first.currency,
      type: first.type,
      dateFrom: first.date,
      dateTo: last.date,
      count: sorted.length,
      transactions: sorted,
    };
  }

  private buildDuplicateKey(tx: TransactionEntity): string {
    const normalized = this.normalizeDuplicateText(tx.description || "");
    return `${normalized}|${tx.currency}|${tx.type}`;
  }

  private normalizeDuplicateText(input: string): string {
    return input
      .toLowerCase()
      .replace(/Ã§/g, "c")
      .replace(/ÄŸ/g, "g")
      .replace(/Ä±/g, "i")
      .replace(/Ã¶/g, "o")
      .replace(/ÅŸ/g, "s")
      .replace(/Ã¼/g, "u")
      .replace(/\d+/g, "")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSimilarityText(input: string): string {
    const normalized = input
      .toLowerCase()
      .replace(/[0-9]/g, " ")
      .replace(/[^a-zA-Z\u00C0-\u024F\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 2)
      .join(" ");

    return normalized || this.normalizeDuplicateText(input);
  }

  private normalizeTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  private async resolveBulkTargetTransactions(
    userId: string,
    transactionIds: string[],
    applyToSimilar?: boolean
  ) {
    const existing = await this.prisma.transaction.findMany({
      where: {
        userId,
        id: { in: transactionIds },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        categoryLabel: true,
      },
    });

    if (existing.length !== transactionIds.length) {
      throw new NotFoundException("Secilen islemlerden biri bulunamadi");
    }

    if (!applyToSimilar) {
      return existing;
    }

    const similaritySeeds = new Map<TransactionType, Set<string>>();

    existing.forEach((transaction) => {
      const normalized = this.normalizeSimilarityText(transaction.description);
      if (!normalized) {
        return;
      }

      const current =
        similaritySeeds.get(transaction.type as TransactionType) || new Set<string>();
      current.add(normalized);
      similaritySeeds.set(transaction.type as TransactionType, current);
    });

    if (similaritySeeds.size === 0) {
      return existing;
    }

    const candidates = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: { in: [...similaritySeeds.keys()] },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        categoryLabel: true,
      },
    });

    return candidates.filter((transaction) => {
      const normalized = this.normalizeSimilarityText(transaction.description);
      return similaritySeeds.get(transaction.type as TransactionType)?.has(normalized) ?? false;
    });
  }

  private isWithinDays(a: string, b: string, days: number): boolean {
    const diff = Math.abs(
      new Date(a).getTime() - new Date(b).getTime()
    );
    return diff <= days * 24 * 60 * 60 * 1000;
  }

  private isAmountWithinTolerance(
    a: number,
    b: number,
    tolerance: number
  ): boolean {
    return Math.abs(a - b) <= tolerance;
  }

  private normalizeFrequency(
    value: string
  ): "weekly" | "monthly" | "yearly" {
    if (value === "weekly" || value === "monthly" || value === "yearly") {
      return value;
    }
    return "monthly";
  }

  private subtractFrequency(date: Date, frequency: "weekly" | "monthly" | "yearly"): Date {
    const result = new Date(date);
    if (frequency === "weekly") {
      result.setDate(result.getDate() - 7);
      return result;
    }
    if (frequency === "yearly") {
      result.setFullYear(result.getFullYear() - 1);
      return result;
    }
    result.setMonth(result.getMonth() - 1);
    return result;
  }
}
