'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@prisma/client'

interface UseSessionsResult {
  sessions: Session[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSessions(date: string): UseSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions?date=${date}`)
      if (!res.ok) throw new Error('Failed to load sessions')
      const data = await res.json() as { sessions: Session[] }
      setSessions(data.sessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetch_() }, [fetch_])

  return { sessions, loading, error, refetch: fetch_ }
}
