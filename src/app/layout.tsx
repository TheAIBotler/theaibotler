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
          {/* Skip to content link for accessibility */}
          <a 
            href="#main-content" 
            className="skip-link absolute z-50 bg-blue-600 text-white p-3 rounded transform -translate-y-full focus:translate-y-0 transition-transform"
          >
            Skip to content
          </a>
          
          <Navigation />
          {/* Site-wide background animation */}
          <ParticleAnimation fullPage={true} particleCount={30} particleColor="mixed" />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}