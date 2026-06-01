'use client'

import { useState } from 'react'
import type { User } from '@prisma/client'
import type { PendingInvite } from '@/lib/types/admin'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface UserListProps {
  users: User[]
  pendingInvites?: PendingInvite[]
  currentUserId: string
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black px-4 py-2 border-b-[3px] border-black">
      <p className="text-xs font-bold uppercase tracking-widest text-white">{children}</p>
    </div>
  )
}

export function UserList({ users, pendingInvites = [], currentUserId }: UserListProps) {
  const [revoking, setRevoking] = useState<string | null>(null)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [roles, setRoles] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.role]))
  )

  async function handleRevoke(id: string, email: string) {
    if (!confirm(`Revoke access for ${email}? This cannot be undone.`)) return
    setRevoking(id)
    setError(null)
    const res = await fetch(`/api/admin/revoke/${id}`, { method: 'POST' })
    setRevoking(null)
    if (res.ok) {
      setRemovedIds((prev) => new Set([...prev, id]))
    } else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Failed to revoke access')
    }
  }

  async function handleRoleChange(id: string, newRole: 'admin' | 'user') {
    setChangingRole(id)
    setError(null)
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setChangingRole(null)
    if (res.ok) {
      setRoles((prev) => ({ ...prev, [id]: newRole }))
    } else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Failed to change role')
    }
  }

  const visiblePending = pendingInvites.filter((p) => !removedIds.has(p.id))
  const visibleUsers = users.filter((u) => !removedIds.has(u.id))

  return (
    <div>
      {error && (
        <div className="border-b-[3px] border-black bg-brutalist-red px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
        </div>
      )}

      {visiblePending.length > 0 && (
        <div>
          <SectionLabel>Pending Invites ({visiblePending.length})</SectionLabel>
          {visiblePending.map((invite, i) => (
            <div
              key={invite.id}
              className={`py-4 px-4 flex items-center justify-between gap-4 ${
                i < visiblePending.length - 1 ? 'border-b-[3px] border-black' : ''
              }`}
            >
              <div>
                <p className="text-sm font-bold">{invite.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold uppercase tracking-widest bg-brutalist-yellow text-black px-2 py-0.5">
                    PENDING
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Invited {new Date(invite.invitedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRevoke(invite.id, invite.email)}
                disabled={revoking === invite.id}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-brutalist-red text-black btn-brutal shadow-brutal-sm shrink-0"
              >
                {revoking === invite.id ? <LoadingSpinner size="sm" /> : 'CANCEL INVITE'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <SectionLabel>Active Users ({visibleUsers.length})</SectionLabel>
        {visibleUsers.map((u, i) => {
          const currentRole = roles[u.id] ?? u.role
          const isSelf = u.id === currentUserId
          return (
            <div
              key={u.id}
              className={`py-4 px-4 flex items-center justify-between gap-4 ${
                i < visibleUsers.length - 1 ? 'border-b-[3px] border-black' : ''
              }`}
            >
              <div>
                <p className="text-sm font-bold">{u.email}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1">
                  {currentRole} · {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>

              {!isSelf && (
                <div className="flex items-center gap-2 shrink-0">
                  {/* Role toggle */}
                  <button
                    onClick={() => handleRoleChange(u.id, currentRole === 'admin' ? 'user' : 'admin')}
                    disabled={changingRole === u.id}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-white text-black btn-brutal shadow-brutal-sm"
                    title={currentRole === 'admin' ? 'Demote to user' : 'Promote to admin'}
                  >
                    {changingRole === u.id
                      ? <LoadingSpinner size="sm" />
                      : currentRole === 'admin' ? 'MAKE USER' : 'MAKE ADMIN'}
                  </button>

                  <button
                    onClick={() => handleRevoke(u.id, u.email)}
                    disabled={revoking === u.id}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-brutalist-red text-black btn-brutal shadow-brutal-sm"
                  >
                    {revoking === u.id ? <LoadingSpinner size="sm" /> : 'REVOKE'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {visibleUsers.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">No active users</p>
          </div>
        )}
      </div>
    </div>
  )
}
