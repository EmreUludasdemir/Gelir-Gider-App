import { Injectable, Logger } from "@nestjs/common";
import { TelegramWebhookDto } from "./dto/notification.dto";

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
}

export interface TelegramUser {
  chatId: string;
  userId: string;
  username?: string;
  isActive: boolean;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly apiUrl = "https://api.telegram.org/bot";

  async sendMessage(message: TelegramMessage): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn("Telegram bot token not configured");
      return false;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: message.chatId,
            text: message.text,
            parse_mode: message.parseMode || "HTML",
          }),
        }
      );

      const result = (await response.json()) as {
        ok: boolean;
        description?: string;
      };
      if (!result.ok) {
        throw new Error(result.description || "Unknown error");
      }

      this.logger.log(`Telegram message sent to ${message.chatId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error.message}`);
      return false;
    }
  }

  async sendBudgetAlert(
    chatId: string,
    category: string,
    percentage: number,
    spent: number,
    limit: number
  ): Promise<boolean> {
    const emoji = percentage >= 100 ? "🚨" : "⚠️";
    const text = `
${emoji} <b>Bütçe Uyarısı</b>

📁 Kategori: <b>${category}</b>
📊 Kullanım: %${percentage}
💰 Harcanan: ₺${spent.toLocaleString("tr-TR")}
🎯 Limit: ₺${limit.toLocaleString("tr-TR")}

${percentage >= 100 ? "❌ Bütçe aşıldı!" : "⚡ Dikkatli harcayın!"}
    `.trim();

    return this.sendMessage({ chatId, text });
  }

  async sendDailySummary(
    chatId: string,
    income: number,
    expense: number
  ): Promise<boolean> {
    const balance = income - expense;
    const balanceEmoji = balance >= 0 ? "✅" : "📉";
    const text = `
📊 <b>Günlük Özet</b>

💵 Gelir: +₺${income.toLocaleString("tr-TR")}
💸 Gider: -₺${expense.toLocaleString("tr-TR")}
${balanceEmoji} Net: ₺${balance.toLocaleString("tr-TR")}

/ekle - Yeni işlem ekle
/bakiye - Güncel bakiye
/rapor - Haftalık rapor
    `.trim();

    return this.sendMessage({ chatId, text });
  }

  async sendTransactionConfirmation(
    chatId: string,
    type: "income" | "expense",
    amount: number,
    category: string,
    description: string
  ): Promise<boolean> {
    const emoji = type === "income" ? "💵" : "💸";
    const sign = type === "income" ? "+" : "-";
    const text = `
${emoji} <b>İşlem Kaydedildi</b>

💰 Tutar: ${sign}₺${amount.toLocaleString("tr-TR")}
📁 Kategori: ${category}
📝 Açıklama: ${description}
    `.trim();

    return this.sendMessage({ chatId, text });
  }

  async sendSavingsGoalUpdate(
    chatId: string,
    goalName: string,
    current: number,
    target: number
  ): Promise<boolean> {
    const progress = Math.round((current / target) * 100);
    const progressBar = this.generateProgressBar(progress);
    const text = `
🎯 <b>Tasarruf Hedefi Güncellendi</b>

📌 ${goalName}
${progressBar}
💰 ${progress}% tamamlandı

Mevcut: ₺${current.toLocaleString("tr-TR")}
Hedef: ₺${target.toLocaleString("tr-TR")}
Kalan: ₺${(target - current).toLocaleString("tr-TR")}
    `.trim();

    return this.sendMessage({ chatId, text });
  }

  // Parse incoming message to add transaction
  parseTransactionCommand(message: string): {
    type: "income" | "expense";
    amount: number;
    description: string;
  } | null {
    // Format: /ekle gider 50 kahve
    // Format: /ekle gelir 5000 maaş
    const match = message.match(
      /^\/ekle\s+(gelir|gider)\s+(\d+(?:\.\d+)?)\s+(.+)$/i
    );

    if (!match) return null;

    return {
      type: match[1].toLowerCase() === "gelir" ? "income" : "expense",
      amount: parseFloat(match[2]),
      description: match[3].trim(),
    };
  }

  // Quick add format parsing
  parseQuickAdd(message: string): {
    amount: number;
    description: string;
    type: "income" | "expense";
  } | null {
    // Format: "50 kahve" (expense) or "+5000 maaş" (income)
    const match = message.match(/^([+-]?)(\d+(?:\.\d+)?)\s+(.+)$/);

    if (!match) return null;

    return {
      type: match[1] === "+" ? "income" : "expense",
      amount: parseFloat(match[2]),
      description: match[3].trim(),
    };
  }

  private generateProgressBar(percentage: number, length: number = 10): string {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return "▓".repeat(filled) + "░".repeat(empty);
  }

  // Webhook handler for incoming messages
  async handleWebhook(update: TelegramWebhookDto): Promise<{ response: string } | null> {
    if (!update.message?.text) return null;

    const chatId = update.message.chat.id.toString();
    const text = update.message.text;

    // Handle commands
    if (text === "/start") {
      return {
        response: `
🎉 <b>Gelir-Gider Takip Bot'a Hoş Geldiniz!</b>

Komutlar:
/ekle gelir|gider TUTAR AÇIKLAMA - İşlem ekle
/bakiye - Güncel bakiye
/rapor - Haftalık rapor
/ayarlar - Bot ayarları

Hızlı ekleme:
• "50 kahve" → 50₺ gider
• "+5000 maaş" → 5000₺ gelir
        `.trim(),
      };
    }

    if (text === "/yardim" || text === "/help") {
      return {
        response: `
📖 <b>Yardım</b>

<b>İşlem Ekleme:</b>
/ekle gider 50 kahve
/ekle gelir 5000 maaş

<b>Hızlı Ekleme:</b>
Sadece "50 kahve" yazın

<b>Sorgulama:</b>
/bakiye - Güncel bakiye
/rapor - Haftalık özet
        `.trim(),
      };
    }

    // Check for transaction command
    const transaction = this.parseTransactionCommand(text);
    if (transaction) {
      // Return parsed data - actual saving should be done by controller
      return {
        response: `transaction:${JSON.stringify(transaction)}`,
      };
    }

    // Check for quick add
    const quickAdd = this.parseQuickAdd(text);
    if (quickAdd) {
      return {
        response: `transaction:${JSON.stringify(quickAdd)}`,
      };
    }

    return null;
  }
}
