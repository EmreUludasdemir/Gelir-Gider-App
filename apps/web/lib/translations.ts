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
    duplicates: 'Kopya İnceleme',
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
    all_transactions: 'Tüm İşlemler',
    total_transactions: 'Toplam {count} işlem',
    new_transaction: '+ Yeni İşlem',
    close_form: 'Formu Kapat',
    manual_transaction: 'Manuel İşlem Ekle',
    transaction_added: 'İşlem başarıyla eklendi!',
    transaction_updated: 'İşlem başarıyla güncellendi!',
    transaction_deleted: 'İşlem başarıyla silindi!',
    transaction_add_error: 'İşlem eklenemedi',
    
    // Budgets
    budget: 'Bütçe',
    budgets: 'Bütçeler',
    add_budget: 'Bütçe Ekle',
    budget_limit: 'Bütçe Limiti',
    spent: 'Harcanan',
    remaining: 'Kalan',
    monthly: 'Aylık',
    weekly: 'Haftalık',
    budget_created: 'Bütçe başarıyla oluşturuldu!',
    budget_deleted: 'Bütçe silindi!',
    budget_exceeded: '{category} bütçesi aşıldı!',
    budget_warning: '{category} bütçesi %{percent} doldu',
    no_budgets: 'Henüz bütçe oluşturulmadı',
    create_first_budget: 'İlk bütçenizi oluşturun ve harcamalarınızı kontrol altına alın.',
    
    // Smart Features
    ai_insights: 'Akıllı Öneriler',
    auto_insights: 'Otomatik Öneriler',
    financial_assistant: 'Finansal Asistan',
    ask_ai: 'Asistana Sor',
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
    no_goals: 'Henüz tasarruf hedefi yok',
    create_first_goal: 'İlk hedefinizi oluşturun ve tasarruf yolculuğunuza başlayın.',
    track_goals: 'Finansal hedeflerinizi takip edin',
    
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
    retry: 'Tekrar Dene',
    confirm: 'Onayla',
    
    // Empty States
    no_transactions: 'Henüz işlem yok',
    add_first_transaction: 'İlk işleminizi ekleyin ve finansal verilerinizi görmeye başlayın.',
    start_tracking: 'Takibe Başla',
    
    // Errors
    data_load_error: 'Veri yüklenemedi',
    network_error: 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.',
    server_error: 'Backend servisi çalışmıyor olabilir veya bir hata oluştu.',
    dashboard_unavailable: 'Dashboard verisi şu an hazır değil. Lütfen yeniden deneyin.',
    setup_mode: 'İlk kaydı ekleyene kadar dashboard burada yönlendirme modunda kalır.',
    
    // Filters
    search_transactions: 'İşlemlerde ara...',
    all_types: 'Tüm Türler',
    all_categories: 'Tüm Kategoriler',
    clear_filters: 'Filtreleri Temizle',
    
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
    
    // Subscriptions
    subscriptions: 'Abonelikler',
    
    // Households
    households: 'Aile Hesapları',
    
    // Upload
    upload_pdf: 'PDF Yükle',
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
    all_transactions: 'All Transactions',
    total_transactions: 'Total {count} transactions',
    new_transaction: '+ New Transaction',
    close_form: 'Close Form',
    manual_transaction: 'Add Manual Transaction',
    transaction_added: 'Transaction added successfully!',
    transaction_updated: 'Transaction updated successfully!',
    transaction_deleted: 'Transaction deleted successfully!',
    transaction_add_error: 'Failed to add transaction',
    
    // Budgets
    budget: 'Budget',
    budgets: 'Budgets',
    add_budget: 'Add Budget',
    budget_limit: 'Budget Limit',
    spent: 'Spent',
    remaining: 'Remaining',
    monthly: 'Monthly',
    weekly: 'Weekly',
    budget_created: 'Budget created successfully!',
    budget_deleted: 'Budget deleted!',
    budget_exceeded: '{category} budget exceeded!',
    budget_warning: '{category} budget is {percent}% full',
    no_budgets: 'No budgets yet',
    create_first_budget: 'Create your first budget and take control of your spending.',
    
    // Smart Features
    ai_insights: 'Smart Insights',
    auto_insights: 'Automated Insights',
    financial_assistant: 'Financial Assistant',
    ask_ai: 'Ask Assistant',
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
    no_goals: 'No savings goals yet',
    create_first_goal: 'Create your first goal and start your savings journey.',
    track_goals: 'Track your financial goals',
    
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
    retry: 'Try Again',
    confirm: 'Confirm',
    
    // Empty States
    no_transactions: 'No transactions yet',
    add_first_transaction: 'Add your first transaction and start seeing your financial data.',
    start_tracking: 'Start Tracking',
    
    // Errors
    data_load_error: 'Failed to load data',
    network_error: 'Cannot connect to server. Check your internet connection.',
    server_error: 'Backend service may be down or an error occurred.',
    dashboard_unavailable: 'Dashboard data is currently unavailable. Please try again.',
    setup_mode: 'Dashboard stays in setup mode until the first records arrive.',
    
    // Filters
    search_transactions: 'Search transactions...',
    all_types: 'All Types',
    all_categories: 'All Categories',
    clear_filters: 'Clear Filters',
    
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
    
    // Subscriptions
    subscriptions: 'Subscriptions',
    
    // Households
    households: 'Households',
    
    // Upload
    upload_pdf: 'Upload PDF',
  },
};

export function useTranslation(language: Language) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    return text;
  };
  return { t };
}
