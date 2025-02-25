import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'The AI Botler',
  description: 'Making AI accessible to everyone through experiments, insights, and practical applications',
}

const inter = Inter({ subsets: ['latin'] })


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-gray-900`}>
        <Navigation />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}