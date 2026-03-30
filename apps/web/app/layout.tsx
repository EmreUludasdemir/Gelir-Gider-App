import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { PreferencesProvider } from '@/lib/PreferencesContext'
import { NotificationProvider } from '@/lib/NotificationContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'

export const metadata: Metadata = {
  title: 'Gelir-Gider Takip',
  description: 'Modern finans yönetim uygulaması - Gelir ve giderlerinizi kolayca takip edin',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GelirGider',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#0F4C5C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { AuthProvider } from '@/components/auth-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background text-foreground transition-colors">
        {/* Skip to main content link for keyboard users */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-medium focus:shadow-lg"
        >
          Ana içeriğe atla
        </a>
        <PreferencesProvider>
          <AuthProvider>
            <NotificationProvider>
              <RealtimeProvider>
                <ToastProvider>{children}</ToastProvider>
              </RealtimeProvider>
            </NotificationProvider>
          </AuthProvider>
        </PreferencesProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}




