import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/db/users'
import { UserList } from '@/components/admin/UserList'
import { InviteForm } from '@/components/admin/InviteForm'
import type { PendingInvite } from '@/lib/types/admin'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const [users, { data: authData }] = await Promise.all([
    getAllUsers(),
    // perPage=1000 avoids the default 50-user pagination cutoff
    serviceClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const allAuthUsers = authData?.users ?? []
  // Anyone in auth but NOT yet in the User table hasn't finished onboarding.
  // We use User table membership as the source of truth — not email_confirmed_at,
  // because Supabase may set that flag immediately on invite in some project configs.
  const userTableIds = new Set(users.map((u) => u.id))
  const notInUserTable = allAuthUsers.filter((u) => !userTableIds.has(u.id))

  // Split: confirmed (auto-create User row) vs unconfirmed (show as pending)
  const needsUserRow = notInUserTable.filter((u) => u.email_confirmed_at)
  const pendingInvites: PendingInvite[] = notInUserTable
    .filter((u) => !u.email_confirmed_at)
    .map((u) => ({ id: u.id, email: u.email ?? '', invitedAt: u.invited_at ?? u.created_at! }))

  if (needsUserRow.length > 0) {
    const now = new Date().toISOString()
    await serviceClient.from('User').upsert(
      needsUserRow.map((u) => ({
        id: u.id,
        email: u.email ?? '',
        role: (u.user_metadata?.role as string) ?? 'user',
        hourlyRate: 0,
        payPeriodStart: 1,
        emailSummary: true,
        timezone: 'America/New_York',
        inviteCount: 0,
        createdAt: now,
        updatedAt: now,
      })),
      { onConflict: 'id', ignoreDuplicates: true }
    )
    // Re-fetch so the list is complete
    const { data: refreshed } = await serviceClient.from('User').select().order('createdAt', { ascending: true })
    if (refreshed) users.splice(0, users.length, ...refreshed.map((r) => ({
      id: r.id, email: r.email, role: r.role, hourlyRate: r.hourlyRate,
      payPeriodStart: r.payPeriodStart, emailSummary: r.emailSummary,
      timezone: r.timezone, inviteCount: r.inviteCount,
      inviteWindowStart: r.inviteWindowStart ? new Date(r.inviteWindowStart) : null,
      createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt),
    })))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold uppercase tracking-widest mb-8">ADMIN</h1>

      <section className="mb-10">
        <InviteForm />
      </section>

      <div className="border-t-[3px] border-black pt-8">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
          USERS ({users.length})
        </h2>
        <UserList users={users} pendingInvites={pendingInvites} currentUserId={user.id} />
      </div>
    </div>
  )
}
