export const CATEGORIES = [
  { id: 'salary', label: 'Maaş', emoji: '💰', type: 'income' },
  { id: 'freelance', label: 'Freelance', emoji: '💼', type: 'income' },
  { id: 'investment', label: 'Yatırım Geliri', emoji: '📈', type: 'income' },
  { id: 'bank_fees', label: 'Banka Ücretleri', emoji: '🏦', type: 'expense' },
  { id: 'market', label: 'Market', emoji: '🛒', type: 'expense' },
  { id: 'restaurant', label: 'Yemek', emoji: '🍽️', type: 'expense' },
  { id: 'transport', label: 'Ulaşım', emoji: '🚗', type: 'expense' },
  { id: 'subscription', label: 'Abonelik', emoji: '📺', type: 'expense' },
  { id: 'utilities', label: 'Faturalar', emoji: '💡', type: 'expense' },
  { id: 'health', label: 'Sağlık', emoji: '🏥', type: 'expense' },
  { id: 'shopping', label: 'Alışveriş', emoji: '🛍️', type: 'expense' },
  { id: 'education', label: 'Eğitim', emoji: '📚', type: 'expense' },
  { id: 'entertainment', label: 'Eğlence', emoji: '🎬', type: 'expense' },
  { id: 'rent', label: 'Kira', emoji: '🏠', type: 'expense' },
  { id: 'transfer', label: 'Transfer', emoji: '💸', type: 'both' },
  { id: 'atm', label: 'ATM', emoji: '🏧', type: 'expense' },
  { id: 'insurance', label: 'Sigorta', emoji: '🛡️', type: 'expense' },
  { id: 'charity', label: 'Bağış', emoji: '❤️', type: 'expense' },
  { id: 'personal_care', label: 'Kişisel Bakım', emoji: '💅', type: 'expense' },
  { id: 'pet', label: 'Evcil Hayvan', emoji: '🐾', type: 'expense' },
  { id: 'other', label: 'Diğer', emoji: '📦', type: 'expense' }
] as const

export type CategoryId = typeof CATEGORIES[number]['id']
export type CategoryType = 'income' | 'expense' | 'both'

export function getCategoryById(id: string) {
  return CATEGORIES.find(c => c.id === id)
}

export function getCategoryEmoji(id: string): string {
  return getCategoryById(id)?.emoji || '📦'
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label || 'Diğer'
}

export function getIncomeCategories() {
  return CATEGORIES.filter(c => c.type === 'income')
}

export function getExpenseCategories() {
  return CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both')
}
