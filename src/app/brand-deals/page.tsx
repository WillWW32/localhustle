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
  const [loading, setLoading] = useState(false)
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
        .select('highlight_link, social_handles')
        .eq('id', user.id)
        .single()

      if (prof) {
        setProfile(prof)
        setHighlightLink(prof.highlight_link || '')
        setSocialHandles(prof.social_handles || '')
      }

      // Count approved gigs
      const { count } = await supabase
        .from('clips')
        .select('id', { count: 'exact' })
        .eq('athlete_id', user.id)
        .eq('status', 'approved')

      const gigs = count || 0
      setCompletedGigs(gigs)
      setQualified(gigs >= 8)

      // Build stats string
      setStats(`Completed Gigs: ${gigs} | Freedom Scholarships: $${gigs * 100}`)
    }

    fetchData()
  }, [router])

  const handleApply = async () => {
    if (!qualified) {
      alert('Complete 8 gigs to qualify for brand deals')
      return
    }

    setLoading(true)

    // In real app — send to backend for review
    alert('Application submitted! We\'ll review and reach out soon.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-bold text-center mb-16">
          Land National Brand Deals
        </h1>

        {/* Qualification Progress Meter */}
        <div className="bg-gray-100 p-12 border-4 border-black mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Your Progress to Brand Deal Eligibility
          </h2>

          <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="relative h-20 bg-gray-300 border-4 border-black mb-12 overflow-hidden">
              <div 
                className="absolute h-full bg-purple-600 transition-all duration-700"
                style={{ width: `${Math.min((completedGigs / 8) * 100, 100)}%` }}
              />
              <p className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                {completedGigs} / 8 Gigs
              </p>
            </div>

            {/* Status Message */}
            {qualified ? (
              <div className="bg-purple-100 p-12 border-4 border-purple-600 text-center">
                <p className="text-3xl font-bold mb-4 text-purple-800">
                  You're Qualified! 🎉
                </p>
                <p className="text-xl">
                  Submit your application below — brands are waiting.
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 p-12 border-4 border-black text-center">
                <p className="text-2xl mb-4">
                  {8 - completedGigs} more gigs to qualify
                </p>
                <p className="text-lg">
                  Complete 8 approved gigs to become eligible for national brand deals.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Application Form — Only if Qualified */}
        {qualified && (
          <div className="bg-gray-100 p-16 border-4 border-black mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">
              Apply for Brand Deals
            </h2>

            <div className="max-w-3xl mx-auto space-y-12">
              <div>
                <label className="block text-xl mb-4">Your Stats</label>
                <p className="text-lg p-4 bg-white border-4 border-black text-center">
                  {stats}
                </p>
              </div>

              <div>
                <label className="block text-xl mb-4">Highlight Reel Link</label>
                <Input 
                  placeholder="YouTube / Hudl link"
                  value={highlightLink}
                  onChange={(e) => setHighlightLink(e.target.value)}
                  className="text-center"
                />
              </div>

              <div>
                <label className="block text-xl mb-4">Social Handles</label>
                <Input 
                  placeholder="@instagram @tiktok etc."
                  value={socialHandles}
                  onChange={(e) => setSocialHandles(e.target.value)}
                  className="text-center"
                />
              </div>

              <div>
                <label className="block text-xl mb-4">
                  Why would you be a great brand partner?
                </label>
                <textarea
                  placeholder="Tell brands about your story, audience, and why you'd represent them well..."
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  className="w-full p-6 text-lg border-4 border-black font-mono"
                  rows={8}
                />
              </div>

              <Button 
                onClick={handleApply}
                disabled={loading}
                className="w-full h-20 text-3xl bg-purple-600 text-white font-bold"
              >
                {loading ? 'Submitting...' : 'Submit Brand Deal Application'}
              </Button>
            </div>
          </div>
        )}

        {/* Current Deals */}
        <div className="max-w-4xl mx-auto py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">
            Current Brand Deals
          </h2>
          <p className="text-xl text-gray-600">
            Exclusive partnerships coming soon — stay tuned!
          </p>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full max-w-md h-20 text-2xl bg-black text-white font-bold"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}