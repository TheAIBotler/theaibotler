// app/(marketing)/tools/page.tsx
import Link from 'next/link';
import { ArrowRight, ExternalLink, Clock } from 'lucide-react';

// Define a proper interface for the tool
interface Tool {
  title: string;
  description: string;
  status: 'live' | 'coming-soon';
  features: string[];
  category: string;
  url?: string; // Make URL optional
  estimatedRelease?: string; // For coming soon tools
}

export default function ToolsPage() {
  const tools: Tool[] = [
    {
      title: "AI Text Simplifier",
      description: "Transform complex documents and academic papers into easy-to-understand summaries. Perfect for students, researchers, and professionals who need to quickly understand dense material.",
      status: "coming-soon",
      estimatedRelease: "Q2 2025",
      features: [
        "Simplify academic papers and research",
        "Adjust the simplification level for your needs",
        "Maintain accuracy while improving readability",
        "Export in multiple formats"
      ],
      category: "Productivity"
    },
    {
      title: "Intelligent Email Assistant",
      description: "Generate professional responses and manage your inbox with AI-powered suggestions. Save time and improve your communication without writing every email from scratch.",
      status: "coming-soon",
      estimatedRelease: "Q3 2025",
      features: [
        "Smart reply suggestions based on email context",
        "Professional tone adjustment",
        "Meeting scheduling assistant",
        "Follow-up reminders"
      ],
      category: "Communication"
    },
    {
      title: "Visual Content Creator",
      description: "Create professional graphics and social media visuals with simple text prompts. No design skills needed - just describe what you want and get beautiful visuals.",
      status: "coming-soon",
      estimatedRelease: "Q4 2025",
      features: [
        "Generate social media graphics",
        "Create custom illustrations",
        "Design presentation slides",
        "Export in multiple formats and sizes"
      ],
      category: "Design",
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
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
            {/* Dynamic status badge */}
            {tool.status === "live" ? (
              <span className="absolute top-6 right-6 px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs font-medium rounded-full flex items-center">
                <ArrowRight className="mr-1 h-3 w-3" />
                Live
              </span>
            ) : (
              <span className="absolute top-6 right-6 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full flex items-center">
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
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full">
                {tool.category}
              </span>
              
              {/* Show estimated release date for coming soon tools */}
              {tool.status === "coming-soon" && tool.estimatedRelease && (
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs px-3 py-1 rounded-full flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  Est. Release: {tool.estimatedRelease}
                </span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              {tool.status === "live" && tool.url ? (
                <Link 
                  href={tool.url}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Tool
                </Link>
              ) : (
                <button 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Join Waitlist
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}