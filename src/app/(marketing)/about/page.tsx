// src/app/(marketing)/about/page.tsx
import { Github, Linkedin, Mail, Twitter, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'About | The AI Botler',
  description: 'AI engineer building practical tools and solutions to solve real-world problems',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      {/* Header section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">About</h1>
        <div className="h-1 w-20 bg-blue-600 rounded mb-8"></div>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Engineering AI-driven solutions to solve complex business challenges.
        </p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-8">
          {/* Professional Bio */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Professional Bio</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                I develop AI-powered tools that transform complex technologies into accessible, practical solutions.
                With a strategic approach to innovation, I identify high-value opportunities where artificial intelligence
                can address critical business challenges and create measurable impact.
              </p>
              <p>
                My expertise lies in designing AI systems that augment human capabilities while maintaining
                rigorous standards for usability, accessibility, and ethical implementation. This balanced methodology ensures
                that technology serves as an enabler rather than a replacement for human judgment and creativity.
              </p>
              <p>
                Through this website, I collaborate with forward-thinking individuals and organizations to implement
                AI solutions that streamline operations, enhance decision-making, and create competitive advantages—all without
                requiring extensive technical expertise or significant capital investment.
              </p>
            </div>
          </section>

          {/* What I Do Best */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">What I Do Best</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-2">AI Strategy Development</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Creating comprehensive roadmaps for organizations to effectively leverage AI technologies for sustainable growth.
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-2">AI Application Development</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Engineering enterprise-grade AI applications that transform advanced algorithms into intuitive, business-ready solutions.
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-2">Problem Solving</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Identifying complex business challenges and developing targeted AI solutions that deliver measurable results.
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-2">Process Optimization</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Streamlining operations through strategic AI implementation, eliminating inefficiencies and reducing costs.
                </p>
              </div>
              
            </div>
          </section>
        </div>

        {/* Connect section (sidebar) */}
        <div className="md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-10">
          <h2 className="text-2xl font-semibold mb-5">Connect</h2>
          <div className="space-y-5">
            <a 
              href="mailto:contact@theaibotler.com" 
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <Mail className="h-5 w-5 mr-3" />
              <span>Email</span>
            </a>
            <a 
              href="https://twitter.com/theaibotler" 
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Twitter className="h-5 w-5 mr-3" />
              <span>Twitter</span>
            </a>
            <a 
              href="https://github.com/theaibotler" 
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5 mr-3" />
              <span>GitHub</span>
            </a>
            <a 
              href="https://linkedin.com/in/theaibotler" 
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Linkedin className="h-5 w-5 mr-3" />
              <span>LinkedIn</span>
            </a>
          </div>

          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-2xl font-semibold mb-5">Latest Tools</h2>
            <div className="space-y-3">
              <Link 
                href="/tools" 
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span>View all tools</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}