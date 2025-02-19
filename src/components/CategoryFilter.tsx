// app/components/CategoryFilter.tsx
'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface Category {
  _id: string
  title: string
}

interface CategoryFilterProps {
  categories: Category[]
  activeCategory?: string | null
}

const CATEGORY_DISPLAY_LIMIT = 5

export function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (categoryId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (categoryId) {
        params.set('category', categoryId)
      } else {
        params.delete('category')
      }
      
      return params.toString()
    },
    [searchParams]
  )

  const activeCategory_data = useMemo(() => {
    return categories.find(cat => cat._id === activeCategory)
  }, [categories, activeCategory])

  const showDropdown = categories.length > CATEGORY_DISPLAY_LIMIT

  if (showDropdown) {
    return (
      <div className="mb-8 flex gap-2 items-center">
        <Link
          href={`/blog?${createQueryString(null)}`}
          className={`px-4 py-2 rounded-full text-sm transition-colors
            ${!activeCategory 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
        >
          All
        </Link>
        <div className="relative group">
          <button 
            className="px-4 py-2 rounded-full text-sm bg-gray-100 hover:bg-gray-200 
                       text-gray-800 flex items-center gap-2"
          >
            {activeCategory_data ? activeCategory_data.title : 'Select Category'}
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg 
                          opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                          transition-all duration-200 z-10">
            <div className="py-2 max-h-80 overflow-y-auto">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/blog?${createQueryString(category._id)}`}
                  className={`block px-4 py-2 text-sm hover:bg-gray-100
                    ${activeCategory === category._id
                      ? 'bg-gray-50 text-blue-500'
                      : 'text-gray-800'
                    }`}
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/blog?${createQueryString(null)}`}
          className={`px-4 py-2 rounded-full text-sm transition-colors
            ${!activeCategory 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/blog?${createQueryString(category._id)}`}
            className={`px-4 py-2 rounded-full text-sm transition-colors
              ${activeCategory === category._id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </div>
  )
}