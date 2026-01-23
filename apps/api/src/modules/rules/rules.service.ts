import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface CategoryRule {
  id: string;
  userId: string;
  pattern: string;
  matchType: 'contains' | 'startsWith' | 'exact' | 'regex';
  categoryId: string;
  categoryLabel: string;
  merchant?: string;
  isRecurring?: boolean;
  priority: number;
  hitCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface RuleSuggestion {
  pattern: string;
  matchType: 'contains' | 'startsWith' | 'exact';
  categoryId: string;
  categoryLabel: string;
  confidence: number;
  exampleTransactions: string[];
}

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all rules for a user
   */
  async getRules(userId: string): Promise<CategoryRule[]> {
    const rules = await this.prisma.categoryRule.findMany({
      where: { userId, isActive: true },
      orderBy: [{ priority: 'desc' }, { hitCount: 'desc' }],
    });
    return rules as CategoryRule[];
  }

  /**
   * Create a new categorization rule
   */
  async createRule(
    userId: string,
    data: {
      pattern: string;
      matchType: 'contains' | 'startsWith' | 'exact' | 'regex';
      categoryId: string;
      categoryLabel: string;
      merchant?: string;
      isRecurring?: boolean;
      priority?: number;
    },
  ): Promise<CategoryRule> {
    const rule = await this.prisma.categoryRule.create({
      data: {
        userId,
        pattern: data.pattern.toLowerCase(),
        matchType: data.matchType,
        categoryId: data.categoryId,
        categoryLabel: data.categoryLabel,
        merchant: data.merchant,
        isRecurring: data.isRecurring ?? false,
        priority: data.priority ?? 0,
        hitCount: 0,
        isActive: true,
      },
    });
    return rule as CategoryRule;
  }

  /**
   * Update a rule
   */
  async updateRule(
    userId: string,
    ruleId: string,
    data: Partial<{
      pattern: string;
      matchType: 'contains' | 'startsWith' | 'exact' | 'regex';
      categoryId: string;
      categoryLabel: string;
      merchant: string;
      isRecurring: boolean;
      priority: number;
      isActive: boolean;
    }>,
  ): Promise<CategoryRule> {
    const rule = await this.prisma.categoryRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundException('Kural bulunamadı');
    }

    const updated = await this.prisma.categoryRule.update({
      where: { id: ruleId },
      data: {
        ...data,
        pattern: data.pattern?.toLowerCase(),
      },
    });
    return updated as CategoryRule;
  }

  /**
   * Delete a rule
   */
  async deleteRule(userId: string, ruleId: string): Promise<void> {
    const rule = await this.prisma.categoryRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundException('Kural bulunamadı');
    }

    await this.prisma.categoryRule.delete({ where: { id: ruleId } });
  }

  /**
   * Apply rules to a transaction description and return matching category
   */
  async applyRules(
    userId: string,
    description: string,
  ): Promise<{ categoryId: string; categoryLabel: string; ruleId: string } | null> {
    const rules = await this.getRules(userId);
    const normalizedDesc = description.toLowerCase();

    for (const rule of rules) {
      let matches = false;

      switch (rule.matchType) {
        case 'exact':
          matches = normalizedDesc === rule.pattern;
          break;
        case 'startsWith':
          matches = normalizedDesc.startsWith(rule.pattern);
          break;
        case 'contains':
          matches = normalizedDesc.includes(rule.pattern);
          break;
        case 'regex':
          try {
            matches = new RegExp(rule.pattern, 'i').test(description);
          } catch {
            matches = false;
          }
          break;
      }

      if (matches) {
        // Increment hit count
        await this.prisma.categoryRule.update({
          where: { id: rule.id },
          data: { hitCount: { increment: 1 } },
        });

        return {
          categoryId: rule.categoryId,
          categoryLabel: rule.categoryLabel,
          ruleId: rule.id,
        };
      }
    }

    return null;
  }

  /**
   * Generate rule suggestions based on user's corrections
   * Called when user manually changes a transaction's category
   */
  async generateRuleSuggestion(
    userId: string,
    description: string,
    newCategoryId: string,
    newCategoryLabel: string,
  ): Promise<RuleSuggestion | null> {
    // Find similar transactions
    const similarTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId: { not: newCategoryId },
        description: {
          contains: this.extractKeyword(description),
          mode: 'insensitive',
        },
      },
      take: 10,
    });

    if (similarTransactions.length < 2) {
      return null; // Not enough similar transactions
    }

    // Find common pattern
    const keyword = this.extractKeyword(description);

    return {
      pattern: keyword,
      matchType: 'contains',
      categoryId: newCategoryId,
      categoryLabel: newCategoryLabel,
      confidence: Math.min(0.9, 0.5 + (similarTransactions.length * 0.1)),
      exampleTransactions: similarTransactions.slice(0, 3).map((t) => t.description),
    };
  }

  /**
   * Extract keyword from description for pattern matching
   */
  private extractKeyword(description: string): string {
    // Remove common words and extract meaningful parts
    const commonWords = [
      'ödeme', 'payment', 'transfer', 'havale', 'eft',
      'pos', 'atm', 'işlem', 'gönderme', 'alma',
    ];

    const words = description.toLowerCase().split(/\s+/);
    const keywords = words.filter(
      (w) => w.length > 3 && !commonWords.includes(w) && !/^\d+$/.test(w),
    );

    // Return the most significant keyword (usually merchant name)
    return keywords[0] || description.toLowerCase().substring(0, 20);
  }

  /**
   * Learn from user correction - creates or updates rules automatically
   */
  async learnFromCorrection(
    userId: string,
    transactionId: string,
    oldCategoryId: string,
    newCategoryId: string,
    newCategoryLabel: string,
  ): Promise<{ ruleCreated: boolean; suggestion?: RuleSuggestion }> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      return { ruleCreated: false };
    }

    // Check if rule already exists for this pattern
    const keyword = this.extractKeyword(transaction.description);
    const existingRule = await this.prisma.categoryRule.findFirst({
      where: {
        userId,
        pattern: { contains: keyword },
        isActive: true,
      },
    });

    if (existingRule) {
      // Update existing rule if it matches wrong category
      if (existingRule.categoryId !== newCategoryId) {
        await this.updateRule(userId, existingRule.id, {
          categoryId: newCategoryId,
          categoryLabel: newCategoryLabel,
        });
      }
      return { ruleCreated: false };
    }

    // Generate suggestion
    const suggestion = await this.generateRuleSuggestion(
      userId,
      transaction.description,
      newCategoryId,
      newCategoryLabel,
    );

    return { ruleCreated: false, suggestion };
  }

  /**
   * Accept a rule suggestion and create the rule
   */
  async acceptSuggestion(
    userId: string,
    suggestion: RuleSuggestion,
  ): Promise<CategoryRule> {
    return this.createRule(userId, {
      pattern: suggestion.pattern,
      matchType: suggestion.matchType,
      categoryId: suggestion.categoryId,
      categoryLabel: suggestion.categoryLabel,
      priority: Math.round(suggestion.confidence * 10),
    });
  }

  /**
   * Get rule statistics for a user
   */
  async getRuleStats(userId: string): Promise<{
    totalRules: number;
    activeRules: number;
    totalHits: number;
    topRules: CategoryRule[];
  }> {
    const [totalRules, activeRules, hitSum, topRules] = await Promise.all([
      this.prisma.categoryRule.count({ where: { userId } }),
      this.prisma.categoryRule.count({ where: { userId, isActive: true } }),
      this.prisma.categoryRule.aggregate({
        where: { userId },
        _sum: { hitCount: true },
      }),
      this.prisma.categoryRule.findMany({
        where: { userId, isActive: true },
        orderBy: { hitCount: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalRules,
      activeRules,
      totalHits: hitSum._sum.hitCount || 0,
      topRules: topRules as CategoryRule[],
    };
  }
}
