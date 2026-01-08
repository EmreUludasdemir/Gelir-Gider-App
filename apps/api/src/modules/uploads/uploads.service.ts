import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Blob } from 'buffer';
import {
  TransactionEntity,
  UploadResult,
  Currency,
  TransactionSource,
  TransactionType,
  PrismaTransaction,
} from '../../shared/types';
import { CATEGORIES, classifyTransaction } from '../../shared/categories';
import { PrismaService } from '../../prisma.service';
import { CacheService } from '../../shared/cache';
import { Prisma } from '@prisma/client';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
  type?: 'income' | 'expense';
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
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
  ) { }

  async processPdf(userId: string, file: Express.Multer.File): Promise<UploadResult> {
    // Validate file
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

    const errors: string[] = [];
    const transactions: TransactionEntity[] = [];

    try {
      // Call PDF parser service
      const pdfParserUrl = process.env.PDF_PARSER_URL || 'http://localhost:8001';

      // Use the native FormData/Blob so fetch can set the correct boundary.
      const formData = new FormData();
      const pdfBlob = new Blob([file.buffer], { type: 'application/pdf' });
      formData.append('file', pdfBlob, file.originalname);

      const response = await fetch(`${pdfParserUrl}/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`PDF Parser service error: ${response.statusText}`);
      }

      const parseResult = await response.json() as {
        success: boolean;
        transactions?: ParsedTransaction[];
        errors?: string[];
      };

      if (!parseResult.success) {
        throw new Error('PDF parsing failed');
      }

      const parsedTransactions: ParsedTransaction[] = parseResult.transactions || [];

      // Process each parsed transaction
      for (const [index, parsed] of parsedTransactions.entries()) {
        try {
          // Classify transaction
          // TODO: Use userId for personalized classification if needed
          const type = this.inferTransactionType(parsed);
          const classification = classifyTransaction(parsed.description, type);
          const normalizedAmount = Math.abs(parsed.amount);

          // Save to database
          const transaction = await this.prisma.transaction.create({
            data: {
              userId,
              accountId: 'pdf-upload',
              date: new Date(parsed.date),
              description: parsed.description,
              amount: normalizedAmount,
              currency: (parsed.currency || 'TRY'),
              source: 'pdf',
              type,
              categoryId: classification.categoryId,
              categoryLabel: classification.categoryLabel,
              confidence: classification.confidence,
              tags: JSON.stringify(['pdf-upload']),
              notes: `Parsed from ${file.originalname}`,
            },
          });

          transactions.push(this.mapToEntity(transaction));
        } catch (err) {
          errors.push(`Transaction ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      const lowConfidenceCount = transactions.filter(tx => tx.confidence < 60).length;

      if (transactions.length > 0) {
        await this.cache.invalidateTransactions(userId);
      }

      return {
        success: true,
        filename: file.originalname,
        totalParsed: parsedTransactions.length,
        totalSaved: transactions.length,
        lowConfidenceCount,
        errors,
        transactions,
      };
    } catch (error) {
      this.logger.error('Error in processPdf:', error);

      // If PDF parser service is not available, return a friendly error
      if (error instanceof Error && error.message.includes('fetch')) {
        this.logger.error('PDF Parser service not available');
        return {
          success: false,
          filename: file.originalname,
          totalParsed: 0,
          totalSaved: 0,
          lowConfidenceCount: 0,
          errors: [
            'PDF Parser service is not available. Please start the service with: npm run dev:parser',
            error.message,
          ],
          transactions: [],
        };
      }

      const errorMessage = `Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error('Throwing BadRequestException:', errorMessage);
      throw new BadRequestException(errorMessage);
    }
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
      tags: JSON.parse(prismaTx.tags || '[]'),
      notes: prismaTx.notes ?? undefined,
      createdAt: prismaTx.createdAt.toISOString(),
      updatedAt: prismaTx.updatedAt.toISOString(),
    };
  }

  private inferTransactionType(parsed: ParsedTransaction): TransactionType {
    if (parsed.type === 'income' || parsed.type === 'expense') {
      return parsed.type;
    }

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

    return parsed.amount < 0 ? 'expense' : 'income';
  }

  private matchesCategoryKeywords(description: string, type: TransactionType): boolean {
    const normalized = this.normalizeText(description);
    return CATEGORIES.some((category) =>
      category.type === type &&
      category.keywords.some((keyword) => normalized.includes(this.normalizeText(keyword)))
    );
  }

  private hasKeywordMatch(description: string, keywords: string[]): boolean {
    const normalized = this.normalizeText(description);
    return keywords.some((keyword) => normalized.includes(this.normalizeText(keyword)));
  }

  private normalizeText(input: string): string {
    return input
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u');
  }
}
