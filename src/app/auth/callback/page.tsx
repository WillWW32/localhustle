import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function AuthCallback({ searchParams }: { searchParams: { next?: string } }) {
  const supabase = getSupabaseServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  const next = searchParams.next || '/dashboard'

  if (session) {
    redirect(next)
  }

  redirect('/')
}