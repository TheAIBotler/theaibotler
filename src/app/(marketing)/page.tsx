// app/(marketing)/page.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen max-w-4xl mx-auto px-8 flex flex-col justify-center py-16">
      {/* Hero section with minimalist design */}
      <div className="space-y-8 text-center">
        {/* Simple, bold headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Making AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">accessible</span> to everyone.
        </h1>
        
        {/* Concise mission statement */}
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Demystifying artificial intelligence through experiments, insights, and real-world applications.
        </p>
        
        {/* Clear call-to-action buttons */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/blog" 
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Read the blog
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          
          <Link 
            href="/projects" 
            className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Explore projects
          </Link>
        </div>
      </div>
      
      {/* Simple feature section */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="text-blue-500 dark:text-blue-400 text-2xl font-bold mb-2">Learn</div>
          <p className="text-gray-600 dark:text-gray-300">
            Discover how AI works through clear explanations and practical examples.
          </p>
        </div>
        
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="text-purple-500 dark:text-purple-400 text-2xl font-bold mb-2">Build</div>
          <p className="text-gray-600 dark:text-gray-300">
            Follow step-by-step guides to create your own AI-powered projects.
          </p>
        </div>
        
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="text-indigo-500 dark:text-indigo-400 text-2xl font-bold mb-2">Explore</div>
          <p className="text-gray-600 dark:text-gray-300">
            Stay updated on the latest AI advancements and their real-world impact.
          </p>
        </div>
      </div>
    </main>
  );
}