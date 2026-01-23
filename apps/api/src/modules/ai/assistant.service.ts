import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
}

export interface AssistantContext {
  userId: string;
  language: 'tr' | 'en';
  query: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Available tools that the AI can call
   */
  getAvailableTools(): Tool[] {
    return [
      {
        name: 'get_transactions',
        description: 'Get user transactions with optional filters. Returns recent transactions.',
        parameters: {
          limit: { type: 'number', description: 'Number of transactions to return (default: 20, max: 100)' },
          type: { type: 'string', description: 'Filter by type: "income" or "expense"' },
          category: { type: 'string', description: 'Filter by category label' },
          startDate: { type: 'string', description: 'Filter from date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'Filter to date (YYYY-MM-DD)' },
        },
      },
      {
        name: 'get_summary',
        description: 'Get financial summary including total income, expense, balance, and category breakdown for current month.',
        parameters: {
          month: { type: 'number', description: 'Month (1-12), defaults to current month' },
          year: { type: 'number', description: 'Year, defaults to current year' },
        },
      },
      {
        name: 'get_budgets',
        description: 'Get all budgets with current spending status.',
        parameters: {},
      },
      {
        name: 'get_savings_goals',
        description: 'Get all savings goals with progress information.',
        parameters: {},
      },
      {
        name: 'get_bills',
        description: 'Get upcoming bills and their due dates.',
        parameters: {
          daysAhead: { type: 'number', description: 'Number of days to look ahead (default: 30)' },
        },
      },
      {
        name: 'get_category_spending',
        description: 'Get spending breakdown by category for a period.',
        parameters: {
          startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)', required: true },
          endDate: { type: 'string', description: 'End date (YYYY-MM-DD)', required: true },
        },
      },
      {
        name: 'compare_months',
        description: 'Compare spending between two months.',
        parameters: {
          month1: { type: 'number', description: 'First month (1-12)', required: true },
          year1: { type: 'number', description: 'First year', required: true },
          month2: { type: 'number', description: 'Second month (1-12)', required: true },
          year2: { type: 'number', description: 'Second year', required: true },
        },
      },
    ];
  }

  /**
   * Execute a tool call and return the result
   */
  async executeTool(userId: string, call: ToolCall): Promise<ToolResult> {
    this.logger.debug(`Executing tool: ${call.name}`, call.arguments);

    try {
      let result: unknown;

      switch (call.name) {
        case 'get_transactions':
          result = await this.getTransactions(userId, call.arguments);
          break;
        case 'get_summary':
          result = await this.getSummary(userId, call.arguments);
          break;
        case 'get_budgets':
          result = await this.getBudgets(userId);
          break;
        case 'get_savings_goals':
          result = await this.getSavingsGoals(userId);
          break;
        case 'get_bills':
          result = await this.getBills(userId, call.arguments);
          break;
        case 'get_category_spending':
          result = await this.getCategorySpending(userId, call.arguments);
          break;
        case 'compare_months':
          result = await this.compareMonths(userId, call.arguments);
          break;
        default:
          result = { error: `Unknown tool: ${call.name}` };
      }

      return { name: call.name, result };
    } catch (error) {
      this.logger.error(`Tool execution failed: ${call.name}`, error);
      return { name: call.name, result: { error: 'Tool execution failed' } };
    }
  }

