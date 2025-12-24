'use client'

import { useParams, useRouter } from 'next/navigation'
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

  if (!profile) return <p className="container text-center py-32">Loading profile...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Circle Photo */}
      <div className="mb-12">
        <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-full overflow-hidden border-8 border-black">
          {profile.profile_pic ? (
            <img src={profile.profile_pic} alt={`${profile.full_name || profile.email}'s photo`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <p className="text-gray-600">No Photo</p>
            </div>
          )}
        </div>
      </div>

      {/* Name & School */}
      <h1 className="text-3xl sm:text-5xl font-bold text-center mb-4">
        {profile.full_name || profile.email.split('@')[0]}
      </h1>
      <p className="text-xl sm:text-3xl text-center mb-8">
        {profile.school} • {profile.sport}
      </p>

      {/* Social Followers */}
      {profile.social_followers && (
        <p className="text-xl sm:text-2xl text-center mb-8">
          Total Followers: {profile.social_followers}
        </p>
      )}

      {/* Bio */}
      {profile.bio && (
        <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-12 leading-relaxed px-4">
          {profile.bio}
        </p>
      )}

      {/* Highlight Reel */}
      {profile.highlight_link && (
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Highlight Reel
          </h2>
          <div className="max-w-4xl mx-auto aspect-video">
            <iframe
              className="w-full h-full border-4 border-black"
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
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Gigs I Offer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
            {selectedGigs.map((title) => {
              const gig = gigTypes.find(g => g.title === title)
              return gig ? (
                <div key={title} className="border-4 border-black p-8 bg-gray-100">
                  <h3 className="text-2xl font-bold mb-4">{gig.title}</h3>
                  <p className="text-lg">{gig.description}</p>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* CTA for Businesses */}
      <div className="my-16">
        <p className="text-xl sm:text-2xl text-center mb-8">
          Interested in sponsoring this athlete?
        </p>
        <Button 
          onClick={() => router.push('/dashboard')}
          className="w-full max-w-md h-20 text-2xl sm:text-3xl bg-green-400 text-black"
        >
          Go to Admin Console & Post a Gig
        </Button>
      </div>
    </div>
  )
}