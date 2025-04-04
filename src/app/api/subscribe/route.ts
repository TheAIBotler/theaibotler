// app/api/subscribe/route.ts
import { NextResponse } from 'next/server';

// You'll set these in your .env.local file
const API_KEY = process.env.CONVERTKIT_API_KEY;
const FORM_ID = process.env.CONVERTKIT_FORM_ID;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Direct API call to ConvertKit - no package needed
    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: API_KEY,
          email,
          // Optional: Add first_name if you collect it
          // first_name: firstName
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'Error subscribing to the newsletter';
      
      // Handle ConvertKit specific errors
      if (data.error) {
        errorMessage = data.message || errorMessage;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed to the newsletter!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'An error occurred while subscribing' },
      { status: 500 }
    );
  }
}