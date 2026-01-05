'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function BoosterEvents() {
  const [eventName, setEventName] = useState('')
  const [goal, setGoal] = useState('')
  const [description, setDescription] = useState('')
  const [endDate, setEndDate] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [success, setSuccess] = useState(false)
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
      alert('Please fill all required fields and be logged in')
      return
    }

    setLoading(true)

    // Generate unique slug
    let slug = eventName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
    let uniqueSlug = slug
    let counter = 1

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

    // Optional: Upload image if selected
    let imageUrl = null
    if (image) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('booster-images')
        .upload(`${profile.id}/${image.name}`, image)

      if (uploadError) {
        alert('Image upload error: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('booster-images')
        .getPublicUrl(`${profile.id}/${image.name}`)

      imageUrl = publicUrlData.publicUrl
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
        end_date: endDate || null,
        image_url: imageUrl,
      })
      .select()
      .single()

    if (error) {
      alert('Error creating event: ' + error.message)
      setLoading(false)
      return
    }

    setShareLink(`${window.location.origin}/fund/${data.slug}`)
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="container py-8 font-mono">
      <p className="text-center mb-12 text-xl">Welcome to Booster Events</p>

      <div className="bg-black text-white p-8 mb-12">
        <h1 className="text-3xl font-bold text-center">Create a Booster Club Event</h1>
      </div>

      <div className="bg-black text-white p-8 mb-12">
        <p className="text-lg leading-relaxed text-center max-w-3xl mx-auto">
          Crowd-fund team expenses with local businesses — meals, gear, trips.
        </p>
      </div>

      {/* Event Creation Form */}
      <div className="max-w-2xl mx-auto space-y-12">
        <Input
          placeholder="Event Name (e.g., Post-Game Meals)"
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
        <Input
          type="date"
          placeholder="Optional End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-16 text-2xl text-center border-4 border-black mb-8"
        />
        <div>
          <label className="block text-xl mb-4">Optional Image Upload</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="h-16 text-xl border-4 border-black"
          />
        </div>
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

      {/* Success Feedback + Share Link + Progress Meter */}
      {success && shareLink && (
        <div className="max-w-2xl mx-auto mt-16 p-8 bg-gray-100 border-4 border-black rounded-lg">
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