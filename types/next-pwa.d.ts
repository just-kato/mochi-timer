declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  interface RuntimeCachingEntry {
    urlPattern: RegExp | string
    handler: 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate'
    options?: {
      cacheName?: string
      expiration?: { maxEntries?: number; maxAgeSeconds?: number }
    }
  }

  interface PWAConfig {
    dest: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    runtimeCaching?: RuntimeCachingEntry[]
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export = withPWA
}
