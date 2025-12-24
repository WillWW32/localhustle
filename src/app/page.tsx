'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Home() {
  const [role, setRole] = useState<'athlete' | 'business' | null>(null)
  const [level, setLevel] = useState<'high_school' | 'college' | null>(null)
  const [email, setEmail] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!role || (role === 'athlete' && !level)) {
      alert('Please select your role and level')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { 
        data: { 
          role,
          level: role === 'athlete' ? level : null 
        } 
      }
    })

    if (error) alert(error.message)
    else {
      alert(`
🎉 Magic link sent!

Check your email — click the link to log in.

You'll go straight to your dashboard.

No passwords, just hustle.

See you inside! 🚀
      `.trim())
    }
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
  }, [router])

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-6xl font-bold text-center mb-12">
        LocalHustle
      </h1>

      {/* Subtitle */}
      <p className="text-xl sm:text-2xl text-center mb-16 max-w-3xl mx-auto">
        Earn from local business sponsorships — no agents, no pay-for-play, fully NIL compliant.
      </p>

      {/* Role Selection */}
      {!role && (
        <div className="max-w-2xl mx-auto mb-16">
          <p className="text-xl sm:text-2xl text-center mb-8">
            Who are you?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Button 
              onClick={() => setRole('athlete')}
              className="h-32 text-2xl sm:text-3xl bg-black text-white hover:bg-gray-800"
            >
              Student Athlete
            </Button>
            <Button 
              onClick={() => setRole('business')}
              className="h-32 text-2xl sm:text-3xl bg-black text-white hover:bg-gray-800"
            >
              Local Business
            </Button>
          </div>
        </div>
      )}

      {/* Athlete Level Selection */}
      {role === 'athlete' && !level && (
        <div className="max-w-2xl mx-auto mb-16">
          <p className="text-xl sm:text-2xl text-center mb-8">
            High School or College?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Button 
              onClick={() => setLevel('high_school')}
              className="h-32 text-2xl sm:text-3xl bg-black text-white hover:bg-gray-800"
            >
              High School
            </Button>
            <Button 
              onClick={() => setLevel('college')}
              className="h-32 text-2xl sm:text-3xl bg-black text-white hover:bg-gray-800"
            >
              College
            </Button>
          </div>
          <Button 
            onClick={() => setRole(null)}
            variant="outline"
            className="mt-8 h-14 text-lg border-4 border-black"
          >
            Back
          </Button>
        </div>
      )}

      {/* Email Entry */}
      {role && (role === 'business' || level) && (
        <div className="max-w-lg mx-auto">
          <Label htmlFor="email" className="text-xl sm:text-2xl block mb-4 text-center">
            Your Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-16 text-2xl text-center border-4 border-black mb-8"
          />
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-20 text-2xl sm:text-3xl bg-black text-white"
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
          <Button 
            onClick={() => {
              setRole(null)
              setLevel(null)
            }}
            variant="outline"
            className="mt-8 w-full h-14 text-lg border-4 border-black"
          >
            Back
          </Button>
        </div>
      )}

      {/* Logged in state */}
      {user && (
        <div className="max-w-lg mx-auto my-16">
          <p className="text-xl sm:text-2xl text-center mb-8">Logged in as {user.email}</p>
          <Button onClick={signOut} className="w-full h-16 text-2xl bg-black text-white">
            Log Out
          </Button>
        </div>
      )}
    </div>
  )
}