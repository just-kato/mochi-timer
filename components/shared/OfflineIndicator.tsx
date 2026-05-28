'use client'

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'

export function OfflineIndicator() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div className="w-full bg-brutalist-red border-b-[3px] border-black px-4 py-3 text-center">
      <span className="text-xs font-bold uppercase tracking-widest text-black">
        OFFLINE — SESSIONS SAVING LOCALLY
      </span>
    </div>
  )
}
