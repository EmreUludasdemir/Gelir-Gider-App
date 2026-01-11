export const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    salary: 'bg-green-100 text-green-800',
    freelance: 'bg-blue-100 text-blue-800',
    investment: 'bg-primary-100 text-primary-800',
    bank_fees: 'bg-stone-100 text-stone-800',
    market: 'bg-orange-100 text-orange-800',
    restaurant: 'bg-red-100 text-red-800',
    transport: 'bg-primary-100 text-primary-800',
    subscription: 'bg-pink-100 text-pink-800',
    utilities: 'bg-yellow-100 text-yellow-800',
    health: 'bg-teal-100 text-teal-800',
    shopping: 'bg-cyan-100 text-cyan-800',
    education: 'bg-lime-100 text-lime-800',
    entertainment: 'bg-fuchsia-100 text-fuchsia-800',
    rent: 'bg-rose-100 text-rose-800',
    transfer: 'bg-muted text-foreground',
    atm: 'bg-slate-100 text-slate-800',
    insurance: 'bg-amber-100 text-amber-800',
    other: 'bg-neutral-100 text-neutral-800',
  }
  return colors[categoryId] || 'bg-muted text-foreground'
}
