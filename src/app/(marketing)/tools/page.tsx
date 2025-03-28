// app/(marketing)/tools/page.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Clock } from 'lucide-react';
import WaitlistModal from '@/components/WaitlistModal';
import { Tool } from '@/types';

export default function ToolsPage() {
  // State for modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | undefined>();
  
  // Function to open modal with selected tool
  const openWaitlistModal = (toolName: string) => {
    setSelectedTool(toolName);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeWaitlistModal = () => {
    setIsModalOpen(false);
  };
  
  const tools: Tool[] = [
    {
      title: "EquationOracle",
      description: "Harness the power of AI to generate custom mathematics questions across any subject area. An intelligent tool that creates personalized practice materials, tests, and learning resources tailored to specific learning objectives.",
      status: "coming-soon",
      estimatedRelease: "Q2 2025",
      features: [
        "Adaptive difficulty scaling from elementary concepts to advanced university mathematics",
        "Contextual problem generation based on real-world scenarios and applications",
        "Intelligent solution pathways with multiple solving methods",
        "Personalized question creation based on learning gaps and strengths",
        "Curriculum alignment for educational standards worldwide",
        "Export in multiple formats including PDF, Word, and interactive web pages"
      ],
      category: "Education"
    }
  ];

  // Generate structured data for tools
  const toolsSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': tools.map((tool, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'SoftwareApplication',
        'name': tool.title,
        'description': tool.description,
        'applicationCategory': 'WebApplication',
        'operatingSystem': 'All',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': tool.status === 'live' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder'
        }
      }
    }))
  };

  return (
    <div className="max-w-4xl mx-auto p-8 flex-1 flex flex-col">
      {/* Add JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchemaData) }}
      />
      
      <h1 className="text-4xl font-bold">AI Tools</h1>
      <p className="mt-4 mb-8 text-gray-600 dark:text-gray-300">
        Powerful AI tools designed to solve real problems — no coding required.
      </p>

      <div className="space-y-6">
        {tools.map((tool, index) => (
          <div 
            key={index} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow relative"
          >
        {/* Dynamic status badge - ONLY VISIBLE ON DESKTOP */}
            {tool.status === "live" ? (
              <span className="absolute top-6 right-6 hidden sm:flex px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-medium rounded-full items-center" aria-hidden="true">
                <ArrowRight className="mr-1 h-3 w-3" />
                Live
              </span>
            ) : (
              <span className="absolute top-6 right-6 hidden sm:flex px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full items-center" aria-hidden="true">
                <Clock className="mr-1 h-3 w-3" />
                Coming Soon
              </span>
            )}
            
            {/* Conditionally render Link based on URL existence */}
            {tool.url ? (
              <Link href={tool.url}>
                <h2 className="text-2xl font-bold mb-3 text-blue-600 dark:text-blue-400 hover:underline mt-4">{tool.title}</h2>
              </Link>
            ) : (
              <h2 className="text-2xl font-bold mb-3 mt-4">{tool.title}</h2>
            )}
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">{tool.description}</p>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</h3>
              <ul className="list-disc pl-5 space-y-1">
                {tool.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-600 dark:text-gray-400 text-sm">{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full" role="status">
                {tool.category}
              </span>
              
              {/* Show estimated release date for coming soon tools */}
              {tool.status === "coming-soon" && tool.estimatedRelease && (
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs px-3 py-1 rounded-full flex items-center" role="status">
                    <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                    Est. Release: {tool.estimatedRelease}
                  </span>
                  
                  {/* Mobile-only status badge */}
                  <span className="sm:hidden bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-1 rounded-full flex items-center" aria-hidden="true">
                    <Clock className="mr-1 h-3 w-3" />
                    Coming Soon
                  </span>
                </div>
              )}
              
              {/* Live badge for mobile */}
              {tool.status === "live" && (
                <span className="sm:hidden bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs px-3 py-1 rounded-full flex items-center" aria-hidden="true">
                  <ArrowRight className="mr-1 h-3 w-3" />
                  Live
                </span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              {tool.status === "live" && tool.url ? (
                <Link 
                  href={tool.url}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center"
                  aria-label={`Visit ${tool.title}`}
                >
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Visit Tool
                </Link>
              ) : (
                <button 
                  onClick={() => openWaitlistModal(tool.title)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center"
                  aria-label={`Join waitlist for ${tool.title}`}
                >
                  <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
                  Join Waitlist
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Waitlist Modal */}
      <WaitlistModal 
        isOpen={isModalOpen} 
        onClose={closeWaitlistModal} 
        toolName={selectedTool} 
      />
    </div>
  );
}