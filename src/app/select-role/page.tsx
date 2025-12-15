'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function SelectRole() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRole = async (role: 'athlete' | 'business') => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id)
      if (error) {
        alert(error.message)
      } else {
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div className="container">
      <h1 className="text-center text-5xl mb-12">Choose Your Role</h1>
      <p className="text-center mb-12 text-xl">Are you here as an athlete or a local business?</p>

      <div className="max-w-md mx-auto space-y-8">
        <Button onClick={() => handleRole('athlete')} disabled={loading} className="w-full text-lg py-6">
          Student Athlete
        </Button>
        <Button onClick={() => handleRole('business')} disabled={loading} className="w-full text-lg py-6">
          Local Business
        </Button>
      </div>
    </div>
  )
}