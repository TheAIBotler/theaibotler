// src/app/(marketing)/page.tsx
import Link from 'next/link';
import { ArrowRight, Send } from 'lucide-react';
import ParticleAnimation from '@/components/ParticleAnimation';

// Email signup component
const EmailSignup = () => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 mt-16 mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Join the waitlist</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg">
          Get early access to my upcoming AI tools and exclusive updates on new features and releases.
        </p>
        
        <form className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors"
          >
            Join waitlist
            <Send className="ml-2 h-4 w-4" />
          </button>
        </form>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-blue-100 dark:bg-blue-800/20 opacity-50"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 rounded-full bg-purple-100 dark:bg-purple-800/20 opacity-50"></div>
    </div>
  );
};

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      {/* Hero section with minimalist design */}
      <div className="space-y-8 text-center relative">
        {/* Floating particles background */}
        <ParticleAnimation />
        
        {/* Simple, bold headline - UPDATED MISSION STATEMENT */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Making powerful AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">tools</span> accessible to everyone.
        </h1>
        
        {/* Concise mission statement - NEW SECONDARY LINE */}
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          I build simple AI tools that solve real problems — without coding required.
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