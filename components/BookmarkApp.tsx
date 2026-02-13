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
    let channel: ReturnType<typeof supabase.channel> | null = null
    
    // Set up real-time subscription
    const setupRealtime = async () => {
      // Verify session is available
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('No session found, skipping real-time setup')
        return
      }

      // Set up real-time subscription
      // Use a shared channel name for broadcast events (same for all tabs)
      const broadcastChannelName = `bookmarks-broadcast-${user.id}`
      const channelName = `bookmarks:${user.id}:${Date.now()}`
      console.log('🔌 Setting up real-time subscription with channel:', channelName)
      console.log('📢 Broadcast channel:', broadcastChannelName)
      
      // Event handlers (define before using them)
      const handleInsertEvent = (payload: any) => {
        console.log('➕ Handling INSERT event:', payload)
        setBookmarks((prev) => {
          const exists = prev.some((b) => b.id === (payload.new as Bookmark).id)
          if (exists) {
            console.log('Bookmark already exists, skipping duplicate')
            return prev
          }
          console.log('Adding new bookmark from real-time:', payload.new)
          return [payload.new as Bookmark, ...prev]
        })
      }
      
      const handleDeleteEvent = (payload: any) => {
        console.log('🗑️ Handling DELETE event')
        console.log('DELETE payload:', JSON.stringify(payload, null, 2))
        console.log('Payload.old:', payload.old)
        console.log('Payload.old type:', typeof payload.old)
        
        let deletedId: string | undefined = undefined
        
        // Try to extract ID from payload.old
        if (payload.old) {
          if (typeof payload.old === 'object') {
            deletedId = (payload.old as any).id
            console.log('✅ Extracted ID from payload.old.id:', deletedId)
          }
        }
        
        // Fallback: check payload directly
        if (!deletedId && (payload as any).id) {
          deletedId = (payload as any).id
          console.log('✅ Extracted ID from payload.id:', deletedId)
        }
        
        if (deletedId) {
          console.log('✅ Removing bookmark with id:', deletedId)
          setBookmarks((prev) => {
            const filtered = prev.filter((bookmark) => bookmark.id !== deletedId)
            console.log(`✅ Removed bookmark via real-time. Before: ${prev.length}, After: ${filtered.length}`)
            return filtered
          })
        } else {
          console.error('❌ Could not extract ID from DELETE payload')
          console.log('Full payload:', payload)
          // Fallback: refresh the list
          console.log('🔄 Refreshing bookmarks list as fallback')
          setTimeout(() => fetchBookmarks(), 500)
        }
      }
      
      const handleUpdateEvent = (payload: any) => {
        console.log('🔄 Handling UPDATE event:', payload)
        setBookmarks((prev) =>
          prev.map((bookmark) =>
            bookmark.id === (payload.new as Bookmark).id
              ? (payload.new as Bookmark)
              : bookmark
          )
        )
      }
      
      channel = supabase
        .channel(channelName)
        // Listen for INSERT events
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 INSERT event received:', payload)
            handleInsertEvent(payload)
          }
        )
        // Listen for DELETE events separately
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 DELETE event received:', payload)
            handleDeleteEvent(payload)
          }
        )
        // Listen for UPDATE events
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 UPDATE event received:', payload)
            handleUpdateEvent(payload)
          }
        )
        // Also listen to broadcast events as fallback for DELETE
        .on('broadcast', { event: 'bookmark-deleted' }, (payload) => {
          console.log('📢 Broadcast DELETE event received:', payload)
          const deletedId = payload.payload?.id
          if (deletedId) {
            console.log('✅ Removing bookmark via broadcast:', deletedId)
            setBookmarks((prev) => {
              const filtered = prev.filter((b) => b.id !== deletedId)
              console.log(`✅ Removed via broadcast. Before: ${prev.length}, After: ${filtered.length}`)
              return filtered
            })
          }
        })
        .subscribe((status, err) => {
          console.log('📡 Subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to real-time updates')
            console.log('📡 Listening for INSERT, UPDATE, DELETE events on bookmarks table')
            console.log('🔄 Real-time updates will sync across all open tabs')
            console.log('👤 User ID filter:', user.id)
            console.log('📋 Table: bookmarks, Schema: public')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel error - real-time subscription failed:', err)
            if (err) {
              console.error('Error details:', JSON.stringify(err, null, 2))
            }
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect real-time subscription...')
              if (channel) {
                channel.subscribe()
              }
            }, 2000)
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ Subscription timed out, retrying...')
            setTimeout(() => {
              if (channel) {
                channel.subscribe()
              }
            }, 1000)
          } else if (status === 'CLOSED') {
            console.warn('🔒 Subscription closed')
          }
        })
      
      // Set up separate broadcast channel for DELETE events
      const broadcastChannel = supabase.channel(broadcastChannelName)
      broadcastChannel
        .on('broadcast', { event: 'bookmark-deleted' }, (payload) => {
          console.log('📢 Broadcast DELETE event received on broadcast channel:', payload)
          const deletedId = payload.payload?.id
          if (deletedId) {
            console.log('✅ Removing bookmark via broadcast:', deletedId)
            setBookmarks((prev) => {
              const filtered = prev.filter((b) => b.id !== deletedId)
              console.log(`✅ Removed via broadcast. Before: ${prev.length}, After: ${filtered.length}`)
              return filtered
            })
          }
        })
        .subscribe()
    }
    
    // Fetch initial bookmarks
    fetchBookmarks()
    
    // Set up real-time subscription
    setupRealtime()

    return () => {
      console.log('🧹 Cleaning up real-time subscription')
      if (channel) {
        supabase.removeChannel(channel)
      }
      // Clean up broadcast channel
      const broadcastChannel = supabase.channel(`bookmarks-broadcast-${user.id}`)
      supabase.removeChannel(broadcastChannel)
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
