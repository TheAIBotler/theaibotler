// components/AuthorLogin.tsx
'use client'

import { User, LogOut } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/context/AuthContext'

export default function AuthorLogin() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { signIn, signOut, user, isAuthor } = useAuth()

  useEffect(() => {
    setMounted(true)
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!mounted) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setError(null)

    try {
      const { error: signInError } = await signIn(credentials.email, credentials.password)

      if (signInError) {
        console.error('Sign in error:', signInError)
        setError('Invalid email or password')
      } else {
        setIsOpen(false)
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
      setIsOpen(false)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  // If logged in as author
  if (user && isAuthor) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleSignOut}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center gap-2 p-1.5 text-gray-400 hover:text-gray-200 rounded transition-colors relative"
          aria-label="Sign out"
        >
          <LogOut size={18} />
          <span className="hidden md:inline text-sm">Sign out</span>
          {showTooltip && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-200 text-xs rounded whitespace-nowrap">
              Sign out
            </div>
          )}
        </button>
      </div>
    )
  }

  // If not logged in
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1.5 text-gray-400 hover:text-gray-200 rounded transition-colors relative"
        aria-label="Author login"
      >
        <User size={18} />
        {showTooltip && !isOpen && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-200 text-xs rounded whitespace-nowrap">
            Author login
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Desktop dropdown - centered */}
          <div 
            className="hidden md:block absolute left-1/2 -translate-x-1/2 top-8 mt-2 p-4 w-64 bg-white rounded-lg shadow-lg z-50"
          >
            <h3 className="text-sm font-medium text-gray-900 mb-3">Author Login</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>

          {/* Mobile modal */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
              }
            }}
          >
            <div 
              className="bg-white w-full max-w-xs rounded-2xl shadow-xl transform transition-transform duration-300 translate-y-0 scale-100 opacity-100"
              style={{ maxHeight: '90vh' }}
            >
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-900">Author Login</h3>
              </div>
              <div className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleChange}
                      placeholder="Email"
                      required
                      className="w-full px-4 py-3 text-base border rounded-xl bg-gray-50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      placeholder="Password"
                      required
                      className="w-full px-4 py-3 text-base border rounded-xl bg-gray-50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 text-base font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoggingIn ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}