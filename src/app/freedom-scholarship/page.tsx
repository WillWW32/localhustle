'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function FreedomScholarship() {
  const [role, setRole] = useState<'parent' | 'business' | 'loading'>('loading')
  const [business, setBusiness] = useState<any>(null)
  const [parent, setParent] = useState<any>(null)
  const [athleteSearch, setAthleteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
  const determineRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/')
      return
    }

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (biz) {
      setBusiness(biz)
      setRole('business')
      return
    }

    const { data: par } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (par) {
      setParent(par)
      setRole('parent')
      return
    }

    router.replace('/')
  }

  determineRole()
}, [router])  

  const searchAthletes = async () => {
    if (!athleteSearch.trim()) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, school, profile_pic')
      .or(`full_name.ilike.%${athleteSearch}%,email.ilike.%${athleteSearch}%,school.ilike.%${athleteSearch}%`)
      .limit(10)

    setSearchResults(data || [])
  }

  const awardScholarship = async () => {
    if (!selectedAthlete || !amount || parseFloat(amount) <= 0) {
      alert('Select an athlete and enter a valid amount')
      return
    }

    setLoading(true)

    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athlete_id: selectedAthlete.id,
        amount: parseFloat(amount),
        type: 'freedom_scholarship',
        message: message || 'Great hustle!',
        business_id: business.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      await supabase
        .from('scholarships')
        .insert({
          business_id: business.id,
          athlete_id: selectedAthlete.id,
          amount: parseFloat(amount),
          message: message || 'Great hustle!',
        })

      alert(`$${amount} Freedom Scholarship awarded to ${selectedAthlete.full_name || selectedAthlete.email}!`)
      setAmount('')
      setMessage('')
      setSelectedAthlete(null)
      setSearchResults([])
      setAthleteSearch('')
    }

    setLoading(false)
  }

  // Loading state
  if (role === 'loading') {
    return <p className="text-center py-32 text-2xl font-mono">Loading...</p>
  }

  // Parent View — Motivational Explanation
  if (role === 'parent') {
    return (
      <div className="min-h-screen bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold font-mono mb-12">
            Freedom Scholarship
          </h1>

          <div className="bg-green-100 p-12 border-4 border-green-600 mb-16">
            <p className="text-3xl font-bold font-mono mb-6">
              Your Kid Earns Real College Money
            </p>
            <p className="text-2xl font-mono leading-relaxed">
              At <strong>4 completed gigs</strong>, they unlock an unrestricted cash scholarship.<br />
              No essays. No applications. Just hustle.
            </p>
          </div>

          <div className="bg-black text-white p-12 mb-16">
            <p className="text-2xl font-mono leading-relaxed max-w-3xl mx-auto">
              This is <span className="underline">freedom</span>.<br /><br />
              Money they earn through real work with local businesses.<br />
              Paid instantly. Used for tuition, books, dorm — whatever they need.
            </p>
          </div>

          <div className="bg-yellow-100 p-12 border-4 border-yellow-600">
            <p className="text-3xl font-bold font-mono">
              Every Gig Counts
            </p>
            <p className="text-xl font-mono mt-6">
              Their progress is already tracking on the dashboard.<br />
              Keep funding challenges — get them to 4.
            </p>
          </div>

          <div className="mt-20">
            <Button
              onClick={() => router.push('/parent-dashboard')}
              className="h-20 px-12 text-3xl bg-black text-white font-bold font-mono"
            >
              Back to Parent Console
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Business View — Award Form (your original, slightly polished)
  if (role === 'business') {
    return (
      <div className="min-h-screen bg-white text-black font-mono py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold text-center mb-16">
            Award a Freedom Scholarship
          </h1>

          <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
            Give unrestricted cash to any athlete — paid instantly.<br />
            Real impact. Real hero status.
          </p>

          <div className="space-y-12">
            <Input 
              placeholder="Search athlete by name, email, or school"
              value={athleteSearch}
              onChange={(e) => setAthleteSearch(e.target.value)}
              className="text-center text-lg font-mono"
            />

            <Button onClick={searchAthletes} className="w-full h-16 text-xl bg-black text-white font-mono">
              Search Athletes
            </Button>

            {searchResults.length > 0 && (
              <div className="space-y-6">
                {searchResults.map((athlete) => (
                  <div key={athlete.id} className="border-4 border-black p-8 bg-gray-100">
                    <div className="flex items-center gap-6">
                      {athlete.profile_pic && (
                        <img src={athlete.profile_pic} alt={athlete.full_name} className="w-20 h-20 rounded-full border-4 border-black object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="text-2xl font-bold">
                          {athlete.full_name || athlete.email}
                        </p>
                        <p className="text-xl">{athlete.school}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setSelectedAthlete(athlete)}
                      className="mt-8 w-full h-16 text-xl bg-green-600 text-white font-mono"
                    >
                      Select This Athlete
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {selectedAthlete && (
              <div className="bg-green-100 p-12 border-4 border-green-600">
                <p className="text-2xl mb-8 text-center font-mono">
                  Selected: {selectedAthlete.full_name || selectedAthlete.email} ({selectedAthlete.school})
                </p>

                <Input 
                  placeholder="Scholarship amount (e.g., 500)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mb-8 text-lg font-mono"
                />

                <textarea 
                  placeholder="Optional message (e.g., Great season — use for books!)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-6 text-lg border-4 border-black font-mono mb-8 bg-white"
                  rows={6}
                />

                <Button 
                  onClick={awardScholarship}
                  disabled={loading}
                  className="w-full h-20 text-2xl bg-green-600 text-white font-bold font-mono"
                >
                  {loading ? 'Awarding...' : 'Award Freedom Scholarship Instantly'}
                </Button>
              </div>
            )}
          </div>

          <div className="text-center mt-32">
            <Button 
              onClick={() => router.push('/business-dashboard')}
              className="w-full max-w-md h-20 text-2xl bg-black text-white font-mono"
            >
              Back to Business Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}