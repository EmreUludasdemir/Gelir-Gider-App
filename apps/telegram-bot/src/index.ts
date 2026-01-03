/**
 * Gelir-Gider Telegram Bot
 *
 * Commands:
 * /start - Bot'u başlat ve kayıt ol
 * /add <tutar> <kategori> [açıklama] - Hızlı işlem ekle
 * /balance - Güncel bakiye
 * /summary - Haftalık özet
 * /help - Yardım
 */

import { Telegraf, Context } from "telegraf";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API_URL = process.env.API_URL || "http://localhost:3001";

// Token storage (in production, use database)
const userTokens = new Map<number, string>();

const bot = new Telegraf(BOT_TOKEN);

// Categories mapping
const CATEGORIES: Record<string, { id: string; label: string }> = {
  market: { id: "market", label: "Market" },
  yemek: { id: "yemek", label: "Yemek" },
  ulasim: { id: "ulasim", label: "Ulaşım" },
  fatura: { id: "fatura", label: "Faturalar" },
  abonelik: { id: "abonelik", label: "Abonelik" },
  saglik: { id: "saglik", label: "Sağlık" },
  alisveris: { id: "alisveris", label: "Alışveriş" },
  maas: { id: "maas", label: "Maaş" },
  diger: { id: "diger", label: "Diğer" },
};

// Start command
bot.start(async (ctx) => {
  const welcomeMessage = `
🎉 *Gelir-Gider Bot'a Hoşgeldiniz!*

Bu bot ile hızlıca işlem ekleyebilir, bakiyenizi görebilir ve haftalık özet alabilirsiniz.

📋 *Komutlar:*
/add <tutar> <kategori> [açıklama] - İşlem ekle
/balance - Bakiye görüntüle
/summary - Haftalık özet
/help - Yardım

🔐 *Giriş yapmak için:*
/login <email> <şifre>

📝 *Örnek:*
/add 50 market Migros alışverişi
/add 150 yemek
`;
  await ctx.replyWithMarkdown(welcomeMessage);
});

// Help command
bot.help(async (ctx) => {
  const helpMessage = `
📚 *Yardım*

*İşlem Ekleme:*
/add <tutar> <kategori> [açıklama]

*Kategoriler:*
market, yemek, ulasim, fatura, abonelik, saglik, alisveris, maas, diger

*Örnekler:*
\`/add 50 market\` - 50 TL market harcaması
\`/add 150 yemek Restoran\` - 150 TL yemek
\`/add -5000 maas Maaş geliri\` - 5000 TL gelir (eksi = gelir)

*Diğer Komutlar:*
/balance - Güncel bakiye
/summary - Haftalık özet
`;
  await ctx.replyWithMarkdown(helpMessage);
});

// Login command
bot.command("login", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);

  if (args.length < 2) {
    return ctx.reply("❌ Kullanım: /login <email> <şifre>");
  }

  const [email, password] = args;

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.accessToken) {
      userTokens.set(ctx.from!.id, response.data.accessToken);
      await ctx.reply("✅ Giriş başarılı! Artık işlem ekleyebilirsiniz.");
    }
  } catch (error) {
    await ctx.reply("❌ Giriş başarısız. Email veya şifre hatalı.");
  }
});

