// components/AuthorLogin.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'

export default function AuthorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  
  const { signIn, signOut, user, isAuthor } = useAuth()

  // Effect to check auth status and hide login form if already logged in
  useEffect(() => {
    if (user && isAuthor) {
      setShowLoginForm(false)
    }
    setAuthChecked(true)
  }, [user, isAuthor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setError(null)

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        console.error('Sign in error:', signInError)
        setError('Invalid email or password')
      } else {
        setShowLoginForm(false)
      }
    } catch (err) {
      console.error('Error during login:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Instead of reloading the whole page, just update state
      // and let React handle the re-rendering
      // window.location.reload() - remove this
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  // Show loading state while checking auth
  if (!authChecked) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  // Show user info and sign out button if logged in as author
  if (user && isAuthor) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Signed in as author
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign out
        </button>
      </div>
    )
  }

  // Show login form or login button
  return (
    <div>
      {!showLoginForm ? (
        <button
          onClick={() => setShowLoginForm(true)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
        >
          Author login
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Author Login</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
              <button
                type="button"
                onClick={() => setShowLoginForm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}