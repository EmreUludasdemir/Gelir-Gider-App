/**
 * Consistent category colors across the app
 */

export const CATEGORY_COLORS: Record<string, string> = {
  // Income categories (Green shades)
  salary: '#10b981',         // green-500
  freelance: '#059669',      // green-600
  investment: '#047857',     // green-700
  
  // Shopping & Food (Orange/Red shades)
  market: '#f97316',         // orange-500
  restaurant: '#ef4444',     // red-500
  shopping: '#f59e0b',       // amber-500
  
  // Transport (Blue shades)
  transport: '#3b82f6',      // blue-500
  
  // Subscriptions & Entertainment (Purple/Pink)
  subscription: '#8b5cf6',   // violet-500
  entertainment: '#ec4899',  // pink-500
  
  // Utilities & Bills (Yellow/Amber)
  utilities: '#eab308',      // yellow-500
  rent: '#d97706',           // amber-600
  insurance: '#ca8a04',      // yellow-600
  
  // Health & Personal (Teal/Cyan)
  health: '#14b8a6',         // teal-500
  personal_care: '#06b6d4',  // cyan-500
  
  // Education & Work (Indigo)
  education: '#6366f1',      // indigo-500
  
  // Charity & Others (Gray/Neutral)
  charity: '#8b5cf6',        // violet-500
  pet: '#a855f7',            // purple-500
  
  // Transfer & ATM (Gray)
  transfer: '#6b7280',       // gray-500
  atm: '#9ca3af',            // gray-400
  
  // Other
  other: '#9ca3af',          // gray-400
}

export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#10b981', // green-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#14b8a6', // teal-500
  '#ef4444', // red-500
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
