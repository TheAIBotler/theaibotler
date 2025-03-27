import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Providers from './Providers'
import ParticleAnimation from '@/components/ParticleAnimation'

// Note: For production, replace favicon.ico and create proper icon files in the public/icons directory
// including icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png

const siteConfig = {
  name: 'The AI Botler',
  description: 'Making AI accessible to everyone through experiments, insights, and practical applications',
  url: 'https://www.theaibotler.com',
  ogImage: 'https://www.theaibotler.com/og-image.jpg',
  links: {
    twitter: 'https://twitter.com/theaibotler',
    github: 'https://github.com/theaibotler',
  },
  author: 'The AI Botler',
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }, { media: '(prefers-color-scheme: light)', color: '#ffffff' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  keywords: ['AI', 'artificial intelligence', 'tools', 'productivity', 'AI assistant', 'AI applications'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Open Graph metadata
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  // Twitter card metadata
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@theaibotler',
  },
  // Other important metadata
  alternates: {
    canonical: siteConfig.url,
  },
  manifest: '/site.webmanifest',
}

const inter = Inter({ subsets: ['latin'] })
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script src="/sw-register.js" defer />
      </head>
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