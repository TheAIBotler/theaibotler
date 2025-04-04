// components/SearchInput.tsx
'use client'

import { useCallback, useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import debounce from 'lodash/debounce'

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  const createQueryString = useCallback(
    (searchQuery: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (searchQuery) {
        params.set('search', searchQuery)
      } else {
        params.delete('search')
      }
      
      return params.toString()
    },
    [searchParams]
  )

  // Move the debounced function inside useEffect to properly handle cleanup
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      router.push(`/blog?${createQueryString(query || null)}`)
    }, 300),
    [router, createQueryString]
  )

  // Cleanup the debounced function
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  return (
    <div className="relative">
      <input
      type="text"
      value={searchValue}
      onChange={handleSearch}
      placeholder="Search posts..."
      className="w-full px-4 py-2 pl-10 border rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      aria-label="Search posts"
      />
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
    </div>
  )
}