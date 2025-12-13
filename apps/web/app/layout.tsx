import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { PreferencesProvider } from '@/lib/PreferencesContext'

export const metadata: Metadata = {
  title: 'Gelir-Gider Takip',
  description: 'Modern finans yönetim uygulaması',
}

import { AuthProvider } from '@/components/auth-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <PreferencesProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}

