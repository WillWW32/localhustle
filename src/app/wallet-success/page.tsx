'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function WalletSuccess() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const router = useRouter()

  useEffect(() => {
    if (sessionId) {
      const createBusiness = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Set role to business
          await supabase
            .from('profiles')
            .update({ role: 'business' })
            .eq('id', user.id)

          // Create or update business record with $100 balance
          await supabase
            .from('businesses')
            .upsert({
              owner_id: user.id,
              name: 'My Local Business',
              wallet_balance: 100.00,
            })

          // Auto-post first welcome offer (stub — real in next task)
          router.push('/dashboard')
        }
      }
      createBusiness()
    }
  }, [sessionId, router])

  return (
    <div className="container text-center">
      <h1 className="text-5xl mb-12">Wallet Funded!</h1>
      <p className="text-xl mb-12">You added $100 — now post your first offer.</p>
      <p className="text-lg">Redirecting to dashboard...</p>
    </div>
  )
}