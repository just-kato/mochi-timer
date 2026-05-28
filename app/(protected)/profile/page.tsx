import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserById, getAllUsers } from '@/lib/db/users'
import type { PendingInvite } from '@/lib/types/admin'
import { ProfileTabs } from '@/components/profile/ProfileTabs'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await getUserById(user.id)
  const role = (user.user_metadata?.role as string | undefined) ?? 'user'
  const isAdmin = role === 'admin'

  let users: Awaited<ReturnType<typeof getAllUsers>> = []
  let pendingInvites: PendingInvite[] = []

  if (isAdmin) {
    const serviceClient = createServiceClient()
    const [allUsers, { data: authData }] = await Promise.all([
      getAllUsers(),
      serviceClient.auth.admin.listUsers(),
    ])
    users = allUsers
    pendingInvites = (authData?.users ?? [])
      .filter((u) => u.invited_at && !u.email_confirmed_at)
      .map((u) => ({
        id: u.id,
        email: u.email ?? '',
        invitedAt: u.invited_at!,
      }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <ProfileTabs
        email={user.email ?? ''}
        role={role}
        isAdmin={isAdmin}
        currentUserId={user.id}
        initialHourlyRate={dbUser?.hourlyRate ?? 0}
        initialPayPeriodStart={dbUser?.payPeriodStart ?? 1}
        initialEmailSummary={dbUser?.emailSummary ?? true}
        initialTimezone={dbUser?.timezone ?? 'America/New_York'}
        users={users}
        pendingInvites={pendingInvites}
      />
    </div>
  )
}
