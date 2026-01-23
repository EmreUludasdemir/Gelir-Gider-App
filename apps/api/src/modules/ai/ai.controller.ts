/**
 * AI Controller
 * Endpoints for AI-powered financial analysis
 */

import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpendingAnalyzerService } from './spending-analyzer.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { AutoCategorizerService } from './auto-categorizer.service';
import { AssistantService, ToolCall, AssistantContext } from './assistant.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  language?: 'tr' | 'en';
}

interface ChatResponse {
  reply: string;
  toolsUsed?: string[];
  data?: Record<string, unknown>;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly spendingAnalyzer: SpendingAnalyzerService,
    private readonly anomalyDetector: AnomalyDetectorService,
    private readonly autoCategorizer: AutoCategorizerService,
    private readonly assistantService: AssistantService,
  ) {}

  /**
   * Get spending insights
   */
  @Get('insights')
  async getInsights(@Request() req: { user: { userId: string } }) {
    return this.spendingAnalyzer.generateInsights(req.user.userId);
  }

  /**
   * Get spending predictions
   */
  @Get('predictions')
  async getPredictions(@Request() req: { user: { userId: string } }) {
    return this.spendingAnalyzer.predictSpending(req.user.userId);
  }

  /**
   * Get savings opportunities
   */
  @Get('savings-opportunities')
  async getSavingsOpportunities(@Request() req: { user: { userId: string } }) {
    return this.spendingAnalyzer.findSavingsOpportunities(req.user.userId);
  }

  /**
   * Get anomaly summary
   */
  @Get('anomalies')
  async getAnomalies(@Request() req: { user: { userId: string } }) {
    return this.anomalyDetector.getAnomalySummary(req.user.userId);
  }

  /**
   * Analyze specific transaction for anomalies
   */
  @Get('anomalies/:transactionId')
  async analyzeTransaction(
    @Request() req: { user: { userId: string } },
    @Query('transactionId') transactionId: string
  ) {
    return this.anomalyDetector.analyzeTransaction(req.user.userId, transactionId);
  }

  /**
   * Auto-categorize a description
   */
  @Post('categorize')
  async categorize(
    @Request() req: { user: { userId: string } },
    @Body() body: { description: string }
  ) {
    return this.autoCategorizer.categorize(body.description, req.user.userId);
  }

  /**
   * Get category suggestions
   */
  @Get('category-suggestions')
  async getCategorySuggestions(
    @Request() req: { user: { userId: string } },
    @Query('description') description: string
  ) {
    return this.autoCategorizer.getSuggestions(description, req.user.userId);
  }

  /**
   * Submit category correction for learning
   */
  @Post('learn-category')
  async learnCategory(
    @Request() req: { user: { userId: string } },
    @Body() body: { description: string; categoryId: string; categoryLabel: string }
  ) {
    await this.autoCategorizer.learnFromCorrection(
      req.user.userId,
      body.description,
      body.categoryId,
      body.categoryLabel
    );
    return { success: true };
  }

  /**
   * Chat with financial assistant (tool-use enabled)
   * POST /ai/chat
   */
  @Post('chat')
  async chat(
    @Request() req: { user: { userId: string } },
    @Body() body: ChatRequest,
  ): Promise<ChatResponse> {
    const context: AssistantContext = {
      userId: req.user.userId,
      language: body.language || 'tr',
      query: body.message,
      conversationHistory: body.conversationHistory,
    };

    // Analyze intent and determine which tools to call
    const toolCalls = this.analyzeIntent(body.message, context.language);
    const toolResults: Record<string, unknown> = {};
    const toolsUsed: string[] = [];

    // Execute tools
    for (const call of toolCalls) {
      const result = await this.assistantService.executeTool(req.user.userId, call);
      toolResults[call.name] = result.result;
      toolsUsed.push(call.name);
    }

    // Generate response based on tool results
    const reply = this.generateReply(body.message, toolResults, context.language);

    return {
      reply,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      data: Object.keys(toolResults).length > 0 ? toolResults : undefined,
    };
  }

  /**
   * Get available assistant tools
   * GET /ai/tools
   */
  @Get('tools')
  getTools() {
    return this.assistantService.getAvailableTools();
  }

  /**
   * Get assistant system prompt
   * GET /ai/system-prompt
   */
  @Get('system-prompt')
  getSystemPrompt(@Query('language') language: 'tr' | 'en' = 'tr') {
    return { prompt: this.assistantService.getSystemPrompt(language) };
  }

  /**
   * Analyze user intent and determine which tools to call
   */
  private analyzeIntent(message: string, language: 'tr' | 'en'): ToolCall[] {
    const messageLower = message.toLowerCase();
    const calls: ToolCall[] = [];

    // Pattern matching for different intents
    const patterns = {
      // Summary/overview queries
      summary: [
        /özet|genel durum|bu ay|nasıl|ne kadar harcadım|toplam/i,
        /summary|overview|this month|how much|spent|total/i,
      ],
      // Transaction queries
      transactions: [
        /işlem|harcama|son|liste|nereye harcadım|alışveriş/i,
        /transaction|expense|recent|list|where did i spend|shopping/i,
      ],
      // Budget queries
      budgets: [
        /bütçe|limit|aştım mı|kaldı mı|market bütçe|fatura bütçe/i,
        /budget|limit|exceed|remaining|grocery budget|bill budget/i,
      ],
      // Savings goal queries
      savings: [
        /tasarruf|hedef|biriktir|koydum|ne kadar kaldı/i,
        /savings|goal|save|put aside|how much left/i,
      ],
      // Bill queries
      bills: [
        /fatura|ödeme|yaklaşan|son ödeme|vadesi/i,
        /bill|payment|upcoming|due date|deadline/i,
      ],
      // Category spending
      categorySpending: [
        /kategori|en çok|hangi kategoride|harcama dağılımı/i,
        /category|most spent|which category|spending breakdown/i,
      ],
      // Month comparison
      compare: [
        /karşılaştır|geçen ay|önceki ay|fark/i,
        /compare|last month|previous month|difference/i,
      ],
    };

    // Check each pattern
    if (patterns.summary.some((p) => p.test(messageLower))) {
      const monthMatch = messageLower.match(/(\d+)\s*(ay|month)/);
      const args: Record<string, unknown> = {};
      if (monthMatch) {
        args.month = parseInt(monthMatch[1]);
      }
      calls.push({ name: 'get_summary', arguments: args });
    }

    if (patterns.transactions.some((p) => p.test(messageLower))) {
      const args: Record<string, unknown> = { limit: 10 };

      // Check for type filter
      if (/gelir|income|maaş|salary/i.test(messageLower)) {
        args.type = 'income';
      } else if (/gider|expense|harcama/i.test(messageLower)) {
        args.type = 'expense';
      }

      // Check for category filter
      const categoryPatterns: Record<string, RegExp> = {
        'market': /market|grocery|alışveriş/i,
        'yemek': /yemek|restaurant|food|restoran/i,
        'ulaşım': /ulaşım|transport|benzin|fuel/i,
        'fatura': /fatura|bill|elektrik|su|doğalgaz/i,
      };

      for (const [category, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.test(messageLower)) {
          args.category = category;
          break;
        }
      }

      calls.push({ name: 'get_transactions', arguments: args });
    }

    if (patterns.budgets.some((p) => p.test(messageLower))) {
      calls.push({ name: 'get_budgets', arguments: {} });
    }

    if (patterns.savings.some((p) => p.test(messageLower))) {
      calls.push({ name: 'get_savings_goals', arguments: {} });
    }

    if (patterns.bills.some((p) => p.test(messageLower))) {
      const daysMatch = messageLower.match(/(\d+)\s*(gün|day)/);
      const args: Record<string, unknown> = {};
      if (daysMatch) {
        args.daysAhead = parseInt(daysMatch[1]);
      }
      calls.push({ name: 'get_bills', arguments: args });
    }

    if (patterns.categorySpending.some((p) => p.test(messageLower))) {
      // Default to current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      calls.push({
        name: 'get_category_spending',
        arguments: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });
    }

    if (patterns.compare.some((p) => p.test(messageLower))) {
      const now = new Date();
      const thisMonth = now.getMonth() + 1;
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
      const lastYear = thisMonth === 1 ? thisYear - 1 : thisYear;

      calls.push({
        name: 'compare_months',
        arguments: {
          month1: lastMonth,
          year1: lastYear,
          month2: thisMonth,
          year2: thisYear,
        },
      });
    }

    // If no specific pattern matched, default to summary
    if (calls.length === 0) {
      calls.push({ name: 'get_summary', arguments: {} });
    }

    return calls;
  }

  /**
   * Generate natural language reply based on tool results
   */
  private generateReply(
    message: string,
    toolResults: Record<string, unknown>,
    language: 'tr' | 'en',
  ): string {
    const isTurkish = language === 'tr';
    const parts: string[] = [];

    // Format summary
    if (toolResults['get_summary']) {
      const summary = toolResults['get_summary'] as {
        period: string;
        totalIncome: number;
        totalExpense: number;
        balance: number;
        transactionCount: number;
        topCategories: { category: string; amount: number }[];
      };

      if (isTurkish) {
        parts.push(`📊 **${summary.period} Özeti**`);
        parts.push(`• Toplam Gelir: ${this.formatCurrency(summary.totalIncome, 'TRY')}`);
        parts.push(`• Toplam Gider: ${this.formatCurrency(summary.totalExpense, 'TRY')}`);
        parts.push(`• Net Durum: ${this.formatCurrency(summary.balance, 'TRY')} ${summary.balance >= 0 ? '✅' : '⚠️'}`);

        if (summary.topCategories.length > 0) {
          parts.push('\n**En Çok Harcanan Kategoriler:**');
          summary.topCategories.slice(0, 3).forEach((cat, i) => {
            parts.push(`${i + 1}. ${cat.category}: ${this.formatCurrency(cat.amount, 'TRY')}`);
          });
        }
      } else {
        parts.push(`📊 **${summary.period} Summary**`);
        parts.push(`• Total Income: ${this.formatCurrency(summary.totalIncome, 'USD')}`);
        parts.push(`• Total Expenses: ${this.formatCurrency(summary.totalExpense, 'USD')}`);
        parts.push(`• Net Balance: ${this.formatCurrency(summary.balance, 'USD')} ${summary.balance >= 0 ? '✅' : '⚠️'}`);

        if (summary.topCategories.length > 0) {
          parts.push('\n**Top Spending Categories:**');
          summary.topCategories.slice(0, 3).forEach((cat, i) => {
            parts.push(`${i + 1}. ${cat.category}: ${this.formatCurrency(cat.amount, 'USD')}`);
          });
        }
      }
    }

    // Format budgets
    if (toolResults['get_budgets']) {
      const data = toolResults['get_budgets'] as {
        budgets: {
          category: string;
          limit: number;
          spent: number;
          remaining: number;
          percentage: number;
          status: string;
        }[];
      };

      if (data.budgets.length > 0) {
        if (isTurkish) {
          parts.push('\n💰 **Bütçe Durumu:**');
          data.budgets.forEach((b) => {
            const statusEmoji = b.status === 'exceeded' ? '🔴' : b.status === 'warning' ? '🟡' : '🟢';
            parts.push(`${statusEmoji} ${b.category}: ${this.formatCurrency(b.spent, 'TRY')} / ${this.formatCurrency(b.limit, 'TRY')} (%${b.percentage})`);
          });
        } else {
          parts.push('\n💰 **Budget Status:**');
          data.budgets.forEach((b) => {
            const statusEmoji = b.status === 'exceeded' ? '🔴' : b.status === 'warning' ? '🟡' : '🟢';
            parts.push(`${statusEmoji} ${b.category}: ${this.formatCurrency(b.spent, 'USD')} / ${this.formatCurrency(b.limit, 'USD')} (${b.percentage}%)`);
          });
        }
      } else {
        parts.push(isTurkish ? '\n💰 Henüz bütçe tanımlanmamış.' : '\n💰 No budgets defined yet.');
      }
    }

    // Format savings goals
    if (toolResults['get_savings_goals']) {
      const data = toolResults['get_savings_goals'] as {
        goals: {
          name: string;
          targetAmount: number;
          currentAmount: number;
          percentage: number;
          targetDate?: string;
        }[];
      };

      if (data.goals.length > 0) {
        if (isTurkish) {
          parts.push('\n🎯 **Tasarruf Hedefleri:**');
          data.goals.forEach((g) => {
            parts.push(`• ${g.name}: ${this.formatCurrency(g.currentAmount, 'TRY')} / ${this.formatCurrency(g.targetAmount, 'TRY')} (%${g.percentage})`);
          });
        } else {
          parts.push('\n🎯 **Savings Goals:**');
          data.goals.forEach((g) => {
            parts.push(`• ${g.name}: ${this.formatCurrency(g.currentAmount, 'USD')} / ${this.formatCurrency(g.targetAmount, 'USD')} (${g.percentage}%)`);
          });
        }
      } else {
        parts.push(isTurkish ? '\n🎯 Henüz tasarruf hedefi yok.' : '\n🎯 No savings goals yet.');
      }
    }

    // Format bills
    if (toolResults['get_bills']) {
      const data = toolResults['get_bills'] as {
        upcomingBills: {
          name: string;
          amount: number;
          dueDate: string;
          daysUntilDue: number;
        }[];
        totalDue: number;
      };

      if (data.upcomingBills.length > 0) {
        if (isTurkish) {
          parts.push('\n📅 **Yaklaşan Faturalar:**');
          data.upcomingBills.slice(0, 5).forEach((b) => {
            const urgency = b.daysUntilDue <= 3 ? '🔴' : b.daysUntilDue <= 7 ? '🟡' : '🟢';
            parts.push(`${urgency} ${b.name}: ${this.formatCurrency(b.amount, 'TRY')} (${b.daysUntilDue} gün)`);
          });
          parts.push(`\n**Toplam:** ${this.formatCurrency(data.totalDue, 'TRY')}`);
        } else {
          parts.push('\n📅 **Upcoming Bills:**');
          data.upcomingBills.slice(0, 5).forEach((b) => {
            const urgency = b.daysUntilDue <= 3 ? '🔴' : b.daysUntilDue <= 7 ? '🟡' : '🟢';
            parts.push(`${urgency} ${b.name}: ${this.formatCurrency(b.amount, 'USD')} (${b.daysUntilDue} days)`);
          });
          parts.push(`\n**Total:** ${this.formatCurrency(data.totalDue, 'USD')}`);
        }
      } else {
        parts.push(isTurkish ? '\n📅 Yaklaşan fatura yok.' : '\n📅 No upcoming bills.');
      }
    }

    // Format transactions
    if (toolResults['get_transactions']) {
      const data = toolResults['get_transactions'] as {
        count: number;
        transactions: {
          date: string;
          description: string;
          amount: number;
          type: string;
          category: string;
        }[];
      };

      if (data.transactions.length > 0) {
        if (isTurkish) {
          parts.push(`\n📋 **Son ${data.count} İşlem:**`);
          data.transactions.slice(0, 5).forEach((t) => {
            const emoji = t.type === 'income' ? '💵' : '💸';
            parts.push(`${emoji} ${t.date} - ${t.description}: ${this.formatCurrency(Math.abs(t.amount), 'TRY')}`);
          });
        } else {
          parts.push(`\n📋 **Last ${data.count} Transactions:**`);
          data.transactions.slice(0, 5).forEach((t) => {
            const emoji = t.type === 'income' ? '💵' : '💸';
            parts.push(`${emoji} ${t.date} - ${t.description}: ${this.formatCurrency(Math.abs(t.amount), 'USD')}`);
          });
        }
      }
    }

    // Format comparison
    if (toolResults['compare_months']) {
      const data = toolResults['compare_months'] as {
        comparison: {
          month1: { month: number; year: number; income: number; expense: number; balance: number };
          month2: { month: number; year: number; income: number; expense: number; balance: number };
          incomeChange: number;
          expenseChange: number;
          incomeChangePercent: number;
          expenseChangePercent: number;
        };
      };

      const c = data.comparison;
      if (isTurkish) {
        parts.push('\n📈 **Aylık Karşılaştırma:**');
        parts.push(`Geçen ay → Bu ay:`);
        parts.push(`• Gelir: ${this.formatCurrency(c.month1.income, 'TRY')} → ${this.formatCurrency(c.month2.income, 'TRY')} (${c.incomeChangePercent >= 0 ? '+' : ''}${c.incomeChangePercent}%)`);
        parts.push(`• Gider: ${this.formatCurrency(c.month1.expense, 'TRY')} → ${this.formatCurrency(c.month2.expense, 'TRY')} (${c.expenseChangePercent >= 0 ? '+' : ''}${c.expenseChangePercent}%)`);
      } else {
        parts.push('\n📈 **Monthly Comparison:**');
        parts.push(`Last month → This month:`);
        parts.push(`• Income: ${this.formatCurrency(c.month1.income, 'USD')} → ${this.formatCurrency(c.month2.income, 'USD')} (${c.incomeChangePercent >= 0 ? '+' : ''}${c.incomeChangePercent}%)`);
        parts.push(`• Expenses: ${this.formatCurrency(c.month1.expense, 'USD')} → ${this.formatCurrency(c.month2.expense, 'USD')} (${c.expenseChangePercent >= 0 ? '+' : ''}${c.expenseChangePercent}%)`);
      }
    }

    // Format category spending
    if (toolResults['get_category_spending']) {
      const data = toolResults['get_category_spending'] as {
        period: string;
        totalSpending: number;
        categories: { category: string; amount: number; percentage: number }[];
      };

      if (data.categories.length > 0) {
        if (isTurkish) {
          parts.push('\n📊 **Kategori Dağılımı:**');
          data.categories.slice(0, 5).forEach((c) => {
            parts.push(`• ${c.category}: ${this.formatCurrency(c.amount, 'TRY')} (%${c.percentage})`);
          });
        } else {
          parts.push('\n📊 **Category Breakdown:**');
          data.categories.slice(0, 5).forEach((c) => {
            parts.push(`• ${c.category}: ${this.formatCurrency(c.amount, 'USD')} (${c.percentage}%)`);
          });
        }
      }
    }

    if (parts.length === 0) {
      return isTurkish
        ? 'Üzgünüm, bu soruyu anlayamadım. Finansal durumunuz hakkında soru sorabilirsiniz.'
        : "Sorry, I couldn't understand that question. You can ask me about your financial status.";
    }

    return parts.join('\n');
  }

  /**
   * Format currency based on locale
   */
  private formatCurrency(amount: number, currency: string): string {
    if (currency === 'TRY') {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
