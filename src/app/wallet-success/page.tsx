import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default async function WalletSuccess({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id

  if (sessionId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ role: 'business' })
        .eq('id', user.id)

      await supabase
        .from('businesses')
        .upsert({
          owner_id: user.id,
          name: 'My Local Business',
          wallet_balance: 100.00,
        })
    }
  }

  redirect('/dashboard')

  return null
}