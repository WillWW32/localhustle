'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Home() {
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) alert(error.message)
    else alert('Check your email for the login link.')
    setLoading(false)
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!profile?.role) {
          router.push('/select-role')
        } else {
          router.push('/dashboard')
        }
      }
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!profile?.role) {
          router.push('/select-role')
        } else {
          router.push('/dashboard')
        }
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  return (
    <div className="container">
      <h1 className="text-center text-5xl mb-12">LocalHustle</h1>
      <p className="text-center mb-12 text-xl">Community Driven Support for Student Athletes</p>

      {user ? (
        <div className="max-w-md mx-auto space-y-8 text-center">
          <p className="text-lg">Logged in as {user.email}</p>
          <p className="text-sm">Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-lg">Your Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-lg"
            />
          </div>

          <Button onClick={handleLogin} disabled={loading} className="w-full text-lg py-6">
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </div>
      )}
    </div>
  )
}