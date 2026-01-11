import { Header } from '@/components/layout/Header'
import { FinancialAssistant } from '@/components/dashboard/FinancialAssistant'
import { FloatingActionButton } from '@/components/layout/FloatingActionButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Background gradient decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-[26rem] h-[26rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-success/10 blur-3xl" />
      </div>

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-enter">
        {children}
      </main>

      <FinancialAssistant />
      <FloatingActionButton />
    </div>
  )
}


