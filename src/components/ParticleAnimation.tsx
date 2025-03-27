'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';

// Define particle type for better type safety
interface Particle {
  size: number;
  top: number;
  left: number;
  opacity: number;
  duration: number;
  delay: number;
  initialScale: number;
  animationIndex: number;
  colorClass: string;
}

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
  const [isClient, setIsClient] = useState(false);
  
  // Use a ref to avoid unnecessary re-renders on window resize
  const [windowWidth, setWindowWidth] = useState(0);
  
  // Properly typed throttle function to limit how often a function can be called
  const throttle = useCallback(<T extends unknown[]>(
    fn: (...args: T) => void, 
    limit: number
  ) => {
    let inThrottle = false;
    
    return (...args: T): void => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }, []);
  
  // Client-side only effects
  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);
    
    // Throttled resize handler to prevent performance issues
    const handleResize = throttle(() => {
      setWindowWidth(window.innerWidth);
    }, 200); // Update at most every 200ms
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [throttle]);
  
  // Generate particles only when needed params change
  const particles = useMemo(() => {
    if (!isClient) return [];
    
    // Adjust count based on screen size for better performance
    let adjustedCount = particleCount;
    if (windowWidth > 0) {
      if (windowWidth < 768) {
        adjustedCount = Math.floor(particleCount * 0.5); // 50% on mobile
      } else if (windowWidth < 1024) {
        adjustedCount = Math.floor(particleCount * 0.7); // 70% on tablets
      }
    }
    
    // Generate the particles with all needed properties pre-calculated
    return Array.from({ length: adjustedCount }, (_, i) => {
      const size = Math.random() * 15 + 5;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const opacity = Math.random() * 0.5 + 0.1;
      const duration = Math.random() * 8 + 7;
      const delay = Math.random() * 5;
      const initialScale = Math.random() * 0.5 + 0.5;
      const animationIndex = i % 5;
      
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
      
      return {
        size,
        top,
        left,
        opacity,
        duration,
        delay,
        initialScale,
        animationIndex,
        colorClass
      } as Particle;
    });
  }, [isClient, particleCount, particleColor, windowWidth]);
  
  // Memoize animation styles to avoid recreating on each render
  const animationStyles = useMemo(() => {
    return {
      __html: `
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
      `
    };
  }, []);

  if (!isClient) {
    // Return an empty container during server rendering
    return <div className={`${fullPage ? 'fixed inset-0 -z-10' : 'absolute inset-0'} overflow-hidden pointer-events-none`}></div>;
  }

  return (
    <div className={`${fullPage ? 'fixed inset-0 -z-10' : 'absolute inset-0'} overflow-hidden pointer-events-none`}>
      {particles.map((particle, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${particle.colorClass}`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            opacity: particle.opacity,
            transform: `scale(${particle.initialScale})`,
            animation: `float-${particle.animationIndex} ${particle.duration}s ${particle.delay}s infinite ease-in-out`,
          }}
        />
      ))}
      
      <style dangerouslySetInnerHTML={animationStyles} />
    </div>
  );
};

export default ParticleAnimation;