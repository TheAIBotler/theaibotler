// components/Navigation.tsx
"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const Navigation = () => {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ]
  
  return (
    <header className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
              The AI Botler
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Navigation