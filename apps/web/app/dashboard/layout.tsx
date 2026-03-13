import { Header } from '@/components/layout/Header'
import { FloatingActionButton } from '@/components/layout/FloatingActionButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-[26rem] h-[26rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-success/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,76,92,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,76,92,0.1) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />
      </div>

      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-enter">
        {children}
      </main>

      <FloatingActionButton />
    </div>
  )
}


