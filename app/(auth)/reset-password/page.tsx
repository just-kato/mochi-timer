'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [])

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
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image src="/mr.mochi logo black.png" alt="Mochi Timer" width={100} height={100} className="object-contain dark:invert" />
          <div className="text-center">
            <h1 className="text-4xl font-bold uppercase tracking-tight leading-none dark:text-white">
              MOCHI<br />TIMER
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-2">
              CHOOSE A NEW PASSWORD
            </p>
          </div>
        </div>

        <div className="border-[3px] border-black dark:border-zinc-700 shadow-brutal">
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {email && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 dark:text-zinc-400">
                  Account
                </p>
                <p className="text-sm font-bold dark:text-zinc-100 truncate">{email}</p>
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
                New Password
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
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
