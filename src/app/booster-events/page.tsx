'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function BoosterEvents() {
  const [eventName, setEventName] = useState('')
  const [goal, setGoal] = useState('')
  const [description, setDescription] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        setProfile(prof)
      }
    }
    fetchProfile()
  }, [])

  const handleCreate = async () => {
    if (!eventName || !goal || !profile) {
      alert('Please fill all fields and be logged in')
      return
    }

    setLoading(true)

    // Generate unique slug
    let slug = eventName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
    let uniqueSlug = slug
    let counter = 1

    // Check uniqueness
    while (true) {
      const { data: existing } = await supabase
        .from('booster_events')
        .select('id')
        .eq('slug', uniqueSlug)
        .single()

      if (!existing) break
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    // Insert to table
    const { data, error } = await supabase
      .from('booster_events')
      .insert({
        creator_id: profile.id,
        name: eventName,
        slug: uniqueSlug,
        description,
        goal: parseFloat(goal),
        raised: 0,
      })
      .select()
      .single()

    if (error) {
      alert('Error creating event: ' + error.message)
      setLoading(false)
      return
    }

    const link = `${window.location.origin}/fund/${data.slug}`
    setShareLink(link)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
        Create Booster Club Event
      </h1>

      {/* Detail */}
      <p className="text-lg sm:text-2xl text-center mb-12 max-w-4xl mx-auto leading-relaxed">
        Crowd-fund team expenses fast — businesses contribute, money goes to team.<br />
        Perfect for post-game meals, gear, youth clinics, elementary visits, or charity work.
      </p>

      {/* Form */}
      <div className="max-w-2xl mx-auto">
        <Input
          placeholder="Event Name (e.g., Post-Game Meals for Road Trips)"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="h-16 text-2xl text-center border-4 border-black mb-8"
        />
        <Input
          type="number"
          placeholder="Funding Goal (e.g., 1000)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="h-16 text-2xl text-center border-4 border-black mb-8"
        />
        <textarea
          placeholder="Description (e.g., Meals for away games — help keep our athletes fueled!)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-48 p-4 text-xl border-4 border-black font-mono mb-12"
        />
        <Button 
          onClick={handleCreate}
          disabled={loading}
          className="w-full h-20 text-3xl bg-green-400 text-black"
        >
          {loading ? 'Creating...' : 'Create Event & Get Share Link'}
        </Button>
      </div>

      {/* Share Link + Progress Meter */}
      {shareLink && (
        <div className="max-w-2xl mx-auto mt-16 p-8 bg-gray-100 border-4 border-black">
          <p className="text-2xl sm:text-3xl text-center mb-8">
            Event created! Share this link with local businesses:
          </p>
          <p className="text-lg sm:text-xl break-all mb-8 px-4">
            {shareLink}
          </p>

          {/* Progress Meter */}
          <div className="mb-8">
            <p className="text-2xl text-center mb-4">
              $0 raised of ${goal}
            </p>
            <div className="relative h-20 bg-gray-300 border-4 border-black">
              <div className="absolute top-0 left-0 h-full bg-green-400" style={{ width: '0%' }}></div>
              <p className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                0%
              </p>
            </div>
          </div>

          <Button onClick={() => navigator.clipboard.writeText(shareLink)} className="w-full h-16 text-2xl bg-black text-white">
            Copy Link
          </Button>
        </div>
      )}
    </div>
  )
}