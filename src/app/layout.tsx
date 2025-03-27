import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Providers from './Providers'
import ParticleAnimation from '@/components/ParticleAnimation'

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
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-white dark:bg-gray-900 flex flex-col h-full`}>
        <Providers>
          <Navigation />
          {/* Site-wide background animation */}
          <ParticleAnimation fullPage={true} particleCount={30} particleColor="mixed" />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}