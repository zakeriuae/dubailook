import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'Dubilook - Property Listings Platform',
  description: 'Find and list properties, land, and real estate projects. Connect with buyers and sellers through Telegram.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dubailook',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { AppLayout } from '@/components/app-layout'
import { AuthProvider } from '@/lib/auth-context'
import { getSession } from '@/lib/session'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const profile = await getSession()

  return (
    <html lang="en" className={plusJakarta.variable}>
      <body 
        className="antialiased selection:bg-primary/10"
        style={{ 
          fontFamily: "'Yekan Bakh', var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif" 
        }}
      >
        <AuthProvider initialProfile={profile}>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
