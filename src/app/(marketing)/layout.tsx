'use client';

import ParticleAnimation from '@/components/ParticleAnimation';
import SessionDebugPanel from '@/components/SessionDebugPanel';
import { usePathname } from 'next/navigation';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current pathname
  const pathname = usePathname();

  // Determine if we should show particles based on the path
  // Don't show particles on blog post pages or individual tool pages
  const showParticles = 
    !pathname.match(/\/blog\/[\w-]+$/) && // Skip individual blog posts
    !pathname.match(/\/tools\/[\w-]+$/) && // Skip individual tool pages
    pathname !== '/studio'; // Skip Sanity studio

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Apply particle animation to all marketing pages except blog posts */}
      {showParticles && (
        <ParticleAnimation 
          fullPage={true} 
          particleCount={30} 
          particleColor="mixed" 
        />
      )}
      {children}
      
      {/* Add the debug panel - only visible in development mode */}
      <SessionDebugPanel />
    </div>
  );
}