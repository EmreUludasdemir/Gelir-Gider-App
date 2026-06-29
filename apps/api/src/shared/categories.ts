export interface Category {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  type: 'income' | 'expense' | 'both';
}

export const CATEGORIES: Category[] = [
  {
    id: 'salary',
    label: 'Maaş',
    icon: '💰',
    keywords: ['maaş', 'salary', 'wage', 'ücret', 'bordro', 'burs', 'scholarship', 'ödeme geldi', 'gelen eft', 'gelen havale'],
    type: 'income'
  },
  {
    id: 'freelance',
    label: 'Freelance',
    icon: '💻',
    keywords: ['freelance', 'serbest', 'proje', 'danışmanlık'],
    type: 'income'
  },
  {
    id: 'investment',
    label: 'Yatırım Geliri',
    icon: '📈',
    keywords: ['temettü', 'faiz', 'kira', 'dividend', 'interest'],
    type: 'income'
  },
  {
    id: 'bank_fees',
    label: 'Banka Ücretleri',
    icon: '🏦',
    keywords: [
      'bsmv',
      'kkdf',
      'komisyon',
      'ücret',
      'ucret',
      'masraf',
      'nakit avans',
      'gecikme',
      'gecikme faizi',
      'hesap işletim',
      'hesap isletim',
      'kredi kartı aidat',
      'kredi karti aidat',
      'aidat',
      'provizyon',
      'ekstre ücreti',
      'ekstre ucreti'
    ],
    type: 'expense'
  },
  {
    id: 'market',
    label: 'Market',
    icon: '🛒',
    keywords: ['migros', 'carrefour', 'bim', 'a101', 'şok', 'sok', 'market', 'grocery', 'macrocenter', 'file'],
    type: 'expense'
  },
  {
    id: 'restaurant',
    label: 'Yemek',
    icon: '🍽️',
    keywords: ['restaurant', 'restoran', 'cafe', 'kahve', 'yemeksepeti', 'getir yemek', 'trendyol yemek', 'starbucks', 'burger', 'mcdonalds', 'dominos', 'tikla gelsin', 'tıkla gelsin'],
    type: 'expense'
  },
  {
    id: 'transport',
    label: 'Ulaşım',
    icon: '🚗',
    keywords: ['shell', 'opet', 'petrol', 'benzin', 'uber', 'bitaksi', 'taksi', 'metro', 'otobüs', 'hgs', 'istanbulkart', 'iett', 'marti', 'bp', 'total'],
    type: 'expense'
  },
  {
    id: 'subscription',
    label: 'Abonelik',
    icon: '📺',
    keywords: ['spotify', 'netflix', 'youtube', 'amazon', 'disney', 'apple', 'hbo', 'exxen', 'blutv'],
    type: 'expense'
  },
  {
    id: 'utilities',
    label: 'Faturalar',
    icon: '💡',
    keywords: ['elektrik', 'su', 'doğalgaz', 'igdaş', 'bedaş', 'internet', 'telefon', 'turkcell', 'vodafone', 'türk telekom', 'fatura'],
    type: 'expense'
  },
  {
    id: 'health',
    label: 'Sağlık',
    icon: '🏥',
    keywords: ['eczane', 'hastane', 'doktor', 'pharmacy', 'hospital', 'clinic', 'medikal'],
    type: 'expense'
  },
  {
    id: 'shopping',
    label: 'Alışveriş',
    icon: '🛍️',
    keywords: ['trendyol', 'hepsiburada', 'amazon', 'n11', 'gittigidiyor', 'lcw', 'defacto', 'zara', 'h&m', 'hm'],
    type: 'expense'
  },
  {
    id: 'education',
    label: 'Eğitim',
    icon: '📚',
    keywords: ['udemy', 'coursera', 'kitap', 'book', 'eğitim', 'kurs', 'okul', 'üniversite', 'course'],
    type: 'expense'
  },
  {
    id: 'entertainment',
    label: 'Eğlence',
    icon: '🎮',
    keywords: ['sinema', 'konser', 'oyun', 'game', 'steam', 'playstation', 'bilet'],
    type: 'expense'
  },
  {
    id: 'rent',
    label: 'Kira',
    icon: '🏠',
    keywords: ['kira', 'rent', 'aidat', 'apartman'],
    type: 'expense'
  },
  {
    id: 'transfer',
    label: 'Transfer',
    icon: '🔄',
    keywords: ['havale', 'eft', 'transfer', 'gönderim', 'fast'],
    type: 'both'
  },
  {
    id: 'other',
    label: 'Diğer',
    icon: '📦',
    keywords: [],
    type: 'both'
  }
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
}

export function classifyTransaction(
  description: string,
  transactionType?: 'income' | 'expense'
): { categoryId: string; categoryLabel: string; confidence: number; type?: 'income' | 'expense' | 'both'; reason?: string; source?: string } {
  const desc = normalizeText(description);

  const eligibleCategories = transactionType
    ? CATEGORIES.filter((category) => category.type === transactionType || category.type === 'both')
    : CATEGORIES;

  for (const category of eligibleCategories) {
    for (const keyword of category.keywords) {
      if (desc.includes(normalizeText(keyword))) {
        return {
          categoryId: category.id,
          categoryLabel: category.label,
          confidence: keyword.length > 5 ? 90 : 75,
          type: category.type,
          reason: `Matched keyword: ${keyword}`,
          source: 'deterministic-rule',
        };
      }
    }
  }

  return {
    categoryId: 'other',
    categoryLabel: 'Diğer',
    confidence: 30,
    type: transactionType || 'expense',
    reason: 'No deterministic rule matched',
    source: 'deterministic-rule',
  };
}
