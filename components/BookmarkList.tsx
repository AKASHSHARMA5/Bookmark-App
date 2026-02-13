'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface Bookmark {
  id: string
  url: string
  title: string
  user_id: string
  created_at: string
}

interface BookmarkListProps {
  bookmarks: Bookmark[]
  userId: string
  onBookmarkDeleted?: () => void
}

export default function BookmarkList({
  bookmarks,
  userId,
  onBookmarkDeleted,
}: BookmarkListProps) {
  const supabase = createSupabaseClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return
    }

    setDeletingId(id)
    try {
      console.log('🗑️ Deleting bookmark:', id)
      
      // Delete the bookmark
      // Note: Real-time subscription will handle updates in other tabs
      const { data, error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only delete their own bookmarks
        .select()

      if (error) {
        console.error('Delete error:', error)
        throw error
      }
      
      console.log('✅ Bookmark deleted successfully:', data)
      
      // Broadcast DELETE event to all tabs as fallback
      // This ensures DELETE events propagate even if postgres_changes doesn't work
      try {
        const broadcastChannel = supabase.channel(`bookmarks-broadcast-${userId}`)
        await broadcastChannel.subscribe()
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'bookmark-deleted',
          payload: { id: id },
        })
        console.log('📢 Broadcast DELETE event sent for bookmark:', id)
        // Don't remove channel immediately, let other tabs receive the message
        setTimeout(() => {
          supabase.removeChannel(broadcastChannel)
        }, 1000)
      } catch (broadcastError) {
        console.warn('⚠️ Failed to broadcast DELETE event:', broadcastError)
      }
      
      // Trigger refresh callback for immediate UI update in same tab
      // Real-time will handle updates in other tabs
      if (onBookmarkDeleted) {
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => {
          onBookmarkDeleted()
        }, 100)
      }
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert(err.message || 'Failed to delete bookmark')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 text-lg">
          No bookmarks yet. Add your first bookmark above!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Your Bookmarks ({bookmarks.length})
      </h2>
      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold text-lg block truncate"
                >
                  {bookmark.title}
                </a>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm block truncate mt-1"
                >
                  {bookmark.url}
                </a>
                <p className="text-gray-400 text-xs mt-2">
                  Added {formatDate(bookmark.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(bookmark.id)}
                disabled={deletingId === bookmark.id}
                className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === bookmark.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
