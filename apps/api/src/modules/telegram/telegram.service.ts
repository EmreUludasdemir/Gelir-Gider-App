import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BudgetsService } from '../budgets/budgets.service';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: { id: number };
    data: string;
    message: { chat: { id: number } };
  };
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

interface ParsedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  categoryLabel: string;
}

const INCOME_KEYWORDS = ['maaş', 'maas', 'gelir', 'kazanç', 'kazanc', 'ödeme aldım', 'para geldi'];
const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; label: string }> = {
  food: { keywords: ['yemek', 'restoran', 'market', 'kafe', 'cafe', 'kahve'], label: 'Yemek' },
  transport: { keywords: ['benzin', 'yakıt', 'taksi', 'uber', 'otobüs', 'metro'], label: 'Ulaşım' },
  shopping: { keywords: ['alışveriş', 'alisveris', 'giyim', 'ayakkabı'], label: 'Alışveriş' },
  bills: { keywords: ['fatura', 'elektrik', 'su', 'doğalgaz', 'internet'], label: 'Faturalar' },
  entertainment: { keywords: ['sinema', 'netflix', 'spotify', 'oyun', 'eğlence'], label: 'Eğlence' },
  health: { keywords: ['ilaç', 'doktor', 'hastane', 'eczane', 'sağlık'], label: 'Sağlık' },
  salary: { keywords: ['maaş', 'maas', 'gelir'], label: 'Maaş' },
};

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string;
  private apiUrl: string;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateId = 0;

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private budgetsService: BudgetsService,
  ) {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async onModuleInit() {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, Telegram bot disabled');
      return;
    }

    try {
      const me = await this.callApi<{ username: string }>('getMe');
      this.logger.log(`Telegram bot initialized: @${me.username}`);
      this.startPolling();
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private startPolling() {
    this.pollingInterval = setInterval(() => this.pollUpdates(), 1000);
  }

  private async pollUpdates() {
    try {
      const updates = await this.callApi<TelegramUpdate[]>('getUpdates', {
        offset: this.lastUpdateId + 1,
        timeout: 0,
      });

      for (const update of updates) {
        this.lastUpdateId = update.update_id;
        await this.handleUpdate(update);
      }
    } catch (error) {
      this.logger.error('Polling error:', error);
    }
  }

  private async handleUpdate(update: TelegramUpdate) {
    if (update.message?.text) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async handleMessage(message: TelegramUpdate['message']) {
    if (!message) return;

    const chatId = message.chat.id;
    const text = message.text || '';
    const telegramId = message.from.id.toString();

    // Commands
    if (text.startsWith('/')) {
      const [command, ...args] = text.split(' ');

      switch (command) {
        case '/start':
          await this.handleStart(chatId, telegramId, args[0]);
          break;
        case '/ozet':
          await this.handleSummary(chatId, telegramId);
          break;
        case '/ekle':
          await this.handleAddTransaction(chatId, telegramId, args.join(' '));
          break;
        case '/butce':
          await this.handleBudget(chatId, telegramId);
          break;
        case '/son':
          await this.handleRecent(chatId, telegramId);
          break;
        case '/yardim':
          await this.handleHelp(chatId);
          break;
        default:
          await this.sendMessage(chatId, '❓ Bilinmeyen komut. /yardim yazın.');
      }
    } else {
      // Quick transaction parsing
      await this.handleQuickTransaction(chatId, telegramId, text);
    }
  }

  private async handleStart(chatId: number, telegramId: string, linkCode?: string) {
    if (linkCode) {
      // Link account
      const linked = await this.linkAccount(telegramId, linkCode);
      if (linked) {
        await this.sendMessage(
          chatId,
          '✅ Hesabınız başarıyla bağlandı!\n\n' +
          'Artık bu komutları kullanabilirsiniz:\n' +
          '/ozet - Aylık özet\n' +
          '/ekle [açıklama] [tutar] - İşlem ekle\n' +
          '/butce - Bütçe durumu\n' +
          '/son - Son 5 işlem'
        );
      } else {
        await this.sendMessage(chatId, '❌ Geçersiz veya süresi dolmuş bağlantı kodu.');
      }
    } else {
      await this.sendMessage(
        chatId,
        '👋 *Gelir-Gider Bot*\'a hoş geldiniz!\n\n' +
        '📱 Hesabınızı bağlamak için:\n' +
        '1. Web uygulamasında Profil > Telegram Bağla\'ya gidin\n' +
        '2. Aldığınız kodu buraya gönderin\n\n' +
        '📋 *Komutlar:*\n' +
        '/ozet - Aylık özet\n' +
        '/ekle - Yeni işlem ekle\n' +
        '/butce - Bütçe durumu\n' +
        '/son - Son 5 işlem\n' +
        '/yardim - Yardım',
        { parse_mode: 'Markdown' }
      );
    }
  }

  private async handleSummary(chatId: number, telegramId: string) {
    const userId = await this.getUserId(telegramId);
    if (!userId) {
      await this.sendMessage(chatId, '❌ Hesabınız bağlı değil. /start komutu ile bağlayın.');
      return;
    }

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth },
        },
      });

      let income = 0, expense = 0;
      transactions.forEach(tx => {
        if (tx.type === 'income') income += tx.amount;
        else expense += Math.abs(tx.amount);
      });

      const monthName = now.toLocaleString('tr-TR', { month: 'long' });

      await this.sendMessage(
        chatId,
        `📊 *${monthName} ${now.getFullYear()} Özeti*\n\n` +
        `💰 Gelir: ${income.toLocaleString('tr-TR')} ₺\n` +
        `💸 Gider: ${expense.toLocaleString('tr-TR')} ₺\n` +
        `📈 Bakiye: ${(income - expense).toLocaleString('tr-TR')} ₺\n` +
        `📝 İşlem: ${transactions.length}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      this.logger.error('Summary error:', error);
      await this.sendMessage(chatId, '❌ Özet alınırken hata oluştu.');
    }
  }

  private async handleAddTransaction(chatId: number, telegramId: string, text: string) {
    const userId = await this.getUserId(telegramId);
    if (!userId) {
      await this.sendMessage(chatId, '❌ Hesabınız bağlı değil.');
      return;
    }

    const parsed = this.parseTransaction(text);
    if (!parsed) {
      await this.sendMessage(
        chatId,
        '❓ Anlayamadım.\n\n' +
        'Örnekler:\n' +
        '• /ekle market 150\n' +
        '• /ekle maaş 25000\n' +
        '• /ekle benzin 500'
      );
      return;
    }

    try {
      await this.prisma.transaction.create({
        data: {
          user: { connect: { id: userId } },
          description: parsed.description,
          amount: parsed.type === 'expense' ? -parsed.amount : parsed.amount,
          type: parsed.type,
          categoryId: parsed.categoryId,
          categoryLabel: parsed.categoryLabel,
          date: new Date(),
          currency: 'TRY',
          source: 'telegram',
          tags: '',
          accountId: 'default',
        },
      });

      const emoji = parsed.type === 'income' ? '💰' : '💸';
      await this.sendMessage(
        chatId,
        `${emoji} *İşlem Eklendi*\n\n` +
        `📝 ${parsed.description}\n` +
        `💵 ${parsed.amount.toLocaleString('tr-TR')} ₺\n` +
        `📁 ${parsed.categoryLabel}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      this.logger.error('Add transaction error:', error);
      await this.sendMessage(chatId, '❌ İşlem eklenirken hata oluştu.');
    }
  }

  private async handleBudget(chatId: number, telegramId: string) {
    const userId = await this.getUserId(telegramId);
    if (!userId) {
      await this.sendMessage(chatId, '❌ Hesabınız bağlı değil.');
      return;
    }

    try {
      const budgets = await this.prisma.budget.findMany({
        where: { userId, isActive: true },
      });

      if (budgets.length === 0) {
        await this.sendMessage(chatId, '📊 Henüz bütçe tanımlanmamış.');
        return;
      }

      // Calculate spent amounts for current period
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          date: { gte: startOfMonth },
        },
      });

      // Calculate spent per category
      const spentByCategory = new Map<string, number>();
      for (const tx of transactions) {
        const current = spentByCategory.get(tx.categoryId) || 0;
        spentByCategory.set(tx.categoryId, current + Math.abs(tx.amount));
      }

      let message = '📊 *Bütçe Durumu*\n\n';

      for (const budget of budgets) {
        const spent = spentByCategory.get(budget.categoryId) || 0;
        const percentage = Math.round((spent / budget.limitAmount) * 100);
        const bar = this.createProgressBar(percentage);
        const emoji = percentage >= 90 ? '🔴' : percentage >= 70 ? '🟡' : '🟢';

        message += `${emoji} *${budget.categoryLabel}*\n`;
        message += `${bar} ${percentage}%\n`;
        message += `${spent.toLocaleString('tr-TR')} / ${budget.limitAmount.toLocaleString('tr-TR')} ₺\n\n`;
      }

      await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Budget error:', error);
      await this.sendMessage(chatId, '❌ Bütçe bilgisi alınırken hata oluştu.');
    }
  }

  private async handleRecent(chatId: number, telegramId: string) {
    const userId = await this.getUserId(telegramId);
    if (!userId) {
      await this.sendMessage(chatId, '❌ Hesabınız bağlı değil.');
      return;
    }

    try {
      const transactions = await this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
      });

      if (transactions.length === 0) {
        await this.sendMessage(chatId, '📋 Henüz işlem yok.');
        return;
      }

      let message = '📋 *Son 5 İşlem*\n\n';

      for (const tx of transactions) {
        const emoji = tx.type === 'income' ? '💰' : '💸';
        const sign = tx.type === 'income' ? '+' : '-';
        const date = new Date(tx.date).toLocaleDateString('tr-TR');
        message += `${emoji} ${tx.description}\n`;
        message += `   ${sign}${Math.abs(tx.amount).toLocaleString('tr-TR')} ₺ | ${tx.categoryLabel}\n`;
        message += `   📅 ${date}\n\n`;
      }

      await this.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error('Recent error:', error);
      await this.sendMessage(chatId, '❌ İşlemler alınırken hata oluştu.');
    }
  }

  private async handleHelp(chatId: number) {
    await this.sendMessage(
      chatId,
      '📚 *Yardım*\n\n' +
      '*Komutlar:*\n' +
      '/ozet - Aylık gelir/gider özeti\n' +
      '/ekle [açıklama] [tutar] - Yeni işlem ekle\n' +
      '/butce - Bütçe durumunu göster\n' +
      '/son - Son 5 işlemi göster\n\n' +
      '*Hızlı İşlem:*\n' +
      'Sadece "market 150" veya "maaş 25000" yazarak hızlıca işlem ekleyebilirsiniz.\n\n' +
      '*Kategoriler:*\n' +
      'Yemek, Ulaşım, Alışveriş, Faturalar, Eğlence, Sağlık',
      { parse_mode: 'Markdown' }
    );
  }

  private async handleQuickTransaction(chatId: number, telegramId: string, text: string) {
    const userId = await this.getUserId(telegramId);
    if (!userId) return;

    const parsed = this.parseTransaction(text);
    if (!parsed) return;

    // Ask for confirmation
    await this.sendMessage(
      chatId,
      `İşlem eklensin mi?\n\n` +
      `📝 ${parsed.description}\n` +
      `💰 ${parsed.amount.toLocaleString('tr-TR')} ₺\n` +
      `📁 ${parsed.categoryLabel}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Evet', callback_data: `add:${JSON.stringify(parsed)}` },
              { text: '❌ Hayır', callback_data: 'cancel' },
            ],
          ],
        },
      }
    );
  }

  private async handleCallbackQuery(query: TelegramUpdate['callback_query']) {
    if (!query) return;

    const chatId = query.message.chat.id;
    const telegramId = query.from.id.toString();
    const data = query.data;

    if (data === 'cancel') {
      await this.sendMessage(chatId, '❌ İptal edildi.');
      return;
    }

    if (data.startsWith('add:')) {
      const userId = await this.getUserId(telegramId);
      if (!userId) return;

      try {
        const parsed: ParsedTransaction = JSON.parse(data.replace('add:', ''));

        await this.prisma.transaction.create({
          data: {
            user: { connect: { id: userId } },
            description: parsed.description,
            amount: parsed.type === 'expense' ? -parsed.amount : parsed.amount,
            type: parsed.type,
            categoryId: parsed.categoryId,
            categoryLabel: parsed.categoryLabel,
            date: new Date(),
            currency: 'TRY',
            source: 'telegram',
            tags: '',
            accountId: 'default',
          },
        });

        await this.sendMessage(chatId, '✅ İşlem eklendi!');
      } catch (error) {
        this.logger.error('Callback query error:', error);
        await this.sendMessage(chatId, '❌ Hata oluştu.');
      }
    }

    // Answer callback query
    await this.callApi('answerCallbackQuery', { callback_query_id: query.id });
  }

  // ==================== Helpers ====================

  private parseTransaction(text: string): ParsedTransaction | null {
    // Match patterns like "market 150" or "150 market" or "maaş 25000"
    const match = text.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s+(.+)$/i);
    if (!match) return null;

    const description = (match[1] || match[4])?.trim().toLowerCase();
    const amountStr = (match[2] || match[3])?.replace(',', '.');
    const amount = parseFloat(amountStr);

    if (!description || isNaN(amount) || amount <= 0) return null;

    // Determine type
    const isIncome = INCOME_KEYWORDS.some(k => description.includes(k));

    // Determine category
    let categoryId = isIncome ? 'salary' : 'other';
    let categoryLabel = isIncome ? 'Maaş' : 'Diğer';

    for (const [id, { keywords, label }] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => description.includes(k))) {
        categoryId = id;
        categoryLabel = label;
        break;
      }
    }

    return {
      description: description.charAt(0).toUpperCase() + description.slice(1),
      amount,
      type: isIncome ? 'income' : 'expense',
      categoryId,
      categoryLabel,
    };
  }

  private createProgressBar(percentage: number): string {
    const filled = Math.min(Math.round(percentage / 10), 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private async getUserId(telegramId: string): Promise<string | null> {
    const link = await this.prisma.telegramLink.findUnique({
      where: { telegramId },
    });
    return link?.userId || null;
  }

  private async linkAccount(telegramId: string, code: string): Promise<boolean> {
    try {
      const pending = await this.prisma.telegramLinkCode.findUnique({
        where: { code },
      });

      if (!pending || pending.expiresAt < new Date()) {
        return false;
      }

      await this.prisma.telegramLink.upsert({
        where: { telegramId },
        create: { telegramId, userId: pending.userId },
        update: { userId: pending.userId },
      });

      await this.prisma.telegramLinkCode.delete({ where: { code } });

      return true;
    } catch {
      return false;
    }
  }

  private async sendMessage(chatId: number, text: string, options: Record<string, unknown> = {}) {
    return this.callApi('sendMessage', { chat_id: chatId, text, ...options });
  }

  private async callApi<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${this.apiUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = (await response.json()) as TelegramApiResponse<T>;
    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }

    return data.result;
  }

  // ==================== Public API for reminders ====================

  async sendDailyReminder(userId: string) {
    const link = await this.prisma.telegramLink.findFirst({
      where: { userId },
    });

    if (!link) return;

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfDay },
      },
    });

    let income = 0, expense = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      else expense += Math.abs(tx.amount);
    });

    await this.sendMessage(
      parseInt(link.telegramId),
      `🌙 *Günlük Özet*\n\n` +
      `Bugün ${transactions.length} işlem yaptınız.\n` +
      `💰 Gelir: ${income.toLocaleString('tr-TR')} ₺\n` +
      `💸 Gider: ${expense.toLocaleString('tr-TR')} ₺\n\n` +
      `İyi akşamlar! 🌟`,
      { parse_mode: 'Markdown' }
    );
  }

  async sendBudgetAlert(userId: string, categoryName: string, percentage: number) {
    const link = await this.prisma.telegramLink.findFirst({
      where: { userId },
    });

    if (!link) return;

    await this.sendMessage(
      parseInt(link.telegramId),
      `⚠️ *Bütçe Uyarısı*\n\n` +
      `${categoryName} bütçenizin %${percentage}'ini kullandınız!\n\n` +
      `Dikkatli harcamaya devam edin. 💪`,
      { parse_mode: 'Markdown' }
    );
  }

  async sendBillReminder(userId: string, billName: string, amount: number, dueDate: Date) {
    const link = await this.prisma.telegramLink.findFirst({
      where: { userId },
    });

    if (!link) return;

    await this.sendMessage(
      parseInt(link.telegramId),
      `📅 *Fatura Hatırlatması*\n\n` +
      `${billName} faturanız yaklaşıyor!\n` +
      `💰 Tutar: ${amount.toLocaleString('tr-TR')} ₺\n` +
      `📆 Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}`,
      { parse_mode: 'Markdown' }
    );
  }
}
