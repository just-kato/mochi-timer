'use client'

import { useState } from 'react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function InviteForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSent(null)

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)
    if (res.ok) {
      setSent(email)
      setEmail('')
    } else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Failed to send invite')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="invite-email" className="block text-xs font-bold uppercase tracking-widest mb-2">
            INVITE BY EMAIL
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contractor@example.com"
            className="w-full border-[3px] border-black px-3 py-3 text-sm focus:outline-none focus:bg-brutalist-yellow"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal-sm"
        >
          {loading && <LoadingSpinner size="sm" />}
          SEND INVITE
        </button>
      </form>

      {sent && (
        <div className="mt-3 border-[3px] border-black bg-brutalist-green px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-black">INVITE SENT TO {sent}</p>
        </div>
      )}
      {error && (
        <div className="mt-3 border-[3px] border-black bg-brutalist-red px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
        </div>
      )}
    </div>
  )
}
