import { Header } from '@/components/layout/Header'
import { FinancialAssistant } from '@/components/dashboard/FinancialAssistant'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <FinancialAssistant />
    </div>
  )
}

