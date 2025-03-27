// app/api/subscribe/route.ts
import { NextResponse } from 'next/server';
import { SubscriptionFormData, SubscriptionResponse } from '@/types';

// You'll set these in your .env.local file
const API_KEY = process.env.CONVERTKIT_API_KEY;
const FORM_ID = process.env.CONVERTKIT_FORM_ID;

// Email validation using regex
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function POST(request: Request) {
  // Validate environment variables
  if (!API_KEY || !FORM_ID) {
    console.error('Missing required environment variables: CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' } as SubscriptionResponse,
        { status: 400 }
      );
    }
    
    const { email } = body as SubscriptionFormData;
    
    // Enhanced email validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' } as SubscriptionResponse,
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' } as SubscriptionResponse,
        { status: 400 }
      );
    }

    // Add security headers for ConvertKit API call
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'The AI Botler Website',
    };

    // Direct API call to ConvertKit - no package needed
    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          api_key: API_KEY,
          email,
        } as Record<string, string>),
      }
    );

    // Check for network errors or timeouts
    if (!response) {
      throw new Error('Network error when contacting subscription service');
    }

    try {
      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Error subscribing to the newsletter';
        
        // Handle ConvertKit specific errors
        if (data.error) {
          errorMessage = data.message || errorMessage;
        }
        
        console.error('Subscription API error:', {
          status: response.status,
          data
        });
        
        return NextResponse.json(
          { error: errorMessage } as SubscriptionResponse,
          { status: response.status }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Successfully subscribed to the newsletter!' } as SubscriptionResponse,
        { status: 201 }
      );
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      return NextResponse.json(
        { error: 'Error processing the subscription service response' } as SubscriptionResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Subscription error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'An error occurred while subscribing' } as SubscriptionResponse,
      { status: 500 }
    );
  }
}