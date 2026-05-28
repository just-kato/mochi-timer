'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InviteAcceptPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw new Error(updateError.message)
      router.push('/timer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tighter">Welcome</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-2">
            Set a password to finish signing in
          </p>
        </div>

        <div className="border-[3px] border-black dark:border-zinc-700 shadow-brutal">
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
                Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow focus:text-black dark:bg-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className="w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow focus:text-black dark:bg-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            {error && (
              <div className="border-[3px] border-black bg-red-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-brutalist-yellow text-black disabled:opacity-50"
            >
              {loading ? 'Setting password…' : 'Set password & sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
