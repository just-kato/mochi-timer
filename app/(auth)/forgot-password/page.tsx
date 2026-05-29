'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Something went wrong')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-cream dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-3 mb-8">
            <Image src="/mr.mochi logo black.png" alt="Mochi Timer" width={100} height={100} className="object-contain dark:invert" />
            <h1 className="text-4xl font-bold uppercase tracking-tight leading-none text-center dark:text-white">
              CHECK<br />YOUR EMAIL
            </h1>
          </div>
          <div className="border-[3px] border-black dark:border-zinc-600 p-5 shadow-brutal mb-6 dark:bg-zinc-900">
            <p className="text-sm font-bold dark:text-white">
              If <span className="underline">{email}</span> is registered, a reset link is on its way.
            </p>
          </div>
          <Link href="/login" className="text-xs font-bold uppercase tracking-widest underline text-zinc-500 min-h-0 min-w-0">
            BACK TO SIGN IN
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-1">
          <Image src="/mr.mochi logo black.png" alt="Mochi Timer" width={100} height={100} className="object-contain dark:invert" />
          <h1 className="text-5xl font-bold uppercase tracking-tight leading-none text-center dark:text-white">
            MOCHI<br />TIMER
          </h1>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-8 mt-1 text-center">
          RESET YOUR PASSWORD
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-[3px] border-black dark:border-zinc-600 px-3 py-3 text-sm focus:outline-none focus:bg-brutalist-yellow focus:text-black"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <div className="mb-5 border-[3px] border-black dark:border-zinc-600 bg-brutalist-red px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brutalist-yellow text-black py-4 text-sm font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal mb-5"
          >
            {loading ? '▋▋▋' : 'SEND RESET LINK'}
          </button>
        </form>

        <Link href="/login" className="text-xs font-bold uppercase tracking-widest underline text-zinc-500 min-h-0 min-w-0">
          BACK TO SIGN IN
        </Link>
      </div>
    </div>
  )
}
