import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  TransactionEntity,
  UploadPreview,
  UploadPreviewTransaction,
  UploadResult,
  Currency,
  TransactionSource,
  TransactionType,
  PrismaTransaction,
} from '../../shared/types';
import { CATEGORIES, classifyTransaction } from '../../shared/categories';
import { PrismaService } from '../../prisma.service';
import { CacheService } from '../../shared/cache';
import { AutoCategorizerService } from '../ai/auto-categorizer.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
  type?: 'income' | 'expense';
}

export interface ConfirmPdfUploadDto {
  filename: string;
  fileHash: string;
  fileSize: number;
  totalParsed: number;
  transactions: UploadPreviewTransaction[];
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private static readonly LOW_CONFIDENCE_THRESHOLD = 70;
  private static readonly EXPENSE_OVERRIDE_KEYWORDS = [
    'bsmv',
    'kkdf',
    'komisyon',
    'ucret',
    'masraf',
    'nakit avans',
    'gecikme',
    'gecikme faizi',
    'hesap isletim',
    'kredi karti aidat',
    'aidat',
    'provizyon',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly autoCategorizer: AutoCategorizerService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async processPdf(userId: string, file: Express.Multer.File): Promise<UploadResult> {
    const preview = await this.previewPdf(userId, file);

    if (preview.duplicate) {
      return {
        success: false,
        duplicate: true,
        filename: preview.filename,
        totalParsed: preview.totalParsed,
        totalSaved: 0,
        lowConfidenceCount: preview.lowConfidenceCount,
        errors: preview.errors,
        suggestions: preview.suggestions,
        transactions: [],
      };
    }

    return this.confirmPdfUpload(userId, {
      filename: preview.filename,
      fileHash: preview.fileHash,
      fileSize: preview.fileSize,
      totalParsed: preview.totalParsed,
      transactions: preview.transactions,
    });
  }

  async previewPdf(userId: string, file: Express.Multer.File): Promise<UploadPreview> {
    this.validateFile(file);

    const fileHash = this.calculateFileHash(file);
    const existingUpload = await this.prisma.pdfUpload.findFirst({
      where: { userId, fileHash },
      select: { uploadedAt: true, filename: true },
    });

    if (existingUpload) {
      return {
        success: false,
        duplicate: true,
        filename: file.originalname,
        fileHash,
        fileSize: file.size,
        totalParsed: 0,
        lowConfidenceCount: 0,
        errors: [
          `Bu PDF daha once ${this.formatDate(existingUpload.uploadedAt)} tarihinde yuklenmis gorunuyor.`,
        ],
        suggestions: this.buildDuplicateSuggestions(file.originalname, existingUpload.filename),
        transactions: [],
      };
    }

    try {
      const parseResult = await this.parsePdfFile(file);
      const previewTransactions: UploadPreviewTransaction[] = [];
      const errors = [...(parseResult.errors || [])];

      for (const [index, parsed] of parseResult.transactions.entries()) {
        try {
          previewTransactions.push(await this.buildPreviewTransaction(userId, file.originalname, parsed, index));
        } catch (error) {
          errors.push(`Transaction ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        filename: file.originalname,
        fileHash,
        fileSize: file.size,
        totalParsed: parseResult.transactions.length,
        lowConfidenceCount: previewTransactions.filter(
          (transaction) => transaction.confidence < UploadsService.LOW_CONFIDENCE_THRESHOLD,
        ).length,
        errors,
        suggestions: [],
        transactions: previewTransactions,
      };
    } catch (error) {
      return this.handleParserFailure(file.originalname, fileHash, file.size, error);
    }
  }

  async confirmPdfUpload(userId: string, dto: ConfirmPdfUploadDto): Promise<UploadResult> {
    if (!dto.filename || !dto.fileHash) {
      throw new BadRequestException('Import metadata is missing');
    }

    if (!dto.transactions || dto.transactions.length === 0) {
      throw new BadRequestException('Kaydedilecek islem bulunamadi');
    }

    const existingUpload = await this.prisma.pdfUpload.findFirst({
      where: { userId, fileHash: dto.fileHash },
      select: { uploadedAt: true, filename: true },
    });

    if (existingUpload) {
      return {
        success: false,
        duplicate: true,
        filename: dto.filename,
        totalParsed: dto.totalParsed || dto.transactions.length,
        totalSaved: 0,
        lowConfidenceCount: 0,
        errors: [
          `Bu PDF daha once ${this.formatDate(existingUpload.uploadedAt)} tarihinde yuklenmis gorunuyor.`,
        ],
        suggestions: this.buildDuplicateSuggestions(dto.filename, existingUpload.filename),
        transactions: [],
      };
    }

    const errors: string[] = [];
    const savedTransactions: TransactionEntity[] = [];

    for (const [index, transaction] of dto.transactions.entries()) {
      try {
        const saved = await this.prisma.transaction.create({
          data: await this.mapPreviewToCreateData(userId, dto.filename, transaction),
        });
        const entity = this.mapToEntity(saved);
        savedTransactions.push(entity);
        this.realtime.notifyNewTransaction(userId, {
          id: entity.id,
          description: entity.description,
          amount: entity.amount,
          type: entity.type as 'income' | 'expense',
          categoryLabel: entity.categoryLabel,
        });
        if (entity.needsReview && entity.reviewerUserId) {
          this.realtime.notifyReviewRequested([entity.reviewerUserId], {
            transactionId: entity.id,
            householdId: entity.householdId,
            ownerUserId: entity.ownerUserId,
            reviewerUserId: entity.reviewerUserId,
            needsReview: true,
          });
        }
      } catch (error) {
        errors.push(`Transaction ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const lowConfidenceCount = savedTransactions.filter(
      (transaction) => transaction.confidence < UploadsService.LOW_CONFIDENCE_THRESHOLD,
    ).length;

    await this.prisma.pdfUpload.create({
      data: {
        userId,
        filename: dto.filename,
        fileHash: dto.fileHash,
        fileSize: dto.fileSize || 0,
        totalParsed: dto.totalParsed || dto.transactions.length,
        totalSaved: savedTransactions.length,
        lowConfidenceCount,
      },
    });

    if (savedTransactions.length > 0) {
      await this.cache.invalidateTransactions(userId);
    }

    return {
      success: true,
      filename: dto.filename,
      totalParsed: dto.totalParsed || dto.transactions.length,
      totalSaved: savedTransactions.length,
      lowConfidenceCount,
      errors,
      suggestions: [],
      transactions: savedTransactions,
    };
  }

  private validateFile(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Only PDF files are accepted');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer not available');
    }
  }

  private async parsePdfFile(file: Express.Multer.File): Promise<{
    transactions: ParsedTransaction[];
    errors?: string[];
  }> {
    const pdfParserUrl = process.env.PDF_PARSER_URL || 'http://localhost:8001';
    const formData = new FormData();
    const pdfBuffer = file.buffer.buffer.slice(
      file.buffer.byteOffset,
      file.buffer.byteOffset + file.buffer.byteLength,
    ) as ArrayBuffer;
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', pdfBlob, file.originalname);

    const response = await fetch(`${pdfParserUrl}/parse`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`PDF Parser service error: ${response.statusText}`);
    }

    const parseResult = (await response.json()) as {
      success: boolean;
      transactions?: ParsedTransaction[];
      errors?: string[];
    };

    if (!parseResult.success) {
      throw new Error('PDF parsing failed');
    }

    return {
      transactions: parseResult.transactions || [],
      errors: parseResult.errors || [],
    };
  }

  private async buildPreviewTransaction(
    userId: string,
    filename: string,
    parsed: ParsedTransaction,
    index: number,
  ): Promise<UploadPreviewTransaction> {
    const type = this.inferTransactionType(parsed);
    const classification = await this.resolveCategory(parsed.description, type, userId);

    return {
      id: `preview-${index + 1}-${crypto.randomUUID()}`,
      date: new Date(parsed.date).toISOString(),
      description: parsed.description,
      amount: Math.abs(Number(parsed.amount || 0)),
      currency: this.normalizeCurrency(parsed.currency),
      type,
      categoryId: classification.categoryId,
      categoryLabel: classification.categoryLabel,
      confidence: classification.confidence,
      tags: ['pdf-upload'],
      notes: `Parsed from ${filename}`,
    };
  }

  private async mapPreviewToCreateData(
    userId: string,
    filename: string,
    transaction: UploadPreviewTransaction,
  ) {
    if (!transaction.description?.trim()) {
      throw new BadRequestException('Transaction description is required');
    }

    if (!transaction.date) {
      throw new BadRequestException('Transaction date is required');
    }

    if (!Number.isFinite(Number(transaction.amount))) {
      throw new BadRequestException('Transaction amount is invalid');
    }

    const type = transaction.type === 'income' || transaction.type === 'expense'
      ? transaction.type
      : 'expense';

    let categoryId = transaction.categoryId;
    let categoryLabel = transaction.categoryLabel;
    let confidence = Number(transaction.confidence || 0);

    if (!categoryId || !categoryLabel) {
      const classification = await this.resolveCategory(transaction.description, type, userId);
      categoryId = classification.categoryId;
      categoryLabel = classification.categoryLabel;
      confidence = classification.confidence;
    }

    const normalizedConfidence = Math.max(0, Math.min(100, confidence));
    const householdContext = await this.resolveHouseholdContext(userId, normalizedConfidence);

    return {
      userId,
      accountId: 'pdf-upload',
      date: new Date(transaction.date),
      description: transaction.description.trim(),
      amount: Math.abs(Number(transaction.amount)),
      currency: this.normalizeCurrency(transaction.currency),
      source: 'pdf',
      type,
      categoryId,
      categoryLabel,
      confidence: normalizedConfidence,
      tags: JSON.stringify(transaction.tags?.length ? transaction.tags : ['pdf-upload']),
      notes: transaction.notes?.trim() || `Parsed from ${filename}`,
      householdId: householdContext.householdId,
      ownerUserId: householdContext.ownerUserId,
      reviewerUserId: householdContext.reviewerUserId,
      needsReview: householdContext.needsReview,
    };
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
      confidence < UploadsService.LOW_CONFIDENCE_THRESHOLD &&
      membership.household.ownerId !== userId
        ? membership.household.ownerId
        : null;

    return {
      householdId: membership.household.id,
      ownerUserId: userId,
      reviewerUserId,
      needsReview:
        confidence < UploadsService.LOW_CONFIDENCE_THRESHOLD && !!reviewerUserId,
    };
  }

  private async resolveCategory(
    description: string,
    type: TransactionType,
    userId: string,
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

  private handleParserFailure(
    filename: string,
    fileHash: string,
    fileSize: number,
    error: unknown,
  ): UploadPreview {
    this.logger.error('Error in previewPdf:', error);

    if (error instanceof Error && error.message.includes('fetch')) {
      this.logger.error('PDF Parser service not available');
      return {
        success: false,
        filename,
        fileHash,
        fileSize,
        totalParsed: 0,
        lowConfidenceCount: 0,
        errors: [
          'PDF Parser service is not available. Please start the service with: npm run dev:parser',
          error.message,
        ],
        suggestions: [],
        transactions: [],
      };
    }

    const errorMessage = `Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
    this.logger.error('Throwing BadRequestException:', errorMessage);
    throw new BadRequestException(errorMessage);
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
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  private inferTransactionType(parsed: ParsedTransaction): TransactionType {
    const desc = this.normalizeText(parsed.description || '');

    if (this.hasKeywordMatch(desc, UploadsService.EXPENSE_OVERRIDE_KEYWORDS)) {
      return 'expense';
    }

    const matchesExpense = this.matchesCategoryKeywords(desc, 'expense');
    const matchesIncome = this.matchesCategoryKeywords(desc, 'income');

    if (matchesExpense && !matchesIncome) {
      return 'expense';
    }

    if (matchesIncome && !matchesExpense) {
      return 'income';
    }

    if (parsed.amount < 0) {
      return 'expense';
    }

    if (parsed.type === 'income' || parsed.type === 'expense') {
      return parsed.type;
    }

    return parsed.amount < 0 ? 'expense' : 'income';
  }

  private matchesCategoryKeywords(description: string, type: TransactionType): boolean {
    const normalized = this.normalizeText(description);
    return CATEGORIES.some(
      (category) =>
        category.type === type &&
        category.keywords.some((keyword) => normalized.includes(this.normalizeText(keyword))),
    );
  }

  private hasKeywordMatch(description: string, keywords: string[]): boolean {
    const normalized = this.normalizeText(description);
    return keywords.some((keyword) => normalized.includes(this.normalizeText(keyword)));
  }

  private normalizeText(input: string): string {
    return input
      .toLowerCase()
      .replace(/Ã§/g, 'c')
      .replace(/ÄŸ/g, 'g')
      .replace(/Ä±/g, 'i')
      .replace(/Ã¶/g, 'o')
      .replace(/ÅŸ/g, 's')
      .replace(/Ã¼/g, 'u');
  }

  private normalizeCurrency(currency?: string): Currency {
    if (currency === 'USD' || currency === 'EUR') {
      return currency;
    }
    return 'TRY';
  }

  private calculateFileHash(file: Express.Multer.File): string {
    return crypto.createHash('sha256').update(file.buffer).digest('hex');
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private buildDuplicateSuggestions(originalName: string, previousName: string): string[] {
    const suggestions = [
      'Ayni ekstreyi tekrar yuklemek yerine onceki yuklemeyi kullanin.',
      'Yeni bir donemse, dosya adini degistirip tekrar deneyin.',
      'Tekrar yuklemeniz gerekiyorsa, eski kayitlari silip yeniden yukleyin.',
    ];

    if (previousName && previousName !== originalName) {
      suggestions.unshift(`Onceki yukleme dosya adi: ${previousName}`);
    }

    return suggestions;
  }
}
