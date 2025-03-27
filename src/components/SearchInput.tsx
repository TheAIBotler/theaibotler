// components/SearchInput.tsx
'use client'

import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import debounce from 'lodash/debounce'

interface Category {
  _id: string
  title: string
}

interface SearchInputProps {
  categories?: Category[]
  activeCategory?: string | null
}

export function SearchInput({ categories = [], activeCategory }: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [isFocused, setIsFocused] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<Category[]>([])
  
  // Find active category for display
  const activeCategoryData = categories.find(cat => cat._id === activeCategory)

  // Handle query string creation
  const createQueryString = useCallback(
    (searchQuery: string | null, categoryId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      
      // Handle search parameter
      if (searchQuery) {
        params.set('search', searchQuery)
      } else {
        params.delete('search')
      }
      
      // Handle category parameter
      if (categoryId) {
        params.set('category', categoryId)
      } else {
        params.delete('category')
      }
      
      return params.toString()
    },
    [searchParams]
  )

  // Generate suggestions based on input
  useEffect(() => {
    if (searchValue && categories.length > 0) {
      // Filter categories that match the input anywhere in title
      const matchingCategories = categories.filter(category => 
        category.title.toLowerCase().includes(searchValue.toLowerCase())
      )
      setSuggestions(matchingCategories)
    } else {
      setSuggestions([])
    }
  }, [searchValue, categories])

  // Search debouncing
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      // Check if query matches or is contained in a category name
      const matchingCategory = categories.find(
        category => category.title.toLowerCase() === query.toLowerCase()
      )
      
      // If there's an exact match, filter by category. Otherwise, search text
      if (matchingCategory) {
        router.push(`/blog?${createQueryString(null, matchingCategory._id)}`)
      } else {
        router.push(`/blog?${createQueryString(query || null, activeCategory || null)}`)
      }
    }, 300),
    [router, createQueryString, categories, activeCategory]
  )

  // Cleanup the debounced function
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  // Handle category selection from suggestions
  const handleCategorySelect = (categoryId: string) => {
    router.push(`/blog?${createQueryString(null, categoryId)}`)
    setSearchValue('')
    setSuggestions([])
    setIsFocused(false)
  }

  // Handle clear category filter
  const handleClearCategory = () => {
    router.push(`/blog?${createQueryString(searchValue || null, null)}`)
  }

  // Toggle search on mobile
  const toggleSearch = () => {
    setSearchOpen(!searchOpen)
    if (!searchOpen) {
      // Focus on input when search opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  return (
    <>
      {/* Mobile search icon */}
      <button 
        onClick={toggleSearch}
        className="sm:hidden flex items-center justify-center h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
        aria-label="Toggle search"
      >
        <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      
      {/* Full search component */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop for mobile - clicking dismisses search */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={toggleSearch}
            aria-hidden="true"
          />
          
          {/* Search panel */}
          <div className="relative bg-white dark:bg-gray-900 p-4 max-w-md mx-auto mt-16 rounded-lg shadow-xl">
            {/* Close button */}
            <div className="flex justify-end mb-4">
              <button 
                onClick={toggleSearch}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close search"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            <div className="relative w-full">
              {/* Search input */}
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={handleSearch}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder={activeCategory ? "Search..." : "Search by keyword or category..."}
                className={`w-full h-10 ${activeCategory ? 'pr-28' : 'pr-4'} py-2 pl-10 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 
                         bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm
                         placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 dark:focus:border-blue-400 transition-all`}
                aria-label="Search articles or categories"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />

              {/* Active category indicator with clear option */}
              {activeCategory && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium">
                    {activeCategoryData?.title}
                    <button 
                      onClick={handleClearCategory}
                      className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                      aria-label="Clear category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Category suggestions dropdown */}
              {isFocused && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                  <div className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</div>
                  <div className="p-1">
                    {suggestions.map(category => (
                      <button
                        key={category._id}
                        onClick={() => handleCategorySelect(category._id)}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {category.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Popular search terms & categories */}
            {suggestions.length === 0 && searchValue === '' && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Try searching for:</p>
                
                {/* Popular search terms */}
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Popular topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {['AI', 'Guide', 'Tutorial', 'Tips', 'Review'].map(term => (
                      <button
                        key={term}
                        onClick={() => {
                          setSearchValue(term)
                          debouncedSearch(term)
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Categories */}
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 5).map(category => (
                    <button
                      key={category._id}
                      onClick={() => handleCategorySelect(category._id)}
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700"
                    >
                      {category.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Desktop search input */}
      {!searchOpen && (
        <div className="hidden sm:block relative w-full">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={activeCategory ? "Search..." : "Search by keyword or category..."}
            className={`w-full h-10 ${activeCategory ? 'pr-28' : 'pr-4'} py-2 pl-10 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm
                     placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500 dark:focus:border-blue-400 transition-all`}
            aria-label="Search articles or categories"
          />
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />

          {/* Active category indicator with clear option */}
          {activeCategory && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium">
                {activeCategoryData?.title}
                <button 
                  onClick={handleClearCategory}
                  className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  aria-label="Clear category filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
          
          {/* Category suggestions dropdown */}
          {isFocused && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
              <div className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</div>
              <div className="p-1">
                {suggestions.map(category => (
                  <button
                    key={category._id}
                    onClick={() => handleCategorySelect(category._id)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}