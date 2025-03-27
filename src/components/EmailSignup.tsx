'use client'

import { Send } from 'lucide-react';
import { useSubscriptionForm } from '@/hooks/useSubscriptionForm';

const EmailSignup = () => {
  // Use the custom subscription form hook
  const {
    email,
    setEmail,
    isSubmitting,
    isError,
    isSuccess,
    message,
    handleSubmit
  } = useSubscriptionForm({
    successMessage: 'Thanks for subscribing! Check your email for confirmation.'
  });

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 mt-16 mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <h2 id="waitlist-heading" className="text-2xl md:text-3xl font-bold mb-2">Join the waitlist</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg">
          Get early access to my upcoming AI tools and exclusive updates on new features and releases.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg" aria-labelledby="waitlist-heading">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting || isSuccess}
            id="email-signup"
            aria-required="true"
            aria-invalid={isError ? "true" : "false"}
            aria-describedby={message ? "email-form-message" : undefined}
          />
          <button
            type="submit"
            className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            } ${isSuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
            disabled={isSubmitting || isSuccess}
            aria-busy={isSubmitting ? "true" : "false"}
          >
            {isSubmitting ? (
              'Subscribing...'
            ) : isSuccess ? (
              'Subscribed!'
            ) : (
              <>
                Join waitlist
                <Send className="ml-2 h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
        
        {/* Show success or error message */}
        {message && (
          <p 
            id="email-form-message"
            className={`mt-3 text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}
            role={isError ? "alert" : "status"}
          >
            {message}
          </p>
        )}
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-blue-100 dark:bg-blue-800/20 opacity-50"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 rounded-full bg-purple-100 dark:bg-purple-800/20 opacity-50"></div>
    </div>
  );
};

export default EmailSignup;