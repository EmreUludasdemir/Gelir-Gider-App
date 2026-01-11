/**
 * Consistent category colors across the app
 */

export const CATEGORY_COLORS: Record<string, string> = {
  // Income categories (Green shades)
  salary: '#1b9c63',
  freelance: '#2dba7f',
  investment: '#0f4c5c',
  
  // Shopping & Food (Orange/Red shades)
  market: '#e0912d',
  restaurant: '#e15454',
  shopping: '#f2b36b',
  
  // Transport (Blue shades)
  transport: '#2f6f8a',
  
  // Subscriptions & Entertainment (Purple/Pink)
  subscription: '#8b6b3e',
  entertainment: '#d97706',
  
  // Utilities & Bills (Yellow/Amber)
  utilities: '#c27c2c',
  rent: '#b56a2b',
  insurance: '#9c6b30',
  
  // Health & Personal (Teal/Cyan)
  health: '#2a9d8f',
  personal_care: '#4a8c8a',
  
  // Education & Work (Indigo)
  education: '#3a7ca5',
  
  // Charity & Others (Gray/Neutral)
  charity: '#5e8d7c',
  pet: '#b07d62',
  
  // Transfer & ATM (Gray)
  transfer: '#6b7280',
  atm: '#9ca3af',
  
  // Other
  other: '#9ca3af',
}

export const CHART_COLORS = [
  '#0f4c5c',
  '#f2b36b',
  '#1b9c63',
  '#e15454',
  '#2a9d8f',
  '#3a7ca5',
  '#e0912d',
  '#6b7280',
  '#b56a2b',
  '#4a8c8a',
]

export function getCategoryColor(categoryId: string): string {
  return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.other
}

export function getCategoryColorForChart(categoryId: string, index: number): string {
  // First try to get category-specific color
  const categoryColor = CATEGORY_COLORS[categoryId]
  if (categoryColor) return categoryColor
  
  // Fallback to chart color by index
  return CHART_COLORS[index % CHART_COLORS.length]
}
