// components/ShareButtons.tsx
'use client'

import { Share, Link as LinkIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface ShareButtonsProps {
  title: string
  url: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
        setIsOpen(false)
      }, 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareOptions = [
    {
      label: isCopied ? 'Copied!' : 'Copy link',
      icon: <LinkIcon size={16} className="text-gray-600 shrink-0" />,
      onClick: handleCopyLink
    },
    {
      label: 'Share on X',
      icon: (
        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      onClick: () => window.open(shareLinks.twitter, '_blank')
    },
    {
      label: 'Share on Facebook',
      icon: (
        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      onClick: () => window.open(shareLinks.facebook, '_blank')
    },
    {
      label: 'Share on LinkedIn',
      icon: (
        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      onClick: () => window.open(shareLinks.linkedin, '_blank')
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1.5 text-gray-400 hover:text-gray-200 rounded transition-colors relative"
        aria-label="Share post"
      >
        <Share size={18} />
        {showTooltip && !isOpen && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-200 text-sm rounded whitespace-nowrap">
            Share
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Desktop dropdown */}
          <div 
            style={{ position: 'fixed', transform: 'translateX(-45%)' }} 
            className="hidden md:block mt-2 py-2 w-48 bg-white rounded-lg shadow-lg z-50"
          >
            {shareOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.onClick}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700"
              >
                {option.icon}
                <span className="text-left text-sm">{option.label}</span>
              </button>
            ))}
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
                <h3 className="text-lg font-medium text-gray-900">Share this post</h3>
              </div>
              <div className="p-2">
                {shareOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={option.onClick}
                    className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    {option.icon}
                    <span className="text-left text-base font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}