// components/CategoryFilter.tsx
'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Category {
  _id: string
  title: string
}

interface CategoryFilterProps {
  categories: Category[]
  activeCategory?: string | null
}

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

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-2 px-2">
      <Link
        href={`/blog?${createQueryString(null)}`}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0 shadow-sm
          ${!activeCategory 
            ? 'bg-blue-500 dark:bg-blue-600 text-white ring-1 ring-blue-500/20 dark:ring-blue-500/30 hover:bg-blue-600 dark:hover:bg-blue-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
      >
        All Posts
      </Link>
      
      {categories.map((category) => (
        <Link
          key={category._id}
          href={`/blog?${createQueryString(category._id)}`}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0 shadow-sm
            ${activeCategory === category._id
              ? 'bg-blue-500 dark:bg-blue-600 text-white ring-1 ring-blue-500/20 dark:ring-blue-500/30 hover:bg-blue-600 dark:hover:bg-blue-700'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
        >
          {category.title}
        </Link>
      ))}
    </div>
  )
}