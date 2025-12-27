'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const next = searchParams.get('next') || '/dashboard'
        router.replace(next)
      } else {
        // Not logged in yet — wait a moment
        setTimeout(handleRedirect, 500)
      }
    }

    handleRedirect()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-xl">Logging you in...</p>
    </div>
  )
}