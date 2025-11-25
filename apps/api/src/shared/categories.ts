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
    keywords: ['maaş', 'salary', 'wage', 'ücret', 'bordro'],
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
    id: 'market',
    label: 'Market',
    icon: '🛒',
    keywords: ['migros', 'carrefour', 'bim', 'a101', 'şok', 'market', 'grocery'],
    type: 'expense'
  },
  {
    id: 'restaurant',
    label: 'Yemek',
    icon: '🍽️',
    keywords: ['restaurant', 'restoran', 'cafe', 'kahve', 'yemeksepeti', 'getir', 'trendyol yemek'],
    type: 'expense'
  },
  {
    id: 'transport',
    label: 'Ulaşım',
    icon: '🚗',
    keywords: ['shell', 'opet', 'petrol', 'benzin', 'uber', 'taksi', 'metro', 'otobüs', 'hgs'],
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
    keywords: ['elektrik', 'su', 'doğalgaz', 'internet', 'telefon', 'turkcell', 'vodafone', 'türk telekom'],
    type: 'expense'
  },
  {
    id: 'health',
    label: 'Sağlık',
    icon: '🏥',
    keywords: ['eczane', 'hastane', 'doktor', 'pharmacy', 'hospital', 'clinic'],
    type: 'expense'
  },
  {
    id: 'shopping',
    label: 'Alışveriş',
    icon: '🛍️',
    keywords: ['trendyol', 'hepsiburada', 'amazon', 'n11', 'gittigidiyor', 'lcw', 'defacto', 'zara', 'h&m'],
    type: 'expense'
  },
  {
    id: 'education',
    label: 'Eğitim',
    icon: '📚',
    keywords: ['udemy', 'coursera', 'kitap', 'book', 'eğitim', 'kurs', 'okul'],
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
    keywords: ['havale', 'eft', 'transfer', 'gönderim'],
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

export function classifyTransaction(description: string): { categoryId: string; categoryLabel: string; confidence: number } {
  const desc = description.toLowerCase();

  for (const category of CATEGORIES) {
    for (const keyword of category.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return {
          categoryId: category.id,
          categoryLabel: category.label,
          confidence: keyword.length > 5 ? 90 : 75
        };
      }
    }
  }

  return {
    categoryId: 'other',
    categoryLabel: 'Diğer',
    confidence: 30
  };
}
