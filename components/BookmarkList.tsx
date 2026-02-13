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
    const bookmark = bookmarks.find(b => b.id === id)
    const confirmed = window.confirm(
      `Are you sure you want to delete "${bookmark?.title || 'this bookmark'}"?\n\nThis action cannot be undone.`
    )
    if (!confirmed) {
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
      <div className="glass rounded-3xl p-16 text-center">
        <div className="inline-block p-6 bg-white/5 rounded-full mb-6">
          <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No bookmarks yet</h3>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Start building your collection by adding your first bookmark above
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Your Bookmarks
          </h2>
          <p className="text-gray-400 text-sm">
            {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'} saved
          </p>
        </div>
        <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full">
          <span className="text-white font-semibold text-lg">{bookmarks.length}</span>
        </div>
      </div>
      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="glass-card rounded-2xl p-6 group"
          >
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 min-w-0 flex gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-purple-500/30 transition-colors">
                  <svg className="w-7 h-7 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-purple-300 font-semibold text-lg block truncate mb-2 transition-colors group-hover:underline"
                  >
                    {bookmark.title}
                  </a>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-cyan-300 text-sm block truncate mb-3 transition-colors"
                  >
                    {bookmark.url}
                  </a>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Added {formatDate(bookmark.created_at)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(bookmark.id)}
                disabled={deletingId === bookmark.id}
                className="px-5 py-2.5 bg-white/5 border border-white/10 text-red-300 text-sm rounded-full hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium flex-shrink-0"
              >
                {deletingId === bookmark.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
