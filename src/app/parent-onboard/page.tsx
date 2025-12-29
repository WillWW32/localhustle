'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

function ParentOnboardContent() {
  const [kidName, setKidName] = useState('your kid')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const kidId = searchParams.get('kid_id')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const fetchKid = async () => {
      if (!kidId) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', kidId)
        .single()

      if (data?.full_name) {
        setKidName(data.full_name.split(' ')[0])
      }
      setLoading(false)
    }

    fetchKid()
  }, [kidId])

  const sendMagicLink = async () => {
  if (!kidId) return

  const { error } = await supabase.auth.signInWithOtp({
    email: '',
    options: {
      emailRedirectTo: `https://app.localhustle.org/parent-dashboard?kid_id=${kidId}`,
      data: { role: 'parent' },
    },
  })

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert(`Magic link sent! Check your email to sponsor ${kidName}.`)
  }
}

  if (loading) return <p className="text-center py-32 text-2xl">Loading...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-20 px-6 text-center">
      <h1 className="text-4xl sm:text-6xl font-bold mb-12">
        Hey Parent of {kidName}!
      </h1>

      <p className="text-xl sm:text-3xl mb-16 max-w-4xl mx-auto">
        {kidName} wants you to be their first sponsor on LocalHustle.<br />
        It's easy — fund a challenge, they complete it, they earn real money instantly.
      </p>

      <div className="bg-green-100 p-12 border-4 border-green-600 mb-16 max-w-3xl mx-auto">
        <p className="text-2xl mb-8">
          You'll fund a simple challenge (like "80/100 free throws").<br />
          When {kidName} completes it → you approve → they get paid instantly.
        </p>
        <p className="text-xl">
          No obligation after — just help them get started.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-8">
  <Input
    type="email"
    placeholder="your@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="h-20 text-2xl text-center border-4 border-black"
  />

  <Button
    onClick={sendMagicLink}
    disabled={loading || !email.trim()}
    className="w-full h-20 text-2xl bg-green-600 text-white font-bold"
  >
    {loading ? 'Sending...' : `Yes — Sponsor ${kidName} Now`}
  </Button>
</div>

      <p className="text-lg mt-12 text-gray-600">
        You'll get a magic link — click it to set up your parent dashboard.
      </p>
    </div>
  )
}

export default function ParentOnboard() {
  return (
    <Suspense fallback={<p className="text-center py-32 text-2xl">Loading...</p>}>
      <ParentOnboardContent />
    </Suspense>
  )
}