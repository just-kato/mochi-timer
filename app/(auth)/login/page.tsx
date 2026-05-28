'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic-link' | 'password'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/timer')
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-cream dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <div className="flex items-end gap-4 mb-6">
            <Image
              src="/mr.mochi logo black.png"
              alt="Mochi Timer"
              width={64}
              height={64}
              className="object-contain shrink-0 dark:invert"
            />
            <h1 className="text-4xl font-bold uppercase tracking-tight leading-none dark:text-white">
              CHECK<br />YOUR EMAIL
            </h1>
          </div>
          <div className="border-[3px] border-black dark:border-zinc-600 p-5 shadow-brutal mb-6 dark:bg-zinc-900">
            <p className="text-sm font-bold dark:text-white">
              We sent a login link to <span className="underline">{email}</span>.
              Click it to sign in.
            </p>
          </div>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="text-xs font-bold uppercase tracking-widest underline text-zinc-500 min-h-0 min-w-0"
          >
            USE A DIFFERENT EMAIL
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="flex items-end gap-4 mb-1">
          <Image
            src="/mr.mochi logo black.png"
            alt="Mochi Timer"
            width={80}
            height={80}
            className="object-contain shrink-0 dark:invert"
          />
          <h1 className="text-5xl font-bold uppercase tracking-tight leading-none dark:text-white">
            MOCHI<br />TIMER
          </h1>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-8 mt-1">
          SIGN IN TO YOUR ACCOUNT
        </p>

        <div className="flex border-[3px] border-black dark:border-zinc-600 mb-6">
          <button
            onClick={() => { setMode('password'); setError(null) }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest min-h-11 border-r-[3px] border-black dark:border-zinc-600 ${
              mode === 'password'
                ? 'bg-black text-white'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-brutalist-yellow dark:hover:bg-brutalist-yellow dark:hover:text-black'
            }`}
          >
            PASSWORD
          </button>
          <button
            onClick={() => { setMode('magic-link'); setError(null) }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest min-h-11 ${
              mode === 'magic-link'
                ? 'bg-black text-white'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-brutalist-yellow dark:hover:bg-brutalist-yellow dark:hover:text-black'
            }`}
          >
            MAGIC LINK
          </button>
        </div>

        <form onSubmit={mode === 'password' ? handlePassword : handleMagicLink}>
          <div className="mb-4">
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

          {mode === 'password' && (
            <div className="mb-5">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-[3px] border-black dark:border-zinc-600 px-3 py-3 text-sm focus:outline-none focus:bg-brutalist-yellow focus:text-black"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="mb-5 border-[3px] border-black dark:border-zinc-600 bg-brutalist-red px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brutalist-yellow text-black py-4 text-sm font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal"
          >
            {loading
              ? '▋▋▋'
              : mode === 'password'
              ? 'SIGN IN'
              : 'SEND MAGIC LINK'}
          </button>
        </form>

        <p className="text-xs font-bold uppercase tracking-widest text-center mt-8 text-zinc-400 dark:text-zinc-500">
          ACCESS BY INVITATION ONLY
        </p>
      </div>
    </div>
  )
}
