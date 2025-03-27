'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  objectFit = 'cover',
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`overflow-hidden ${className}`} style={{ position: 'relative' }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-sm' : 'scale-100 blur-0'}
        `}
        style={{
          objectFit,
          width: '100%',
          height: 'auto',
          maxWidth: '100%',
        }}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default OptimizedImage;