import { useState, useCallback } from 'react'
import { MiniKit, ResponseEvent, type MiniAppShareContactsPayload } from '@worldcoin/minikit-js'
import type { WorldContact } from '@/lib/types'

export function useWorldContacts() {
  const [contacts, setContacts] = useState<WorldContact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestContacts = useCallback(async (multiSelect: boolean = false) => {
    if (!MiniKit.isInstalled()) {
      setError('Not in World App')
      return []
    }

    try {
      setIsLoading(true)
      setError(null)

      // Request contacts from World App
      const { finalPayload } = await MiniKit.commandsAsync.shareContacts({
        isMultiSelectEnabled: multiSelect,
      })

      if (finalPayload.status === 'success') {
        // The payload contains the contacts data
        const payload = finalPayload as any

        // Send to backend to match with database users
        const response = await fetch('/api/world/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contacts: payload.contacts || payload.data || []
          })
        })

        if (response.ok) {
          const data = await response.json()
          setContacts(data.contacts || [])
          return data.contacts || []
        }
      }

      return []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get contacts'
      setError(errorMessage)
      console.error('World contacts error:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    contacts,
    isLoading,
    error,
    requestContacts
  }
}
