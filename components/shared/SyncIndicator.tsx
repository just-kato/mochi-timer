'use client'

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { useSyncOnReconnect } from '@/lib/hooks/useSyncOnReconnect'
import { useEffect, useState } from 'react'

export function SyncIndicator() {
  useSyncOnReconnect()
  const online = useOnlineStatus()
  const [justCameOnline, setJustCameOnline] = useState(false)

  useEffect(() => {
    if (online) {
      setJustCameOnline(true)
      const t = setTimeout(() => setJustCameOnline(false), 3000)
      return () => clearTimeout(t)
    }
  }, [online])

  if (!justCameOnline) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brutalist-yellow border-t-[3px] border-black px-4 py-3 text-center">
      <span className="text-xs font-bold uppercase tracking-widest text-black">
        BACK ONLINE — SYNCING YOUR DATA…
      </span>
    </div>
  )
}