  private async getTransactions(userId: string, args: Record<string, unknown>) {
    const limit = Math.min(Number(args.limit) || 20, 100);
    const type = args.type as string | undefined;
    const category = args.category as string | undefined;
    const startDate = args.startDate as string | undefined;
    const endDate = args.endDate as string | undefined;

    const where: any = { userId };
    if (type) where.type = type;
    if (category) where.categoryLabel = { contains: category, mode: 'insensitive' };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        date: true,
        description: true,
        amount: true,
        type: true,
        categoryLabel: true,
        currency: true,
      },
    });

    return {
      count: transactions.length,
      transactions: transactions.map((t) => ({
        date: t.date.toISOString().split('T')[0],
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.categoryLabel,
        currency: t.currency,
      })),
    };
  }

  private async getSummary(userId: string, args: Record<string, unknown>) {
    const now = new Date();
    const month = Number(args.month) || now.getMonth() + 1;
    const year = Number(args.year) || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryBreakdown[t.categoryLabel] =
          (categoryBreakdown[t.categoryLabel] || 0) + Math.abs(t.amount);
      });

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transactionCount: transactions.length,
      topCategories: Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount })),
    };
  }

  private async getBudgets(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const results = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.prisma.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            categoryId: budget.categoryId,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });

        const spentAmount = Math.abs(spent._sum.amount || 0);
        const percentage = (spentAmount / budget.limitAmount) * 100;

        return {
          category: budget.categoryLabel,
          limit: budget.limitAmount,
          spent: spentAmount,
          remaining: Math.max(0, budget.limitAmount - spentAmount),
          percentage: Math.round(percentage),
          status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok',
        };
      }),
    );

    return { budgets: results };
  }

  private async getSavingsGoals(userId: string) {
    const goals = await this.prisma.savingsGoal.findMany({
      where: { userId },
    });

    return {
      goals: goals.map((g) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        remaining: g.targetAmount - g.currentAmount,
        percentage: Math.round((g.currentAmount / g.targetAmount) * 100),
        targetDate: g.deadline?.toISOString().split('T')[0],
      })),
    };
  }

  private async getBills(userId: string, args: Record<string, unknown>) {
    const daysAhead = Number(args.daysAhead) || 30;
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const bills = await this.prisma.bill.findMany({
      where: {
        userId,
        dueDate: { gte: now, lte: futureDate },
        isPaid: false,
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      upcomingBills: bills.map((b) => ({
        name: b.name,
        amount: b.amount,
        dueDate: b.dueDate.toISOString().split('T')[0],
        daysUntilDue: Math.ceil(
          (b.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        ),
        isRecurring: b.frequency !== 'once',
      })),
      totalDue: bills.reduce((sum, b) => sum + b.amount, 0),
    };
  }

  private async getCategorySpending(userId: string, args: Record<string, unknown>) {
    const startDate = new Date(args.startDate as string);
    const endDate = new Date(args.endDate as string);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: { gte: startDate, lte: endDate },
      },
    });

    const categorySpending: Record<string, number> = {};
    transactions.forEach((t) => {
      categorySpending[t.categoryLabel] =
        (categorySpending[t.categoryLabel] || 0) + Math.abs(t.amount);
    });

    const total = Object.values(categorySpending).reduce((a, b) => a + b, 0);

    return {
      period: `${args.startDate} to ${args.endDate}`,
      totalSpending: total,
      categories: Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: Math.round((amount / total) * 100),
        })),
    };
  }

  private async compareMonths(userId: string, args: Record<string, unknown>) {
    const getSummaryForMonth = async (month: number, year: number) => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      });

      const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return { month, year, income, expense, balance: income - expense };
    };

    const [month1Data, month2Data] = await Promise.all([
      getSummaryForMonth(Number(args.month1), Number(args.year1)),
      getSummaryForMonth(Number(args.month2), Number(args.year2)),
    ]);

    return {
      comparison: {
        month1: month1Data,
        month2: month2Data,
        incomeChange: month2Data.income - month1Data.income,
        expenseChange: month2Data.expense - month1Data.expense,
        balanceChange: month2Data.balance - month1Data.balance,
        incomeChangePercent:
          month1Data.income > 0
            ? Math.round(((month2Data.income - month1Data.income) / month1Data.income) * 100)
            : 0,
        expenseChangePercent:
          month1Data.expense > 0
            ? Math.round(((month2Data.expense - month1Data.expense) / month1Data.expense) * 100)
            : 0,
      },
    };
  }

  /**
   * Generate system prompt with tools description
   */
  getSystemPrompt(language: 'tr' | 'en'): string {
    const tools = this.getAvailableTools();
    const toolsDescription = tools
      .map(
        (t) =>
          `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`,
      )
      .join('\n');

    return language === 'tr'
      ? `Sen Lumina, akıllı bir finansal asistandsın. Kullanıcının finansal verilerini analiz edebilir ve sorularını yanıtlayabilirsin.

Kullanabileceğin araçlar:
${toolsDescription}

Kurallar:
1. Türkçe yanıt ver.
2. Araçları kullanarak gerçek verilere eriş, tahmin yapma.
3. Para birimi olarak ₺ kullan ve formatı: 1.234,56 ₺
4. Destekleyici ve profesyonel ol.
5. Kullanıcı bir şey sorduğunda önce ilgili aracı çağır, sonra sonuca göre yanıt ver.`
      : `You are Lumina, a smart financial assistant. You can analyze the user's financial data and answer their questions.

Available tools:
${toolsDescription}

Rules:
1. Respond in English.
2. Use tools to access real data, don't guess.
3. Format currency as: $1,234.56
4. Be supportive and professional.
5. When the user asks something, first call the relevant tool, then respond based on the result.`;
  }
}
