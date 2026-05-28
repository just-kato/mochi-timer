import { createClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/db/users'
import { UserList } from '@/components/admin/UserList'
import { InviteForm } from '@/components/admin/InviteForm'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const users = await getAllUsers()

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
        <UserList users={users} currentUserId={user.id} />
      </div>
    </div>
  )
}
