'use client'

import { useState, useEffect } from 'react';

interface ParticleAnimationProps {
  fullPage?: boolean;
  particleCount?: number;
  particleColor?: string;
}

// Enhanced client-only component that avoids hydration mismatches
const ParticleAnimation = ({ 
  fullPage = false, 
  particleCount = 25,
  particleColor = 'blue'
}: ParticleAnimationProps) => {
  const [particles, setParticles] = useState<Array<null>>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Only run this effect on the client after hydration
  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true);
    
    // Generate particles for initial render - use fewer for full-page to maintain performance
    const count = fullPage ? Math.min(particleCount, 30) : particleCount;
    setParticles(Array(count).fill(null));
    
    // Add resize handler if needed
    const handleResize = () => {
      // Adjust particles based on screen size for better performance
      let adjustedCount = count;
      if (window.innerWidth < 768) {
        adjustedCount = Math.floor(count * 0.6); // 60% on mobile
      } else if (window.innerWidth < 1024) {
        adjustedCount = Math.floor(count * 0.8); // 80% on tablets
      }
      setParticles(Array(adjustedCount).fill(null));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [particleCount, fullPage]);

  if (!isClient) {
    // Return an empty container during server rendering
    return <div className={`${fullPage ? 'fixed inset-0 -z-10' : 'absolute inset-0'} overflow-hidden pointer-events-none`}></div>;
  }

  return (
    <div className={`${fullPage ? 'fixed inset-0 -z-10' : 'absolute inset-0'} overflow-hidden pointer-events-none`}>
      {particles.map((_, i) => {
        // Generate random values - only happens on client
        const size = Math.random() * 15 + 5;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const opacity = Math.random() * 0.5 + 0.1;
        const duration = Math.random() * 8 + 7; // Even faster animation (7-15s)
        const delay = Math.random() * 5; // Shorter delay (was 10)
        const initialScale = Math.random() * 0.5 + 0.5;
        
        const isSmall = size < 10;
        
        let colorClass = '';
        if (particleColor === 'blue') {
          colorClass = isSmall 
            ? 'bg-blue-400/10 dark:bg-blue-300/10' 
            : 'bg-blue-500/10 dark:bg-blue-400/10';
        } else if (particleColor === 'purple') {
          colorClass = isSmall 
            ? 'bg-purple-400/10 dark:bg-purple-300/10' 
            : 'bg-purple-500/10 dark:bg-purple-400/10';
        } else if (particleColor === 'mixed') {
          // Random selection between blue, purple, and cyan particles
          const colors = [
            'bg-blue-400/10 dark:bg-blue-300/10',
            'bg-purple-400/10 dark:bg-purple-300/10',
            'bg-cyan-400/10 dark:bg-cyan-300/10'
          ];
          colorClass = colors[Math.floor(Math.random() * colors.length)];
        }
        
        return (
          <div
            key={i}
            className={`absolute rounded-full ${colorClass}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              top: `${top}%`,
              left: `${left}%`,
              opacity,
              transform: `scale(${initialScale})`,
              animation: `float-${i % 5} ${duration}s ${delay}s infinite ease-in-out`,
            }}
          />
        );
      })}
      
      <style jsx global>{`
        @keyframes float-0 {
          0% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-20px) translateX(10px) scale(1.05); }
          50% { transform: translateY(-10px) translateX(20px) scale(1.1); }
          75% { transform: translateY(10px) translateX(15px) scale(1.05); }
          100% { transform: translateY(0) translateX(0) scale(1); }
        }
        
        @keyframes float-1 {
          0% { transform: translateY(0) translateX(0) scale(1); }
          33% { transform: translateY(-15px) translateX(-20px) scale(1.1); }
          66% { transform: translateY(15px) translateX(-10px) scale(0.95); }
          100% { transform: translateY(0) translateX(0) scale(1); }
        }
        
        @keyframes float-2 {
          0% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(25px) translateX(15px) scale(1.1); }
          100% { transform: translateY(0) translateX(0) scale(1); }
        }
        
        @keyframes float-3 {
          0% { transform: translateY(0) translateX(0) scale(0.9); }
          20% { transform: translateY(-10px) translateX(-15px) scale(1); }
          40% { transform: translateY(20px) translateX(10px) scale(1.1); }
          60% { transform: translateY(5px) translateX(25px) scale(1); }
          80% { transform: translateY(-15px) translateX(15px) scale(0.9); }
          100% { transform: translateY(0) translateX(0) scale(0.9); }
        }
        
        @keyframes float-4 {
          0% { transform: translateY(0) translateX(0) scale(1.1); }
          25% { transform: translateY(15px) translateX(10px) scale(1); }
          50% { transform: translateY(30px) translateX(-15px) scale(0.9); }
          75% { transform: translateY(15px) translateX(-25px) scale(1); }
          100% { transform: translateY(0) translateX(0) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default ParticleAnimation;