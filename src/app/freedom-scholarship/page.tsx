'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function FreedomScholarship() {
  const [business, setBusiness] = useState<any>(null)
  const [athleteSearch, setAthleteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (biz) {
        setBusiness(biz)
      }
    }

    fetchBusiness()
  }, [router])

  const searchAthletes = async () => {
    if (!athleteSearch.trim()) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, school')
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

  if (!business) return <p className="text-center py-32 text-2xl">Loading...</p>

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
            className="text-center"
          />

          <Button onClick={searchAthletes} className="w-full h-16 text-xl bg-black text-white">
            Search Athletes
          </Button>

          {searchResults.length > 0 && (
            <div className="space-y-6">
              {searchResults.map((athlete) => (
                <div key={athlete.id} className="border-4 border-black p-8 bg-gray-100">
                  <p className="text-xl">
                    {athlete.full_name || athlete.email} — {athlete.school}
                  </p>
                  <Button 
                    onClick={() => setSelectedAthlete(athlete)}
                    className="mt-6 w-full h-16 text-xl bg-green-600 text-white"
                  >
                    Select This Athlete
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedAthlete && (
            <div className="bg-green-100 p-12 border-4 border-green-600">
              <p className="text-2xl mb-8 text-center">
                Selected: {selectedAthlete.full_name || selectedAthlete.email} ({selectedAthlete.school})
              </p>

              <Input 
                placeholder="Scholarship amount (e.g., 500)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mb-8"
              />

              <textarea 
                placeholder="Optional message (e.g., Great season — use for books!)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-6 text-lg border-4 border-black font-mono mb-8"
                rows={6}
              />

              <Button 
                onClick={awardScholarship}
                disabled={loading}
                className="w-full h-20 text-2xl bg-green-600 text-white font-bold"
              >
                {loading ? 'Awarding...' : 'Award Freedom Scholarship Instantly'}
              </Button>
            </div>
          )}
        </div>

        <div className="text-center mt-32">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full max-w-md h-20 text-2xl bg-black text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}