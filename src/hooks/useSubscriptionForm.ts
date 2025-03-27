'use client'

import { useState, FormEvent } from 'react';
import { 
  SubscriptionFormData, 
  SubscriptionResponse,
  UseSubscriptionFormProps 
} from '@/types';

export function useSubscriptionForm({ 
  onSuccess, 
  successMessage = 'Thanks for subscribing! Check your email for confirmation.'
}: UseSubscriptionFormProps = {}) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form state
  const resetForm = () => {
    setEmail('');
    setMessage('');
    setIsError(false);
    setIsSuccess(false);
  };

  // Helper function to submit subscription data
  async function submitSubscription(email: string): Promise<SubscriptionResponse> {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email } as SubscriptionFormData),
    });
    
    return await response.json() as SubscriptionResponse;
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !email.includes('@')) {
      setIsError(true);
      setMessage('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);
    
    try {
      const data = await submitSubscription(email);
      
      if (data.error) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      
      // Success state
      setIsSuccess(true);
      setMessage(successMessage);
      setEmail(''); // Clear input
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: unknown) {
      // Error state
      setIsError(true);
      // Handle error safely with type checking
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Failed to subscribe. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    setEmail,
    isSubmitting,
    isError,
    isSuccess,
    message,
    handleSubmit,
    resetForm
  };
}
