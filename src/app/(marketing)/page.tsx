// src/app/(marketing)/page.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import EmailSignup from '@/components/EmailSignup';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16 relative">
      {/* Hero section with minimalist design */}
      <div className="space-y-8 text-center relative">
        
        {/* Simple, bold headline - UPDATED MISSION STATEMENT */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-shadow-sm">
          Leveraging AI to solve <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">real world</span> problems.
        </h1>
        
        {/* Concise mission statement - NEW SECONDARY LINE */}
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          I build tools to help you save time and money.
        </p>
        
        {/* Clear call-to-action buttons */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/tools" 
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Explore tools
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          
          <Link 
            href="/blog" 
            className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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