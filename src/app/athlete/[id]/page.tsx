'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ReelContainer from '@/components/ReelContainer'

const gigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30-60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

export default function AthleteProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [selectedGigs, setSelectedGigs] = useState<string[]>([])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setProfile(data)
      if (data.selected_gigs) setSelectedGigs(data.selected_gigs)
    }

    if (id) fetchProfile()
  }, [id])

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999' }}>Loading profile...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace" }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #eee', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ fontWeight: 'bold', color: 'black', textDecoration: 'none', fontSize: '1.125rem' }}>
          LocalHustle
        </a>
        <span style={{ color: '#999', fontSize: '0.75rem' }}>Athlete Profile</span>
      </header>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem', paddingBottom: '4rem' }}>
        {/* Profile Card */}
        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          {/* Profile Photo */}
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1.25rem' }}>
            {profile.profile_pic ? (
              <img
                src={profile.profile_pic}
                alt={`${profile.full_name || 'Athlete'}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                {(profile.full_name || 'A').split(' ').map((n: string) => n[0]).join('')}
              </div>
            )}
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.375rem' }}>
            {profile.full_name || 'Athlete'}
          </h1>
          <p style={{ color: 'green', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.375rem' }}>
            {profile.school}{profile.sport ? ` \u2022 ${profile.sport}` : ''}
          </p>

          {profile.social_followers && (
            <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: 0 }}>
              {profile.social_followers} followers
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>About</h2>
            <p style={{ color: '#666', lineHeight: 1.7, fontSize: '0.9rem' }}>{profile.bio}</p>
          </div>
        )}

        {/* Highlight Reel */}
        {profile.highlight_link && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Highlight Reel</h2>
            <div style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
              <iframe
                style={{ width: '100%', height: '100%', border: 'none' }}
                src={profile.highlight_link.replace('watch?v=', 'embed/')}
                title="Highlight Reel"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Instagram Reels */}
        {profile.instagram_reels && profile.instagram_reels.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Instagram Reels</h2>
            <ReelContainer reels={profile.instagram_reels} />
          </div>
        )}

        {/* Gigs I Offer */}
        {selectedGigs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Gigs I Offer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedGigs.map((title) => {
                const gig = gigTypes.find(g => g.title === title)
                return gig ? (
                  <div key={title} style={{ background: '#f5f5f5', borderRadius: '12px', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.375rem' }}>{gig.title}</h3>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{gig.description}</p>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Interested in working with this athlete?
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.875rem 2rem',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Post a Gig on LocalHustle
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #eee', padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '0.75rem' }}>
        &copy; {new Date().getFullYear()} LocalHustle
      </footer>
    </div>
  )
}
