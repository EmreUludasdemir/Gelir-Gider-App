/**
 * Auto-Categorizer Service
 * Automatically categorizes transactions using:
 * 1. Merchant database
 * 2. Pattern matching
 * 3. User history learning
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface CategoryResult {
  categoryId: string;
  categoryLabel: string;
  confidence: number;
  source: 'merchant_db' | 'pattern' | 'user_history' | 'default';
}

interface MerchantRule {
  pattern: RegExp;
  categoryId: string;
  categoryLabel: string;
  confidence: number;
}

@Injectable()
export class AutoCategorizerService {
  private readonly logger = new Logger(AutoCategorizerService.name);

  // Turkish merchant database with common patterns
  private readonly merchantDatabase: MerchantRule[] = [
    // Supermarkets
    { pattern: /migros|carrefour|bim|a101|şok|file|macro|happy.?center/i, categoryId: 'groceries', categoryLabel: 'Market', confidence: 95 },

    // Food & Restaurants
    { pattern: /starbucks|kahve.?dünyası|tchibo|gloria.?jeans/i, categoryId: 'food', categoryLabel: 'Yeme-İçme', confidence: 90 },
    { pattern: /mcdonald|burger.?king|kfc|popeyes|domino|pizza.?hut|little.?caesars/i, categoryId: 'food', categoryLabel: 'Yeme-İçme', confidence: 90 },
    { pattern: /yemeksepeti|getir.?yemek|trendyol.?yemek/i, categoryId: 'food', categoryLabel: 'Yeme-İçme', confidence: 92 },
    { pattern: /restoran|restaurant|lokanta|cafe|kahve|bistro|mangal|kebap/i, categoryId: 'food', categoryLabel: 'Yeme-İçme', confidence: 85 },

    // Transportation
    { pattern: /uber|bolt|bitaksi|korsan/i, categoryId: 'transport', categoryLabel: 'Ulaşım', confidence: 95 },
    { pattern: /iett|ego|eshot|metro.?(istanbul|ankara)|marmaray|izban/i, categoryId: 'transport', categoryLabel: 'Ulaşım', confidence: 95 },
    { pattern: /istanbulkart|ankarakart|kentkart|akbil/i, categoryId: 'transport', categoryLabel: 'Ulaşım', confidence: 95 },
    { pattern: /shell|bp|opet|petrol.?ofisi|total|po|turkuaz/i, categoryId: 'transport', categoryLabel: 'Ulaşım', confidence: 90 },
    { pattern: /otopark|parking|otoban|köprü.?geçiş|hgs|ogs/i, categoryId: 'transport', categoryLabel: 'Ulaşım', confidence: 90 },

    // Shopping
    { pattern: /trendyol|hepsiburada|amazon|n11|gittigidiyor|sahibinden/i, categoryId: 'shopping', categoryLabel: 'Alışveriş', confidence: 85 },
    { pattern: /zara|h&m|mango|lcw|defacto|koton|vakko|boyner|mavi/i, categoryId: 'shopping', categoryLabel: 'Alışveriş', confidence: 90 },
    { pattern: /mediamarkt|vatan|teknosa|d&r/i, categoryId: 'shopping', categoryLabel: 'Alışveriş', confidence: 85 },

    // Bills
    { pattern: /elektrik|tedaş|enerjisa|başkent.?elektrik|ck.?enerji/i, categoryId: 'bills', categoryLabel: 'Faturalar', confidence: 95 },
    { pattern: /doğalgaz|igdaş|başkent.?gaz|izmir.?gaz/i, categoryId: 'bills', categoryLabel: 'Faturalar', confidence: 95 },
    { pattern: /turkcell|vodafone|türk.?telekom|superonline|d\-smart/i, categoryId: 'bills', categoryLabel: 'Faturalar', confidence: 95 },
    { pattern: /iski|aski|izsu|su.?idaresi/i, categoryId: 'bills', categoryLabel: 'Faturalar', confidence: 95 },

    // Entertainment
    { pattern: /netflix|spotify|youtube|disney|apple.?(tv|music)|amazon.?prime/i, categoryId: 'entertainment', categoryLabel: 'Eğlence', confidence: 95 },
    { pattern: /sinema|cinema|biletix|passo|event|konser/i, categoryId: 'entertainment', categoryLabel: 'Eğlence', confidence: 85 },
    { pattern: /playstation|xbox|steam|epic.?games|nintendo/i, categoryId: 'entertainment', categoryLabel: 'Eğlence', confidence: 90 },

    // Health
    { pattern: /eczane|pharmacy|acıbadem|memorial|medicana|anadolu.?sağlık/i, categoryId: 'health', categoryLabel: 'Sağlık', confidence: 90 },
    { pattern: /sgk|sigorta|sağlık.?ocağı|hastane|hospital|klinik|diş/i, categoryId: 'health', categoryLabel: 'Sağlık', confidence: 85 },

    // Education
    { pattern: /kitap|book|okul|üniversite|udemy|coursera|dershane|kurs/i, categoryId: 'education', categoryLabel: 'Eğitim', confidence: 80 },

    // Finance
    { pattern: /atm|nakit.?çekim|para.?çek|havale|eft|swift/i, categoryId: 'finance', categoryLabel: 'Finans', confidence: 85 },
    { pattern: /vergi|tax|sgk.?prim|banka.?komisyon|faiz/i, categoryId: 'finance', categoryLabel: 'Finans', confidence: 85 },

    // Rent & Housing
    { pattern: /kira|rent|aidat|apart|yönetim|emlak/i, categoryId: 'housing', categoryLabel: 'Konut', confidence: 85 },

    // Subscriptions
    { pattern: /üyelik|abonelik|subscription|premium|plus|pro/i, categoryId: 'subscriptions', categoryLabel: 'Abonelikler', confidence: 80 },
  ];

  // Pattern-based categorization
  private readonly patternRules: MerchantRule[] = [
    // Income patterns
    { pattern: /maaş|salary|ücret|wage|prim|bonus|ikramiye/i, categoryId: 'salary', categoryLabel: 'Maaş', confidence: 90 },
    { pattern: /kira.?(gelir|alacak)|rent.?income/i, categoryId: 'income', categoryLabel: 'Diğer Gelir', confidence: 85 },
    { pattern: /temettü|dividend|faiz.?gelir|interest/i, categoryId: 'income', categoryLabel: 'Diğer Gelir', confidence: 85 },
    { pattern: /iade|refund|geri.?ödeme|return/i, categoryId: 'income', categoryLabel: 'İadeler', confidence: 85 },

    // Expense patterns
    { pattern: /hediye|gift|present/i, categoryId: 'gifts', categoryLabel: 'Hediyeler', confidence: 75 },
    { pattern: /bağış|donation|yardım/i, categoryId: 'donations', categoryLabel: 'Bağışlar', confidence: 80 },
    { pattern: /tamir|bakım|servis|service|repair/i, categoryId: 'maintenance', categoryLabel: 'Bakım-Onarım', confidence: 75 },
    { pattern: /sigorta|insurance|kasko|trafik/i, categoryId: 'insurance', categoryLabel: 'Sigorta', confidence: 85 },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Categorize a transaction description
   */
  async categorize(description: string, userId?: string): Promise<CategoryResult> {
    const normalizedDesc = description.toLowerCase().trim();

    // 1. Try merchant database first
    for (const rule of this.merchantDatabase) {
      if (rule.pattern.test(normalizedDesc)) {
        return {
          categoryId: rule.categoryId,
          categoryLabel: rule.categoryLabel,
          confidence: rule.confidence,
          source: 'merchant_db',
        };
      }
    }

    // 2. Try pattern rules
    for (const rule of this.patternRules) {
      if (rule.pattern.test(normalizedDesc)) {
        return {
          categoryId: rule.categoryId,
          categoryLabel: rule.categoryLabel,
          confidence: rule.confidence,
          source: 'pattern',
        };
      }
    }

    // 3. Try user history if userId provided
    if (userId) {
      const historyMatch = await this.matchFromHistory(userId, normalizedDesc);
      if (historyMatch) {
        return historyMatch;
      }
    }

    // 4. Default category
    return {
      categoryId: 'other',
      categoryLabel: 'Diğer',
      confidence: 30,
      source: 'default',
    };
  }

  /**
   * Bulk categorize multiple transactions
   */
  async categorizeMany(
    transactions: { id: string; description: string }[],
    userId?: string
  ): Promise<Map<string, CategoryResult>> {
    const results = new Map<string, CategoryResult>();

    for (const tx of transactions) {
      const result = await this.categorize(tx.description, userId);
      results.set(tx.id, result);
    }

    return results;
  }

  /**
   * Learn from user's manual categorization
   */
  async learnFromCorrection(
    userId: string,
    description: string,
    categoryId: string,
    categoryLabel: string
  ): Promise<void> {
    // This would update a learning model in production
    // For now, we just log the correction for future pattern extraction
    this.logger.log(`User ${userId} corrected: "${description}" → ${categoryLabel}`);

    // In a production system, this could:
    // 1. Store in a learning table
    // 2. Trigger pattern extraction
    // 3. Update user-specific patterns
  }

  /**
   * Get category suggestions for ambiguous descriptions
   */
  async getSuggestions(description: string, userId?: string): Promise<CategoryResult[]> {
    const normalizedDesc = description.toLowerCase().trim();
    const suggestions: CategoryResult[] = [];

    // Add all matching merchant rules
    for (const rule of this.merchantDatabase) {
      if (rule.pattern.test(normalizedDesc)) {
        suggestions.push({
          categoryId: rule.categoryId,
          categoryLabel: rule.categoryLabel,
          confidence: rule.confidence,
          source: 'merchant_db',
        });
      }
    }

    // Add pattern matches
    for (const rule of this.patternRules) {
      if (rule.pattern.test(normalizedDesc)) {
        suggestions.push({
          categoryId: rule.categoryId,
          categoryLabel: rule.categoryLabel,
          confidence: rule.confidence,
          source: 'pattern',
        });
      }
    }

    // Add history matches if user provided
    if (userId) {
      const historyMatches = await this.getAllHistoryMatches(userId, normalizedDesc);
      suggestions.push(...historyMatches);
    }

    // Deduplicate and sort by confidence
    const unique = this.deduplicateSuggestions(suggestions);
    return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Match from user's transaction history
   */
  private async matchFromHistory(userId: string, description: string): Promise<CategoryResult | null> {
    // Find similar past transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalTransactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { description: true, categoryId: true, categoryLabel: true },
    });

    // Find exact or fuzzy matches
    const descLower = description.toLowerCase();
    const categoryCount = new Map<string, { label: string; count: number; exact: boolean }>();

    for (const tx of historicalTransactions) {
      const txDescLower = tx.description.toLowerCase();

      // Exact match
      if (txDescLower === descLower) {
        const key = `exact_${tx.categoryId}`;
        const existing = categoryCount.get(key) || { label: tx.categoryLabel, count: 0, exact: true };
        existing.count++;
        categoryCount.set(key, existing);
      }
      // Partial match (contains or is contained)
      else if (txDescLower.includes(descLower) || descLower.includes(txDescLower)) {
        const key = `partial_${tx.categoryId}`;
        const existing = categoryCount.get(key) || { label: tx.categoryLabel, count: 0, exact: false };
        existing.count++;
        categoryCount.set(key, existing);
      }
    }

    // Find best match
    let bestMatch: { categoryId: string; categoryLabel: string; confidence: number } | null = null;

    for (const [key, data] of categoryCount) {
      const [type, categoryId] = key.split('_');
      const isExact = type === 'exact';

      // Calculate confidence based on match type and frequency
      const baseConfidence = isExact ? 85 : 65;
      const frequencyBonus = Math.min(10, data.count * 2);
      const confidence = baseConfidence + frequencyBonus;

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { categoryId, categoryLabel: data.label, confidence };
      }
    }

    if (bestMatch) {
      return {
        ...bestMatch,
        source: 'user_history',
      };
    }

    return null;
  }

  /**
   * Get all history matches (not just the best one)
   */
  private async getAllHistoryMatches(userId: string, description: string): Promise<CategoryResult[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { description: true, categoryId: true, categoryLabel: true },
    });

    const descLower = description.toLowerCase();
    const matches = new Map<string, { label: string; count: number }>();

    for (const tx of transactions) {
      const txDescLower = tx.description.toLowerCase();

      if (txDescLower === descLower || txDescLower.includes(descLower) || descLower.includes(txDescLower)) {
        const existing = matches.get(tx.categoryId) || { label: tx.categoryLabel, count: 0 };
        existing.count++;
        matches.set(tx.categoryId, existing);
      }
    }

    return [...matches.entries()].map(([categoryId, data]) => ({
      categoryId,
      categoryLabel: data.label,
      confidence: Math.min(90, 60 + data.count * 5),
      source: 'user_history' as const,
    }));
  }

  /**
   * Deduplicate suggestions keeping highest confidence
   */
  private deduplicateSuggestions(suggestions: CategoryResult[]): CategoryResult[] {
    const byCategory = new Map<string, CategoryResult>();

    for (const suggestion of suggestions) {
      const existing = byCategory.get(suggestion.categoryId);
      if (!existing || suggestion.confidence > existing.confidence) {
        byCategory.set(suggestion.categoryId, suggestion);
      }
    }

    return [...byCategory.values()];
  }
}
