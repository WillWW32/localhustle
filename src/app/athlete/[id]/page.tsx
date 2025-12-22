'use client'

import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

const gigTypes = [
  { title: 'ShoutOut', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like or your favorite order.' },
  { title: 'Youth Clinic', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Cameo', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Player Training', description: 'Varsity athlete 40-minute training with young player.' },
  { title: 'Custom Gig', description: 'Create a gig and offer it.' },
]

export default function AthleteProfile() {
  const { id } = useParams()
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

  if (!profile) return <p className="container text-center py-32">Loading profile...</p>

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

      {/* Circle Photo */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ width: '200px', height: '200px', borderRadius: '50%', margin: '0 auto', overflow: 'hidden', border: '4px solid black' }}>
          {profile.profile_pic ? (
            <img src={profile.profile_pic} alt={`${profile.full_name || profile.email}'s photo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '1.2rem' }}>No Photo</p>
            </div>
          )}
        </div>
      </div>

      {/* Name & School */}
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        {profile.full_name || profile.email.split('@')[0]}
      </h1>
      <p style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>
        {profile.school} • {profile.sport}
      </p>

      {/* Social Followers */}
      {profile.social_followers && (
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Total Followers: {profile.social_followers}
        </p>
      )}

      {/* Bio */}
      {profile.bio && (
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 4rem auto', lineHeight: '1.8' }}>
          {profile.bio}
        </p>
      )}

      {/* Highlight Reel */}
      {profile.highlight_link && (
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>
            Highlight Reel
          </h2>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <iframe
              width="100%"
              height="450"
              src={profile.highlight_link.replace('watch?v=', 'embed/')}
              title="Highlight Reel"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Selected Gigs */}
      {selectedGigs.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>
            Gigs I Offer
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {selectedGigs.map((title) => {
              const gig = gigTypes.find(g => g.title === title)
              return gig ? (
                <div key={title} style={{ border: '2px solid black', padding: '2rem', backgroundColor: '#f5f5f5' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{gig.title}</h3>
                  <p style={{ fontSize: '1.2rem' }}>{gig.description}</p>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* CTA for Businesses */}
      <div style={{ marginTop: '6rem' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Interested in sponsoring this athlete?
        </p>
        <Button 
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            maxWidth: '500px',
            height: '80px',
            fontSize: '2rem',
            backgroundColor: '#90ee90',
            color: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Courier New', Courier, monospace'",
          }}
        >
          Go to Admin Console & Post a Gig
        </Button>
      </div>
    </div>
  )
}