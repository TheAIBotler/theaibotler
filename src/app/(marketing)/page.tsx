// src/app/(marketing)/page.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import EmailSignup from '@/components/EmailSignup';
import type { Metadata } from 'next';

// Generate metadata for the homepage
export const metadata: Metadata = {
  title: 'Home',
  description: 'Leveraging AI to solve real world problems. Tools to help you save time and money.',
  alternates: {
    canonical: 'https://www.theaibotler.com',
  },
};

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'The AI Botler',
    'url': 'https://www.theaibotler.com',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://www.theaibotler.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'The AI Botler',
    'url': 'https://www.theaibotler.com',
    'logo': 'https://www.theaibotler.com/logo.png',
    'sameAs': [
      'https://twitter.com/theaibotler',
      'https://github.com/theaibotler'
    ]
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-16 relative">
      {/* Add JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Hero section with minimalist design */}
      <div className="space-y-8 text-center relative">
        
        {/* Simple, bold headline - UPDATED MISSION STATEMENT */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-shadow-sm">
          Leveraging AI to solve <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">real world</span> problems.
        </h1>
        
        {/* Concise mission statement - NEW SECONDARY LINE */}
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
        I build tools to help you save time and money.
        </p>
          
          {/* Removed missing image reference */}

        
        {/* Clear call-to-action buttons */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/tools" 
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            aria-label="Browse AI tools"
          >
            Explore tools
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Link>
          
          <Link 
            href="/blog" 
            className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Read articles about AI"
          >
            Read the blog
          </Link>
        </div>
      </div>
      
      {/* Email Signup Section */}
      <EmailSignup />
    </div>
  );
}