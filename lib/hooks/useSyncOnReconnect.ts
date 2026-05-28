'use client'

import { useEffect, useRef } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { syncPendingSessions } from '@/lib/indexeddb/sync'
import { logger } from '@/lib/utils/logger'

export function useSyncOnReconnect(): void {
  const online = useOnlineStatus()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
      return
    }
    if (wasOffline.current) {
      wasOffline.current = false
      syncPendingSessions().catch((err) =>
        logger.error('Reconnect sync failed', { error: String(err) })
      )
    }
  }, [online])
}
