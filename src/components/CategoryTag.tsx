'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface CategoryTagProps {
  id: string
  title: string
}

export function CategoryTag({ id, title }: CategoryTagProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleCategoryClick = (e: React.MouseEvent) => {
    // Stop propagation and prevent default
    e.stopPropagation()
    e.preventDefault()
    
    // Create new URLSearchParams object with existing params
    const params = new URLSearchParams(searchParams)
    
    // Set the category parameter
    params.set('category', id)
    
    // Navigate to blog page with the category filter
    // If already on blog page, preserve the current path
    const targetPath = pathname.includes('/blog') ? pathname.split('/').slice(0, 2).join('/') : '/blog'
    router.push(`${targetPath}?${params.toString()}`)
  }

  return (
    <button 
      type="button"
      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      onClick={handleCategoryClick}
    >
      {title}
    </button>
  )
}
