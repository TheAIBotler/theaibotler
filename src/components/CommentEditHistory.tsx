// components/CommentEditHistory.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/utils/supabase/client'
import { CommentEdit } from '@/app/utils/supabase/types'
import { formatDistanceToNowStrict } from 'date-fns'

interface CommentEditHistoryProps {
  commentId: string
  onClose: () => void
}

export default function CommentEditHistory({ commentId, onClose }: CommentEditHistoryProps) {
  const [editHistory, setEditHistory] = useState<CommentEdit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEditHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('comment_edits')
          .select('*')
          .eq('comment_id', commentId)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        setEditHistory(data || [])
      } catch (err) {
        setError('Failed to load edit history')
        console.error('Error loading edit history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEditHistory()
  }, [commentId])

  const formatTimeAgo = (dateStr: string) => {
    let timeAgo = formatDistanceToNowStrict(new Date(dateStr), { 
      addSuffix: false,
      roundingMethod: 'floor'
    })
    
    // Replace full unit names with abbreviations
    timeAgo = timeAgo
      .replace(' seconds', 's')
      .replace(' second', 's')
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' months', 'mo')
      .replace(' month', 'mo')
      .replace(' years', 'y')
      .replace(' year', 'y')
      
    return `${timeAgo} ago`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Edit History</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        {loading ? (
          <p className="text-center py-4">Loading edit history...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-4">{error}</p>
        ) : editHistory.length === 0 ? (
          <p className="text-center py-4">No edit history found</p>
        ) : (
          <div className="space-y-4">
            {editHistory.map((edit) => (
              <div key={edit.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(edit.created_at)}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                    {edit.edited_by_author ? 'Edited by Author' : 'Edited by User'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {edit.previous_content}
                </p>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}