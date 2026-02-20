import { Language } from './types';

export const translations: Record<Language, Record<string, string>> = {
  tr: {
    // Dashboard
    dashboard: 'Dashboard',
    overview: 'Genel Bakış',
    welcome_back: 'Finansal merkezinize hoş geldiniz',
    income: 'Gelir',
    expense: 'Gider',
    balance: 'Bakiye',
    recent_transactions: 'Son İşlemler',
    top_categories: 'En Çok Harcanan Kategoriler',
    recurring_payments: 'Tekrarlayan Ödemeler',
    weekly_trend: 'Haftalık Trend',
    expense_breakdown: 'Harcama Dağılımı',
    monthly_trend: 'Aylık Trend',
    
    // Transactions
    transactions: 'İşlemler',
    duplicates: 'Kopya Inceleme',
    add_transaction: 'İşlem Ekle',
    edit_transaction: 'İşlem Düzenle',
    delete_transaction: 'İşlemi Sil',
    description: 'Açıklama',
    amount: 'Tutar',
    date: 'Tarih',
    category: 'Kategori',
    type: 'Tür',
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    
    // AI Features
    ai_insights: 'AI Önerileri',
    auto_insights: 'Yapay Zeka Önerileri',
    financial_assistant: 'Finansal Asistan',
    ask_ai: 'AI\'a Sor',
    analyze: 'Analiz Et',
    smart_input: 'Akıllı Giriş',
    smart_input_placeholder: 'Örn: "Bugün markette 250 TL harcadım"',
    analyzing: 'Analiz ediliyor...',
    no_insights: 'Henüz öneri yok. Analiz butonuna tıklayın.',
    
    // Savings Goals
    savings_goals: 'Tasarruf Hedefleri',
    add_goal: 'Hedef Ekle',
    goal_name: 'Hedef Adı',
    target_amount: 'Hedef Tutar',
    current_amount: 'Mevcut Tutar',
    progress: 'İlerleme',
    
    // Settings
    settings: 'Ayarlar',
    language: 'Dil',
    currency: 'Para Birimi',
    theme: 'Tema',
    light: 'Açık',
    dark: 'Koyu',
    system: 'Sistem',
    
    // Auth
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    logout: 'Çıkış Yap',
    email: 'E-posta',
    password: 'Şifre',
    name: 'Ad Soyad',
    
    // Common
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    no_data: 'Veri bulunamadı',
    view_all: 'Tümünü Gör',
    search: 'Ara',
    filter: 'Filtrele',
    export: 'Dışa Aktar',
    
    // Months
    january: 'Ocak',
    february: 'Şubat',
    march: 'Mart',
    april: 'Nisan',
    may: 'Mayıs',
    june: 'Haziran',
    july: 'Temmuz',
    august: 'Ağustos',
    september: 'Eylül',
    october: 'Ekim',
    november: 'Kasım',
    december: 'Aralık',
  },
  en: {
    // Dashboard
    dashboard: 'Dashboard',
    overview: 'Overview',
    welcome_back: 'Welcome back to your financial center',
    income: 'Income',
    expense: 'Expense',
    balance: 'Balance',
    recent_transactions: 'Recent Transactions',
    top_categories: 'Top Categories',
    recurring_payments: 'Recurring Payments',
    weekly_trend: 'Weekly Trend',
    expense_breakdown: 'Expense Breakdown',
    monthly_trend: 'Monthly Trend',
    
    // Transactions
    transactions: 'Transactions',
    duplicates: 'Duplicate Review',
    add_transaction: 'Add Transaction',
    edit_transaction: 'Edit Transaction',
    delete_transaction: 'Delete Transaction',
    description: 'Description',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    type: 'Type',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    
    // AI Features
    ai_insights: 'AI Insights',
    auto_insights: 'AI-Powered Insights',
    financial_assistant: 'Financial Assistant',
    ask_ai: 'Ask AI',
    analyze: 'Analyze',
    smart_input: 'Smart Input',
    smart_input_placeholder: 'E.g., "I spent $50 on groceries today"',
    analyzing: 'Analyzing...',
    no_insights: 'No insights yet. Click Analyze to get started.',
    
    // Savings Goals
    savings_goals: 'Savings Goals',
    add_goal: 'Add Goal',
    goal_name: 'Goal Name',
    target_amount: 'Target Amount',
    current_amount: 'Current Amount',
    progress: 'Progress',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    currency: 'Currency',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    no_data: 'No data found',
    view_all: 'View All',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
  },
};

export function useTranslation(language: Language) {
  const t = (key: string): string => {
    return translations[language][key] || key;
  };
  return { t };
}
