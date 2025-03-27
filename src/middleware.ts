import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for rate limiting
// Note: This will reset when the server restarts and doesn't work well with multiple instances
// For production, consider using Redis or another persistent store
interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per window
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const ip in rateLimitStore) {
    if (rateLimitStore[ip].resetTime < now) {
      delete rateLimitStore[ip];
    }
  }
}, 60 * 1000); // Clean up every minute

export function middleware(request: NextRequest) {
  // Only apply rate limiting to the subscribe API endpoint
  if (request.nextUrl.pathname === '/api/subscribe') {
    return handleRateLimit(request);
  }
  
  return NextResponse.next();
}

function handleRateLimit(request: NextRequest) {
  // Get IP address from headers or use a fallback
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const now = Date.now();
  
  // Initialize or update rate limit info for this IP
  if (!rateLimitStore[ip] || rateLimitStore[ip].resetTime < now) {
    rateLimitStore[ip] = {
      count: 1,
      resetTime: now + RATE_LIMIT_DURATION,
    };
    return NextResponse.next();
  }
  
  // Increment the request count
  rateLimitStore[ip].count++;
  
  // Check if the IP has exceeded the rate limit
  if (rateLimitStore[ip].count > MAX_REQUESTS_PER_WINDOW) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please try again later',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': `${Math.ceil((rateLimitStore[ip].resetTime - now) / 1000)}`,
        },
      }
    );
  }
  
  return NextResponse.next();
}

// Define which paths this middleware will run on
export const config = {
  matcher: '/api/:path*', // Apply to all API routes
};
