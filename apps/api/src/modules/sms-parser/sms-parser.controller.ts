import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SmsParserService } from './sms-parser.service';
import { ParseSmsDto, BulkParseSmsDto, ParsedTransactionDto } from './sms-parser.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('sms-parser')
export class SmsParserController {
  constructor(
    private readonly smsParserService: SmsParserService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Parse a single SMS message
   */
  @Post('parse')
  async parseSms(@Body() dto: ParseSmsDto): Promise<ParsedTransactionDto | null> {
    return this.smsParserService.parseSms(dto);
  }

  /**
   * Parse multiple SMS messages and optionally create transactions
   */
  @Post('parse-bulk')
  async parseBulk(
    @User('id') userId: string,
    @Body() dto: BulkParseSmsDto,
  ): Promise<{ parsed: ParsedTransactionDto[]; created: number }> {
    const parsed = await this.smsParserService.parseBulk(dto.messages);
    return { parsed, created: 0 };
  }

  /**
   * Parse SMS and immediately create transaction
   */
  @Post('parse-and-create')
  async parseAndCreate(
    @User('id') userId: string,
    @Body() dto: ParseSmsDto,
  ): Promise<any> {
    const parsed = await this.smsParserService.parseSms(dto);

    if (!parsed) {
      throw new HttpException(
        'Could not parse SMS message',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create transaction from parsed data
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.merchant || 'SMS Import',
        category: parsed.category || 'Diğer',
        date: parsed.date,
        notes: `Imported from ${parsed.bankName} SMS. Confidence: ${parsed.confidence}%`,
      },
    });

    return {
      transaction,
      parsed,
    };
  }

  /**
   * Bulk parse and create transactions
   */
  @Post('bulk-import')
  async bulkImport(
    @User('id') userId: string,
    @Body() dto: BulkParseSmsDto,
  ): Promise<{ imported: number; failed: number; transactions: any[] }> {
    const parsed = await this.smsParserService.parseBulk(dto.messages);

    const transactions = [];
    let failed = 0;

    for (const item of parsed) {
      try {
        const transaction = await this.prisma.transaction.create({
          data: {
            userId,
            amount: item.amount,
            type: item.type,
            description: item.merchant || 'SMS Import',
            category: item.category || 'Diğer',
            date: item.date,
            notes: `Imported from ${item.bankName} SMS. Confidence: ${item.confidence}%`,
          },
        });
        transactions.push(transaction);
      } catch (error) {
        failed++;
      }
    }

    return {
      imported: transactions.length,
      failed,
      transactions,
    };
  }

  /**
   * Get list of supported banks
   */
  @Get('supported-banks')
  getSupportedBanks(): string[] {
    return this.smsParserService.getSupportedBanks();
  }

  /**
   * Test if a sender is from a supported bank
   */
  @Post('test-sender')
  testSender(@Body('sender') sender: string): { supported: boolean; bank?: string } {
    const isSupported = this.smsParserService.isSupportedBank(sender);

    if (isSupported) {
      const bankPatterns = this.smsParserService.getSupportedBanks();
      return { supported: true };
    }

    return { supported: false };
  }
}