// Add transaction command
bot.command("add", async (ctx) => {
  const token = userTokens.get(ctx.from!.id);

  if (!token) {
    return ctx.reply("❌ Önce /login ile giriş yapın.");
  }

  const args = ctx.message.text.split(" ").slice(1);

  if (args.length < 2) {
    return ctx.reply("❌ Kullanım: /add <tutar> <kategori> [açıklama]");
  }

  const amount = parseFloat(args[0].replace(",", "."));
  const categoryKey = args[1].toLowerCase();
  const description = args.slice(2).join(" ") || categoryKey;

  if (isNaN(amount)) {
    return ctx.reply("❌ Geçersiz tutar. Sayı girin.");
  }

  const category = CATEGORIES[categoryKey] || CATEGORIES["diger"];
  const type = amount < 0 ? "income" : "expense";

  try {
    await axios.post(
      `${API_URL}/transactions/manual`,
      {
        amount: Math.abs(amount),
        type,
        description,
        categoryId: category.id,
        categoryLabel: category.label,
        date: new Date().toISOString(),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const emoji = type === "income" ? "💰" : "💸";
    await ctx.reply(
      `${emoji} İşlem eklendi:\n${Math.abs(amount)} TL - ${
        category.label
      }\n${description}`
    );
  } catch (error: any) {
    if (error.response?.status === 401) {
      userTokens.delete(ctx.from!.id);
      return ctx.reply(
        "❌ Oturum süresi doldu. /login ile tekrar giriş yapın."
      );
    }
    await ctx.reply("❌ İşlem eklenirken hata oluştu.");
  }
});

// Balance command
bot.command("balance", async (ctx) => {
  const token = userTokens.get(ctx.from!.id);

  if (!token) {
    return ctx.reply("❌ Önce /login ile giriş yapın.");
  }

  try {
    const response = await axios.get(`${API_URL}/transactions/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { totals } = response.data;
    const balance = totals.income - totals.expense;
    const emoji = balance >= 0 ? "📈" : "📉";

    await ctx.replyWithMarkdown(`
${emoji} *Aylık Özet*

💰 Gelir: *${totals.income.toLocaleString("tr-TR")} TL*
💸 Gider: *${totals.expense.toLocaleString("tr-TR")} TL*
━━━━━━━━━━━━
💵 Bakiye: *${balance.toLocaleString("tr-TR")} TL*
    `);
  } catch (error: any) {
    if (error.response?.status === 401) {
      userTokens.delete(ctx.from!.id);
      return ctx.reply(
        "❌ Oturum süresi doldu. /login ile tekrar giriş yapın."
      );
    }
    await ctx.reply("❌ Bakiye alınırken hata oluştu.");
  }
});

// Summary command
bot.command("summary", async (ctx) => {
  const token = userTokens.get(ctx.from!.id);

  if (!token) {
    return ctx.reply("❌ Önce /login ile giriş yapın.");
  }

  try {
    const response = await axios.get(`${API_URL}/transactions/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { totals, topCategories, comparison } = response.data;

    let categoriesText = "";
    if (topCategories?.length > 0) {
      categoriesText =
        "\n📊 *En Çok Harcama:*\n" +
        topCategories
          .slice(0, 3)
          .map(
            (c: any, i: number) =>
              `${i + 1}. ${c.categoryLabel}: ${c.total.toLocaleString(
                "tr-TR"
              )} TL`
          )
          .join("\n");
    }

    const expenseChange = comparison?.changePercentage?.expense || 0;
    const trend = expenseChange > 0 ? "📈 +" : "📉 ";

    await ctx.replyWithMarkdown(`
📊 *Haftalık Özet*

💰 Toplam Gelir: *${totals.income.toLocaleString("tr-TR")} TL*
💸 Toplam Gider: *${totals.expense.toLocaleString("tr-TR")} TL*
📝 İşlem Sayısı: *${totals.transactionCount}*

${trend}${Math.abs(expenseChange).toFixed(1)}% geçen aya göre
${categoriesText}
    `);
  } catch (error: any) {
    if (error.response?.status === 401) {
      userTokens.delete(ctx.from!.id);
      return ctx.reply(
        "❌ Oturum süresi doldu. /login ile tekrar giriş yapın."
      );
    }
    await ctx.reply("❌ Özet alınırken hata oluştu.");
  }
});

// Quick add via text (without command)
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  // Pattern: "50 market" or "150 yemek açıklama"
  const quickAddPattern = /^(\d+(?:[.,]\d+)?)\s+(\w+)(?:\s+(.+))?$/;
  const match = text.match(quickAddPattern);

  if (match) {
    const amount = parseFloat(match[1].replace(",", "."));
    const categoryKey = match[2].toLowerCase();

    if (CATEGORIES[categoryKey]) {
      // Simulate /add command
      ctx.message.text = `/add ${text}`;
      // Re-process as add command
      await ctx.reply(
        `💡 Kısayol algılandı. /add ${text} komutu çalıştırılıyor...`
      );
    }
  }
});

// Start bot
bot
  .launch()
  .then(() => {
    console.log("🤖 Telegram bot başlatıldı!");
  })
  .catch((error) => {
    console.error("Bot başlatılamadı:", error);
  });

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
