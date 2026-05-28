'use client'

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { useEffect, useState } from 'react'

export function SyncIndicator() {
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
    <div className="w-full bg-brutalist-yellow border-b-[3px] border-black px-4 py-3 text-center">
      <span className="text-xs font-bold uppercase tracking-widest text-black">
        BACK ONLINE — SYNCING YOUR DATA…
      </span>
    </div>
  )
}
