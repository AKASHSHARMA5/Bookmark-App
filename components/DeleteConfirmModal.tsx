'use client'

import { useEffect } from 'react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  title: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen || isLoading) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, isLoading, onCancel])

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity focus:outline-none disabled:pointer-events-none"
        aria-label="Close modal"
      />
      {/* Modal */}
      <div className="glass relative w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="delete-modal-title"
              className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight"
            >
              Delete bookmark?
            </h2>
            <p id="delete-modal-description" className="text-gray-400 text-sm sm:text-base mb-1">
              Are you sure you want to delete &quot;{title}&quot;?
            </p>
            <p className="text-gray-500 text-xs sm:text-sm">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:mt-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary flex-1 min-h-[48px] sm:min-h-0 py-3 sm:py-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 min-h-[48px] sm:min-h-0 py-3 sm:py-3 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-red-500/20 border-2 border-red-500/40 text-red-300 hover:bg-red-500/30 hover:border-red-500/50"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
