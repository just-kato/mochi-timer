'use client'

import { useEffect, useRef, useState } from 'react'

export interface ToastOptions {
  message: string
  type?: 'error' | 'info'
  duration?: number
}

interface ToastState extends ToastOptions {
  id: number
  visible: boolean
}

let counter = 0
const listeners = new Set<(t: ToastState) => void>()

export function toast(options: ToastOptions) {
  const t: ToastState = { ...options, id: ++counter, visible: true }
  listeners.forEach((fn) => fn(t))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    function handle(t: ToastState) {
      setToasts((prev) => [...prev.slice(-2), t])
      const ms = t.duration ?? 3500
      const id = setTimeout(() => {
        setToasts((prev) => prev.map((p) => p.id === t.id ? { ...p, visible: false } : p))
        setTimeout(() => setToasts((prev) => prev.filter((p) => p.id !== t.id)), 300)
      }, ms)
      timers.current.set(t.id, id)
    }
    listeners.add(handle)
    return () => {
      listeners.delete(handle)
      timers.current.forEach(clearTimeout)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 border-[3px] px-4 py-3 shadow-brutal text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
            t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          } ${
            t.type === 'error'
              ? 'border-brutalist-red bg-brutalist-red text-white'
              : 'border-black bg-black text-brutalist-yellow'
          }`}
        >
          {t.type === 'error' && <span aria-hidden="true">!</span>}
          {t.message}
        </div>
      ))}
    </div>
  )
}
