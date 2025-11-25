import { TransactionEntity } from './types';
import { v4 as uuidv4 } from 'uuid';

export function generateSeedData(): TransactionEntity[] {
  const now = new Date();
  const transactions: TransactionEntity[] = [];

  // Son 30 günlük demo data
  const demoItems = [
    { desc: 'Maaş Ödemesi', amount: 45000, type: 'income', category: 'salary', categoryLabel: 'Maaş', confidence: 100 },
    { desc: 'Spotify Premium', amount: -89.99, type: 'expense', category: 'subscription', categoryLabel: 'Abonelik', confidence: 95 },
    { desc: 'Netflix', amount: -129.99, type: 'expense', category: 'subscription', categoryLabel: 'Abonelik', confidence: 95 },
    { desc: 'Migros Online', amount: -856.45, type: 'expense', category: 'market', categoryLabel: 'Market', confidence: 90 },
    { desc: 'Shell Benzin', amount: -1250.00, type: 'expense', category: 'transport', categoryLabel: 'Ulaşım', confidence: 92 },
    { desc: 'Trendyol Sipariş', amount: -459.90, type: 'expense', category: 'shopping', categoryLabel: 'Alışveriş', confidence: 85 },
    { desc: 'Türk Telekom Fatura', amount: -389.00, type: 'expense', category: 'utilities', categoryLabel: 'Faturalar', confidence: 88 },
    { desc: 'Freelance Proje', amount: 8500, type: 'income', category: 'freelance', categoryLabel: 'Freelance', confidence: 80 },
    { desc: 'Yemeksepeti', amount: -187.50, type: 'expense', category: 'restaurant', categoryLabel: 'Yemek', confidence: 90 },
    { desc: 'BİM Alışveriş', amount: -234.75, type: 'expense', category: 'market', categoryLabel: 'Market', confidence: 92 },
    { desc: 'Uber', amount: -67.80, type: 'expense', category: 'transport', categoryLabel: 'Ulaşım', confidence: 88 },
    { desc: 'ATM Çekim', amount: -2000, type: 'expense', category: 'other', categoryLabel: 'Diğer', confidence: 40 },
    { desc: 'Steam Oyun', amount: -299.00, type: 'expense', category: 'entertainment', categoryLabel: 'Eğlence', confidence: 85 },
    { desc: 'Udemy Kurs', amount: -149.90, type: 'expense', category: 'education', categoryLabel: 'Eğitim', confidence: 90 },
    { desc: 'Apartman Aidatı', amount: -850.00, type: 'expense', category: 'rent', categoryLabel: 'Kira', confidence: 75 },
    { desc: 'Bilinmeyen Transfer', amount: -500, type: 'expense', category: 'other', categoryLabel: 'Diğer', confidence: 25 },
    { desc: 'Eczane', amount: -156.00, type: 'expense', category: 'health', categoryLabel: 'Sağlık', confidence: 82 },
    { desc: 'Kira Ödemesi', amount: -12500, type: 'expense', category: 'rent', categoryLabel: 'Kira', confidence: 95 },
  ];

  demoItems.forEach((item, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - index * 2);

    transactions.push({
      id: uuidv4(),
      userId: 'demo-user',
      accountId: index % 2 === 0 ? 'akbank-main' : 'garanti-main',
      date: date.toISOString(),
      description: item.desc,
      amount: item.amount,
      currency: 'TRY',
      source: index < 5 ? 'manual' : 'pdf',
      type: item.type as 'income' | 'expense',
      categoryId: item.category,
      categoryLabel: item.categoryLabel,
      confidence: item.confidence,
      tags: [],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    });
  });

  return transactions;
}
