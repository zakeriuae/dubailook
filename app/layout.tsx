import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={`${inter.className} antialiased selection:bg-primary/10`}>
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
