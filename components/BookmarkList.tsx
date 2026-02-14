'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import DeleteConfirmModal from './DeleteConfirmModal'

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
  const [confirmingDelete, setConfirmingDelete] = useState<{ id: string; title: string } | null>(null)

  const openDeleteConfirm = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id)
    setConfirmingDelete({ id, title: bookmark?.title || 'this bookmark' })
  }

  const closeDeleteConfirm = () => {
    if (!deletingId) setConfirmingDelete(null)
  }

  const performDelete = async () => {
    if (!confirmingDelete) return
    const { id } = confirmingDelete
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
      
      // Broadcast DELETE to other tabs (send without subscribing = uses HTTP, fast)
      try {
        const broadcastChannel = supabase.channel(`bookmarks-broadcast-${userId}`)
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'bookmark-deleted',
          payload: { id: id },
        })
        console.log('📢 Broadcast DELETE event sent for bookmark:', id)
        supabase.removeChannel(broadcastChannel)
      } catch (broadcastError) {
        console.warn('⚠️ Failed to broadcast DELETE event:', broadcastError)
      }
      
      // Trigger refresh callback for immediate UI update in same tab
      // Real-time will handle updates in other tabs
      if (onBookmarkDeleted) {
        setTimeout(() => onBookmarkDeleted(), 100)
      }
      setConfirmingDelete(null)
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert(err.message || 'Failed to delete bookmark')
    } finally {
      setDeletingId(null)
    }
  }

  const handleConfirmDelete = () => {
    performDelete()
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
      <div className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center">
        <div className="inline-block p-4 sm:p-6 bg-white/5 rounded-full mb-4 sm:mb-6">
          <svg className="w-14 h-14 sm:w-20 sm:h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">No bookmarks yet</h3>
        <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto px-2">
          Start building your collection by adding your first bookmark above
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Your Bookmarks
          </h2>
          <p className="text-gray-400 text-sm">
            {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'} saved
          </p>
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full w-fit">
          <span className="text-white font-semibold text-base sm:text-lg">{bookmarks.length}</span>
        </div>
      </div>
      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 group"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start sm:gap-6">
              <div className="flex-1 min-w-0 flex gap-3 sm:gap-5">
                <div className="flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 bg-white/5 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10 group-hover:border-purple-500/30 transition-colors">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-purple-300 font-semibold text-base sm:text-lg block truncate mb-1 sm:mb-2 transition-colors group-hover:underline"
                  >
                    {bookmark.title}
                  </a>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-cyan-300 text-xs sm:text-sm block truncate mb-2 sm:mb-3 transition-colors"
                  >
                    {bookmark.url}
                  </a>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">Added {formatDate(bookmark.created_at)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openDeleteConfirm(bookmark.id)}
                disabled={deletingId === bookmark.id}
                className="px-4 py-3 sm:py-2.5 bg-white/5 border border-white/10 text-red-300 text-sm rounded-full hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium flex-shrink-0 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
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

      <DeleteConfirmModal
        isOpen={!!confirmingDelete}
        title={confirmingDelete?.title ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteConfirm}
        isLoading={!!deletingId}
      />
    </div>
  )
}
