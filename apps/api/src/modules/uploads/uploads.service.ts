import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import {
  TransactionEntity,
  UploadResult,
  Currency,
  TransactionSource,
  TransactionType,
  PrismaTransaction,
} from '../../shared/types';
import { classifyTransaction } from '../../shared/categories';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly prisma: PrismaService) { }

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

      // Use form-data for proper multipart/form-data handling in Node.js
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: 'application/pdf',
      });

      // Node 18+ fetch
      const response = await fetch(`${pdfParserUrl}/parse`, {
        method: 'POST',
        body: formData as any,
        headers: formData.getHeaders(),
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
          const classification = classifyTransaction(parsed.description);

          // Determine transaction type
          const type: 'income' | 'expense' = parsed.amount >= 0 ? 'income' : 'expense';

          // Save to database
          const transaction = await this.prisma.transaction.create({
            data: {
              userId,
              accountId: 'pdf-upload',
              date: new Date(parsed.date),
              description: parsed.description,
              amount: parsed.amount,
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
}
