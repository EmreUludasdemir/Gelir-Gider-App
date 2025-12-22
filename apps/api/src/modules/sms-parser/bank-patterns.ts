/**
 * SMS patterns for Turkish banks
 * Each pattern includes regex to match and extract transaction details
 */

export interface BankPattern {
  bankName: string;
  senderNames: string[]; // SMS sender names
  patterns: {
    regex: RegExp;
    extractors: {
      amount: (match: RegExpMatchArray) => number;
      merchant?: (match: RegExpMatchArray) => string;
      type: (match: RegExpMatchArray) => 'income' | 'expense';
      date?: (match: RegExpMatchArray) => Date;
    };
  }[];
}

export const BANK_PATTERNS: BankPattern[] = [
  // Garanti BBVA
  {
    bankName: 'Garanti BBVA',
    senderNames: ['GARANTI', 'GarantiBBVA', '3399'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+harcama/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+yatan/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          type: () => 'income',
        },
      },
    ],
  },

  // Yapı Kredi
  {
    bankName: 'Yapı Kredi',
    senderNames: ['YapiKredi', 'YKRDI', '5500'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL.*?([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+isyeri/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
      {
        regex: /Hesabiniza\s+(\d+[.,]\d{2})\s*TL\s+para\s+yatrildi/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          type: () => 'income',
        },
      },
    ],
  },

  // İş Bankası
  {
    bankName: 'İş Bankası',
    senderNames: ['ISBANKASI', 'ISBNK', '5601'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+alisveris/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
      {
        regex: /Hesabiniza\s+(\d+[.,]\d{2})\s*TL\s+havale/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          type: () => 'income',
        },
      },
    ],
  },

  // Akbank
  {
    bankName: 'Akbank',
    senderNames: ['AKBANK', 'AKBank', '2323'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+).*?harcama/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // Ziraat Bankası
  {
    bankName: 'Ziraat Bankası',
    senderNames: ['ZIRAATBNK', 'Ziraat', '5533'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL.*?([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+alim/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // QNB Finansbank
  {
    bankName: 'QNB Finansbank',
    senderNames: ['QNBFinans', 'QNBFNSBK', '5522'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+odeme/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // Halkbank
  {
    bankName: 'Halkbank',
    senderNames: ['HALKBANK', 'HlkBnk', '5511'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+alisveris/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // DenizBank
  {
    bankName: 'DenizBank',
    senderNames: ['DENIZBANK', 'DenizBnk', '5544'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL.*?([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // TEB (Türk Ekonomi Bankası)
  {
    bankName: 'TEB',
    senderNames: ['TEB', 'TEBBNK', '5566'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+harcama/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // VakıfBank
  {
    bankName: 'VakıfBank',
    senderNames: ['VAKIFBANK', 'VakıfBnk', '5555'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL.*?([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+islem/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // ING Bank
  {
    bankName: 'ING Bank',
    senderNames: ['INGBANK', 'ING', '5577'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // HSBC
  {
    bankName: 'HSBC',
    senderNames: ['HSBC', 'HSBCBNK', '5588'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+kart/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },

  // Enpara.com (QNB)
  {
    bankName: 'Enpara.com',
    senderNames: ['ENPARA', 'Enpara', '5599'],
    patterns: [
      {
        regex: /(\d+[.,]\d{2})\s*TL\s+([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s\-\.]+)\s+odeme/i,
        extractors: {
          amount: (match) => parseFloat(match[1].replace(',', '.')),
          merchant: (match) => match[2].trim(),
          type: () => 'expense',
        },
      },
    ],
  },
];

/**
 * Auto-categorize based on merchant name keywords
 */
export const CATEGORY_KEYWORDS: { [category: string]: string[] } = {
  'Yiyecek & İçecek': [
    'market',
    'migros',
    'carrefour',
    'a101',
    'bim',
    'şok',
    'restaurant',
    'cafe',
    'kahve',
    'starbucks',
    'burger',
    'pizza',
    'yemek',
  ],
  'Ulaşım': [
    'benzin',
    'akaryakit',
    'opet',
    'shell',
    'bp',
    'uber',
    'bitaksi',
    'otoparka',
    'otopark',
  ],
  'Faturalar': [
    'elektrik',
    'su',
    'dogalgaz',
    'internet',
    'telefon',
    'turkcell',
    'vodafone',
    'türk telekom',
  ],
  'Eğlence': [
    'sinema',
    'netflix',
    'spotify',
    'amazon',
    'youtube',
    'playstation',
    'xbox',
    'steam',
  ],
  'Alışveriş': [
    'mağaza',
    'zara',
    'h&m',
    'lcwaikiki',
    'defacto',
    'n11',
    'trendyol',
    'hepsiburada',
  ],
  'Sağlık': ['eczane', 'hastane', 'doktor', 'klinik', 'acibadem', 'memorial'],
  'Eğitim': ['okul', 'kurs', 'kırtasiye', 'kitap', 'd&r'],
};
