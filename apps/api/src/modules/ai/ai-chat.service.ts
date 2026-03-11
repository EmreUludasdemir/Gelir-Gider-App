/**
 * AI Chat Service
 * Secure chat endpoint backed by Gemini with PII masking.
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { maskPII } from './pii-masker';

type Language = 'tr' | 'en';

interface ChatSummary {
  dateRange: { from: string; to: string };
  totalsByCurrency: Array<{
    currency: string;
    income: number;
    expense: number;
    net: number;
  }>;
  topExpenseCategories: Array<{ category: string; total: number }>;
  transactionCount: number;
}

export interface ParsedTransactionResult {
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly model = 'gemini-1.5-flash';

  constructor(private prisma: PrismaService) {}

  async chat(userId: string, message: string): Promise<{ message: string }> {
    const trimmed = message?.trim();
    if (!trimmed) {
      return { message: 'Lutfen bir soru yazin.' };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        message:
          'AI servisi su anda hazir degil. GEMINI_API_KEY ayarini kontrol edin.',
      };
    }

    const language = await this.resolveLanguage(userId);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 120,
      select: {
        date: true,
        description: true,
        amount: true,
        currency: true,
        type: true,
        categoryLabel: true,
      },
    });

    if (transactions.length === 0) {
      return {
        message:
          language === 'tr'
            ? 'Henuz analiz edilecek islem yok. Once islem ekleyin.'
            : 'There is no data to analyze yet. Please add transactions first.',
      };
    }

    const summary = this.buildSummary(transactions);
    const contextLines = transactions
      .slice(0, 100)
      .map((tx) => {
        const date = tx.date.toISOString().slice(0, 10);
        const amount = Math.abs(tx.amount);
        const description = maskPII(tx.description || '');
        const category = maskPII(tx.categoryLabel || '');
        return `${date} | ${tx.type} | ${amount} ${tx.currency} | ${category} | ${description}`;
      })
      .join('\n');

    const prompt = this.buildPrompt(
      language,
      maskPII(trimmed),
      summary,
      contextLines
    );

    try {
      const responseText = await this.callGemini(apiKey, prompt);
      if (!responseText) {
        return {
          message:
            language === 'tr'
              ? 'Cevap olusturulamadi. Lutfen tekrar deneyin.'
              : 'I could not generate a response. Please try again.',
        };
      }
      return { message: responseText.trim() };
    } catch (error) {
      this.logger.error('AI chat failed', error);
      return {
        message:
          language === 'tr'
            ? 'AI yaniti alinirken hata olustu.'
            : 'An error occurred while generating the answer.',
      };
    }
  }

  async parseTransaction(
    userId: string,
    input: string
  ): Promise<ParsedTransactionResult> {
    const trimmed = input?.trim()
    if (!trimmed) {
      throw new BadRequestException('Text is required')
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new ServiceUnavailableException('AI service is not configured')
    }

    const language = await this.resolveLanguage(userId)
    const today = new Date().toISOString().slice(0, 10)
    const maskedInput = maskPII(trimmed)

    const prompt = `Parse the following financial transaction text into JSON.
Answer ONLY with valid JSON.
Language: ${language === 'tr' ? 'Turkish' : 'English'}
Today: ${today}

Allowed categories:
- Maas
- Freelance
- Yatirim
- Hediye
- Yemek
- Ulasim
- Konut
- Faturalar
- Eglence
- Saglik
- Alisveris
- Diger

Rules:
- "amount" must always be a positive number
- "type" must be "income" or "expense"
- "date" must be in YYYY-MM-DD format
- Keep the description concise

Input:
${maskedInput}

Return:
{
  "description": "string",
  "amount": 0,
  "category": "string",
  "type": "income or expense",
  "date": "${today}"
}`

    const responseText = await this.callGemini(apiKey, prompt)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new BadRequestException('AI response could not be parsed')
    }

    let parsed: Partial<ParsedTransactionResult> & { amount?: number | string }
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      throw new BadRequestException('AI response was not valid JSON')
    }

    const amount = Math.abs(Number(parsed.amount))
    const type = parsed.type === 'income' ? 'income' : parsed.type === 'expense' ? 'expense' : null

    if (!parsed.description || !Number.isFinite(amount) || !type) {
      throw new BadRequestException('AI response is incomplete')
    }

    return {
      description: parsed.description.trim(),
      amount,
      category: (parsed.category || 'Diger').trim(),
      type,
      date: /^\d{4}-\d{2}-\d{2}$/.test(parsed.date || '') ? (parsed.date as string) : today,
    }
  }

  private async resolveLanguage(userId: string): Promise<Language> {
    const preference = await this.prisma.userPreference.findUnique({
      where: { userId },
      select: { language: true },
    });
    return preference?.language === 'en' ? 'en' : 'tr';
  }

  private buildSummary(
    transactions: Array<{
      date: Date;
      amount: number;
      currency: string;
      type: string;
      categoryLabel: string;
    }>
  ): ChatSummary {
    const byCurrency = new Map<
      string,
      { income: number; expense: number }
    >();
    const expenseByCategory = new Map<string, number>();

    let from = transactions[transactions.length - 1]?.date;
    let to = transactions[0]?.date;

    for (const tx of transactions) {
      const currency = tx.currency || 'TRY';
      const bucket = byCurrency.get(currency) || { income: 0, expense: 0 };
      if (tx.type === 'income') {
        bucket.income += Math.abs(tx.amount);
      } else {
        bucket.expense += Math.abs(tx.amount);
        const cat = tx.categoryLabel || 'Other';
        expenseByCategory.set(cat, (expenseByCategory.get(cat) || 0) + Math.abs(tx.amount));
      }
      byCurrency.set(currency, bucket);
    }

    const totalsByCurrency = [...byCurrency.entries()].map(
      ([currency, totals]) => ({
        currency,
        income: Math.round(totals.income * 100) / 100,
        expense: Math.round(totals.expense * 100) / 100,
        net: Math.round((totals.income - totals.expense) * 100) / 100,
      })
    );

    const topExpenseCategories = [...expenseByCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, total]) => ({
        category: maskPII(category),
        total: Math.round(total * 100) / 100,
      }));

    if (!from || !to) {
      const now = new Date();
      from = now;
      to = now;
    }

    return {
      dateRange: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      },
      totalsByCurrency,
      topExpenseCategories,
      transactionCount: transactions.length,
    };
  }

  private buildPrompt(
    language: Language,
    question: string,
    summary: ChatSummary,
    contextLines: string
  ): string {
    const summaryLines = [
      `Date range: ${summary.dateRange.from} to ${summary.dateRange.to}`,
      `Transaction count: ${summary.transactionCount}`,
      `Totals by currency: ${summary.totalsByCurrency
        .map((t) => `${t.currency} income ${t.income}, expense ${t.expense}, net ${t.net}`)
        .join(' | ')}`,
      `Top expense categories: ${summary.topExpenseCategories
        .map((c) => `${c.category} ${c.total}`)
        .join(', ')}`,
    ].join('\n');

    return `You are a careful personal finance assistant for a budgeting app.
Answer ONLY in ${language === 'tr' ? 'Turkish' : 'English'}.
Use ONLY the provided data. If something is missing, say so.
Do NOT merge different currencies; keep totals per currency.
Be concise, specific, and helpful. Use bullet points for multi-part answers.

SUMMARY:
${summaryLines}

RECENT TRANSACTIONS (latest 100):
${contextLines}

USER QUESTION:
${question}
`;
  }

  private async callGemini(apiKey: string, prompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gemini API error: ${response.status} ${errorText}`);
      return '';
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('');

    return text || '';
  }
}
