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

      // Count completed gigs (placeholder — V2 real count from clips)
      // For now, assume 4+ for demo
      setCompletedGigs(4) // replace with real count later
      setQualified(true) // replace with real check

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

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'white',
      color: 'black',
      minHeight: '100vh',
    }}>
      {/* Slogan + Triangle */}
      <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Community Driven Support for Student Athletes
      </p>
      <div style={{ fontSize: '3rem', marginBottom: '4rem' }}>▼</div>

      {/* Hero */}
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Land National Brand Deals
      </h1>
      <p style={{ fontSize: '1.8rem', maxWidth: '800px', margin: '0 auto 4rem auto', lineHeight: '1.8' }}>
        Complete 4 local gigs → qualify for paid partnerships with top brands like Nike, Gatorade, Under Armour, and more.
      </p>

      {/* Qualification Status */}
      <div style={{ maxWidth: '600px', margin: '0 auto 6rem auto', padding: '3rem', border: '4px solid black', backgroundColor: qualified ? '#f0fff0' : '#fff0f0' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
          Your Qualification Status
        </h2>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Completed local gigs: {completedGigs} / 4
        </p>
        <div style={{ height: '40px', backgroundColor: '#ddd', border: '4px solid black', position: 'relative', marginBottom: '2rem' }}>
          <div style={{
            width: `${Math.min(completedGigs / 4 * 100, 100)}%`,
            height: '100%',
            backgroundColor: qualified ? '#90ee90' : '#ff6b6b',
          }}></div>
          <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>
            {qualified ? 'Qualified!' : `${4 - completedGigs} gigs to go`}
          </p>
        </div>

        {!qualified && (
          <Button 
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%',
              height: '80px',
              fontSize: '2rem',
              backgroundColor: '#90ee90',
              color: 'black',
            }}
          >
            Back to Dashboard — Complete More Gigs
          </Button>
        )}
      </div>

      {/* Application Form — only if qualified */}
      {qualified && (
        <div style={{ maxWidth: '700px', margin: '0 auto 6rem auto', padding: '3rem', border: '4px solid black', backgroundColor: '#f5f5f5' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>
            You're Qualified — Apply Now!
          </h2>

          <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Your Stats (PPG, 40 time, vertical, etc.)</label>
              <textarea
                placeholder="e.g., 18 PPG, 4.6 40-yard, 36 inch vertical"
                value={stats}
                onChange={(e) => setStats(e.target.value)}
                style={{ width: '100%', height: '120px', padding: '1rem', fontSize: '1.2rem', border: '4px solid black' }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Highlight Reel Link (required)</label>
              <Input placeholder="YouTube / Hudl link" value={highlightLink} onChange={(e) => setHighlightLink(e.target.value)} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Social Media Handles</label>
              <Input placeholder="@instagram, @tiktok, etc." value={socialHandles} onChange={(e) => setSocialHandles(e.target.value)} />
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <label style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Your Pitch to Brands</label>
              <textarea
                placeholder="Why would you be a great brand partner?"
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                style={{ width: '100%', height: '160px', padding: '1rem', fontSize: '1.2rem', border: '4px solid black' }}
              />
            </div>

            <Button onClick={handleApply} style={{
              width: '100%',
              height: '80px',
              fontSize: '2rem',
              backgroundColor: '#90ee90',
              color: 'black',
            }}>
              Submit Application
            </Button>
          </div>
        </div>
      )}

      {/* Current Deals (Placeholder for future) */}
      <div style={{ marginTop: '6rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>
          Current Brand Deals
        </h2>
        <p style={{ fontSize: '1.5rem', color: '#666' }}>
          Coming soon — exclusive partnerships with top brands.
        </p>
      </div>
    </div>
  )
}