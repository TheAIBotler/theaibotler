'use client'

import { useEffect, useRef } from 'react';
import { useSubscriptionForm } from '@/hooks/useSubscriptionForm';
import { Send, X } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
}

const WaitlistModal = ({ isOpen, onClose, toolName }: WaitlistModalProps) => {
  // Use the custom hook for form management
  const {
    email,
    setEmail,
    isSubmitting,
    isError,
    isSuccess,
    message,
    handleSubmit,
    resetForm
  } = useSubscriptionForm({
    successMessage: 'Thanks for joining the waitlist! Check your email for confirmation.',
    onSuccess: () => {
      // Close modal after success (with delay for user to see confirmation)
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  });
  
  // Modal interaction
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // The handleSubmit function now comes from the custom hook

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative overflow-hidden"
      >
        {/* Close button */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-20"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Gradient background elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-800/20 opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-28 h-28 rounded-full bg-purple-100 dark:bg-purple-800/20 opacity-50"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Join the waitlist</h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {toolName 
              ? `Get early access to ${toolName} and be the first to know when it's ready.` 
              : 'Get early access to our upcoming AI tools and exclusive updates on new features.'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Your email address"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || isSuccess}
            />
            
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
            <p className={`mt-3 text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitlistModal;