import { Injectable, Logger } from '@nestjs/common';
import { BANK_PATTERNS, CATEGORY_KEYWORDS, BankPattern } from './bank-patterns';
import { ParsedTransactionDto, ParseSmsDto } from './sms-parser.dto';

@Injectable()
export class SmsParserService {
  private readonly logger = new Logger(SmsParserService.name);

  /**
   * Parse a single SMS message
   */
  async parseSms(dto: ParseSmsDto): Promise<ParsedTransactionDto | null> {
    const { sender, message, receivedAt } = dto;

    // Find matching bank pattern
    const bankPattern = this.findBankPattern(sender);
    if (!bankPattern) {
      this.logger.debug(`No bank pattern found for sender: ${sender}`);
      return null;
    }

    // Try to match message against bank patterns
    for (const pattern of bankPattern.patterns) {
      const match = message.match(pattern.regex);
      if (match) {
        try {
          const amount = pattern.extractors.amount(match);
          const type = pattern.extractors.type(match);
          const merchant = pattern.extractors.merchant?.(match) || 'Unknown';
          const date = receivedAt ? new Date(receivedAt) : new Date();

          // Auto-categorize
          const category = this.categorizeTransaction(merchant, type);

          // Calculate confidence based on pattern match quality
          const confidence = this.calculateConfidence(match, message);

          const parsed: ParsedTransactionDto = {
            amount,
            type,
            merchant,
            category,
            bankName: bankPattern.bankName,
            date,
            rawMessage: message,
            confidence,
          };

          this.logger.log(
            `Successfully parsed SMS from ${bankPattern.bankName}: ${amount} TL - ${merchant}`,
          );

          return parsed;
        } catch (error) {
          this.logger.error(`Error extracting data from match: ${error.message}`);
          continue;
        }
      }
    }

    this.logger.debug(`No pattern matched for message from ${sender}`);
    return null;
  }

  /**
   * Parse multiple SMS messages in bulk
   */
  async parseBulk(messages: ParseSmsDto[]): Promise<ParsedTransactionDto[]> {
    const results: ParsedTransactionDto[] = [];

    for (const message of messages) {
      const parsed = await this.parseSms(message);
      if (parsed) {
        results.push(parsed);
      }
    }

    this.logger.log(`Bulk parsed ${results.length} out of ${messages.length} messages`);
    return results;
  }

  /**
   * Find bank pattern by sender name
   */
  private findBankPattern(sender: string): BankPattern | undefined {
    const normalizedSender = sender.toLowerCase().replace(/\s+/g, '');

    return BANK_PATTERNS.find((pattern) =>
      pattern.senderNames.some(
        (name) => normalizedSender.includes(name.toLowerCase().replace(/\s+/g, '')),
      ),
    );
  }

  /**
   * Auto-categorize transaction based on merchant name
   */
  private categorizeTransaction(
    merchant: string,
    type: 'income' | 'expense',
  ): string {
    if (type === 'income') {
      return 'Gelir';
    }

    const normalizedMerchant = merchant.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => normalizedMerchant.includes(keyword))) {
        return category;
      }
    }

    return 'Diğer';
  }

  /**
   * Calculate confidence score based on match quality
   */
  private calculateConfidence(match: RegExpMatchArray, message: string): number {
    let confidence = 70; // Base confidence

    // Increase confidence if amount is properly formatted
    if (match[1] && /^\d+[.,]\d{2}$/.test(match[1])) {
      confidence += 10;
    }

    // Increase confidence if merchant name is present
    if (match[2] && match[2].length > 3) {
      confidence += 10;
    }

    // Decrease confidence if message is very long (might be incomplete match)
    if (message.length > 200) {
      confidence -= 10;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Get list of supported banks
   */
  getSupportedBanks(): string[] {
    return BANK_PATTERNS.map((pattern) => pattern.bankName);
  }

  /**
   * Test if a sender is from a supported bank
   */
  isSupportedBank(sender: string): boolean {
    return this.findBankPattern(sender) !== undefined;
  }
}
