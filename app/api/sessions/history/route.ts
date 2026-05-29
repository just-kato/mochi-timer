import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionHistory } from '@/lib/db/sessions'

const PAGE_SIZE = 20

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)

  const { sessions, total } = await getSessionHistory(user.id, page, PAGE_SIZE)
  return NextResponse.json({ sessions, total, page, pageSize: PAGE_SIZE })
}
