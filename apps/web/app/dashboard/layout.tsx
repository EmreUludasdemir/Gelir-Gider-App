import { Header } from '@/components/layout/Header'
import { FinancialAssistant } from '@/components/dashboard/FinancialAssistant'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Background gradient decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-60 h-60 rounded-full bg-success/10 blur-3xl" />
      </div>

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>

      <FinancialAssistant />

      {/* Floating Action Button for mobile */}
      <button
        className="fab md:hidden"
        aria-label="Yeni işlem ekle"
        onClick={() => {
          // Will be connected to modal
          const event = new CustomEvent('openAddTransaction')
          window.dispatchEvent(event)
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
