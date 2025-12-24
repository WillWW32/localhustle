'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function BrandDeals() {
  const [profile, setProfile] = useState<any>(null)
  const [completedGigs, setCompletedGigs] = useState(0)
  const [qualified, setQualified] = useState(false)
  const [stats, setStats] = useState('')
  const [highlightLink, setHighlightLink] = useState('')
  const [socialHandles, setSocialHandles] = useState('')
  const [pitchMessage, setPitchMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      // Placeholder — replace with real completed gigs count in V2
      setCompletedGigs(4)
      setQualified(true)

      setHighlightLink(prof.highlight_link || '')
    }

    fetchData()
  }, [router])

  const handleApply = async () => {
    if (!qualified) {
      alert('Complete 4 local gigs to qualify!')
      return
    }

    const subject = encodeURIComponent('Brand Deal Application — LocalHustle Athlete')
    const body = encodeURIComponent(
      `Hi Brand Team,\n\nI'd love to partner with you on a brand deal through LocalHustle.\n\nName: ${profile?.full_name || profile?.email}\nSchool: ${profile?.school}\nSport: ${profile?.sport}\nHighlight Reel: ${highlightLink}\nStats: ${stats}\nSocial Handles: ${socialHandles}\n\nPitch:\n${pitchMessage}\n\nThanks!\n${profile?.email}`
    )

    window.location.href = `mailto:brands@localhustle.org?subject=${subject}&body=${body}`
    alert('Application opened — send the email to apply!')
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  const progress = Math.min(completedGigs / 4 * 100, 100)

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Hero */}
      <h1 className="text-3xl sm:text-5xl font-bold text-center mb-8">
        Land National Brand Deals
      </h1>
      <p className="text-lg sm:text-2xl text-center mb-16 max-w-4xl mx-auto leading-relaxed px-4">
        Complete 4 local gigs → qualify for paid partnerships with top brands like Nike, Gatorade, Under Armour, and more.
      </p>

      {/* Qualification Status */}
      <div className="max-w-2xl mx-auto mb-16 p-8 border-4 border-black bg-gray-50">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
          Your Qualification Status
        </h2>
        <p className="text-xl sm:text-2xl text-center mb-8">
          Completed local gigs: {completedGigs} / 4
        </p>

        {/* Progress Bar */}
        <div className="relative h-16 bg-gray-300 border-4 border-black mb-8">
          <div 
            className="absolute top-0 left-0 h-full bg-green-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
            {qualified ? 'Qualified!' : `${4 - completedGigs} gigs to go`}
          </p>
        </div>

        {!qualified && (
          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full h-20 text-2xl bg-black text-white"
          >
            Back to Dashboard — Complete More Gigs
          </Button>
        )}
      </div>

      {/* Application Form — only if qualified */}
      {qualified && (
        <div className="max-w-2xl mx-auto mb-16 p-8 border-4 border-black bg-gray-50">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">
            You're Qualified — Apply Now!
          </h2>

          <div className="space-y-8">
            <div>
              <label className="block text-lg mb-2">Your Stats (PPG, 40 time, vertical, etc.)</label>
              <textarea
                placeholder="e.g., 18 PPG, 4.6 40-yard, 36 inch vertical"
                value={stats}
                onChange={(e) => setStats(e.target.value)}
                className="w-full p-4 text-lg border-4 border-black font-mono"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-lg mb-2">Highlight Reel Link (required)</label>
              <Input 
                placeholder="YouTube / Hudl link" 
                value={highlightLink} 
                onChange={(e) => setHighlightLink(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-lg mb-2">Social Media Handles</label>
              <Input 
                placeholder="@instagram, @tiktok, etc." 
                value={socialHandles} 
                onChange={(e) => setSocialHandles(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-lg mb-2">Your Pitch to Brands</label>
              <textarea
                placeholder="Why would you be a great brand partner?"
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                className="w-full p-4 text-lg border-4 border-black font-mono"
                rows={6}
              />
            </div>

            <Button onClick={handleApply} className="w-full h-20 text-2xl bg-green-400 text-black">
              Submit Application
            </Button>
          </div>
        </div>
      )}

      {/* Current Deals */}
      <div className="max-w-4xl mx-auto py-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          Current Brand Deals
        </h2>
        <p className="text-xl text-center text-gray-600">
          Coming soon — exclusive partnerships with top brands.
        </p>
      </div>
    </div>
  )
}