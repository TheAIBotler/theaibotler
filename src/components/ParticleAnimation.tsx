'use client'

import { useState, useEffect } from 'react';

// Client-only component that avoids hydration mismatches
const ParticleAnimation = () => {
  const [particles, setParticles] = useState<Array<null>>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Only run this effect on the client after hydration
  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true);
    
    // Generate 15 empty particles for initial render
    setParticles(Array(15).fill(null));
  }, []);

  if (!isClient) {
    // Return an empty container during server rendering
    return <div className="absolute inset-0 overflow-hidden pointer-events-none"></div>;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => {
        // Generate random values - only happens on client
        const width = Math.random() * 10 + 5;
        const height = Math.random() * 10 + 5;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const opacity = Math.random() * 0.7 + 0.3;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        
        return (
          <div
            key={i}
            className="absolute rounded-full bg-blue-500/10 dark:bg-blue-400/10"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              top: `${top}%`,
              left: `${left}%`,
              opacity,
              animation: `float ${duration}s ${delay}s infinite ease-in-out`,
            }}
          />
        );
      })}
      
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(20px); }
          75% { transform: translateY(10px) translateX(15px); }
          100% { transform: translateY(0) translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ParticleAnimation;