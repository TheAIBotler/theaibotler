'use client'

interface CategoryTagProps {
  id: string
  title: string
}

export function CategoryTag({ id, title }: CategoryTagProps) {
  return (
    <button 
      type="button"
      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      onClick={(e) => {
        // Stop propagation and prevent default
        e.stopPropagation()
        e.preventDefault()
        
        // Use window.location for direct navigation to avoid issues
        window.location.href = `/blog?category=${id}`
      }}
    >
      {title}
    </button>
  )
}
