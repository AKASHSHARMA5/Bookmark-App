'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface BookmarkFormProps {
  userId: string
  onBookmarkAdded?: () => void
}

export default function BookmarkForm({ userId, onBookmarkAdded }: BookmarkFormProps) {
  const supabase = createSupabaseClient()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('URL is required')
      return
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from('bookmarks')
        .insert([
          {
            url: url.trim(),
            title: title.trim() || url.trim(),
            user_id: userId,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Reset form
      setUrl('')
      setTitle('')
      
      // Trigger refresh callback for immediate UI update
      if (onBookmarkAdded) {
        onBookmarkAdded()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add bookmark')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-8 mb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Add New Bookmark
        </h2>
        <p className="text-gray-400 text-sm">
          Save your favorite links for quick access
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-semibold text-gray-300 mb-3"
          >
            URL <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="input-field"
            required
          />
        </div>
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-gray-300 mb-3"
          >
            Title <span className="text-gray-500 font-normal text-xs">(optional)</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give it a memorable name"
            className="input-field"
          />
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-4 rounded-full flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Bookmark</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
