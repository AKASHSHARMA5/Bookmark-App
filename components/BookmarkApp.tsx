'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import BookmarkList from './BookmarkList'
import BookmarkForm from './BookmarkForm'

interface Bookmark {
  id: string
  url: string
  title: string
  user_id: string
  created_at: string
}

interface BookmarkAppProps {
  user: User
}

export default function BookmarkApp({ user }: BookmarkAppProps) {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch bookmarks function (can be called from child components)
  const fetchBookmarks = useCallback(async () => {
    const supabase = createSupabaseClient()
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookmarks(data || [])
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error.message)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    // Fetch initial bookmarks
    fetchBookmarks()

    // Set up real-time subscription
    const channel = supabase
      .channel('bookmarks-changes', {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime event received:', payload.eventType, payload)
          
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => {
              // Check if bookmark already exists to avoid duplicates
              const exists = prev.some((b) => b.id === payload.new.id)
              if (exists) return prev
              return [payload.new as Bookmark, ...prev]
            })
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) =>
              prev.filter((bookmark) => bookmark.id !== payload.old.id)
            )
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks((prev) =>
              prev.map((bookmark) =>
                bookmark.id === payload.new.id
                  ? (payload.new as Bookmark)
                  : bookmark
              )
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error - real-time subscription failed')
        }
      })

    return () => {
      console.log('Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [user.id, fetchBookmarks])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Smart Bookmark App
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <BookmarkForm 
          userId={user.id} 
          onBookmarkAdded={fetchBookmarks}
        />

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Loading bookmarks...</p>
          </div>
        ) : (
          <BookmarkList 
            bookmarks={bookmarks} 
            userId={user.id}
            onBookmarkDeleted={fetchBookmarks}
          />
        )}
      </div>
    </div>
  )
}
