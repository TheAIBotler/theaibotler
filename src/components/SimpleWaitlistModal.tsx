'use client'

import { useState, useEffect } from 'react';
import { WaitlistModalProps } from '@/types';
import { Send, X } from 'lucide-react';

const SimpleWaitlistModal = ({ isOpen, onClose, toolName }: WaitlistModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState('');

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setIsSubmitting(false);
      setIsSuccess(false);
      setIsError(false);
      setMessage('');
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      setIsError(true);
      setMessage('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      
      // Success state
      setIsSuccess(true);
      setMessage('Thanks for joining the waitlist! Check your email for confirmation.');
      
      // Close modal after success with delay
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error: unknown) {
      // Error state
      setIsError(true);
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to join waitlist. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-2">Join the waitlist</h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {toolName 
            ? `Get early access to ${toolName} and be the first to know when it's ready.` 
            : 'Get early access to our upcoming AI tools and exclusive updates on new features.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="waitlist-email" className="sr-only">Email address</label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || isSuccess}
            />
          </div>
          
          <button
            type="submit"
            className={`w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            } ${isSuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting ? (
              'Joining...'
            ) : isSuccess ? (
              'Joined!'
            ) : (
              <>
                Join waitlist
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
        
        {/* Message display */}
        {message && (
          <p 
            className={`mt-3 text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}
          >
            {message}
          </p>
        )}
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default SimpleWaitlistModal;