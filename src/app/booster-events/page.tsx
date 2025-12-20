'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function BoosterEvents() {
  const [eventName, setEventName] = useState('')
  const [goal, setGoal] = useState('')
  const [description, setDescription] = useState('')
  const [shareLink, setShareLink] = useState('')

  const handleCreate = async () => {
    // Create event + share link
    const link = `https://app.localhustle.org/fund/${eventName.toLowerCase().replace(' ', '-')}`
    setShareLink(link)
    alert(`Event created! Share this link: ${link}`)
  }

  return (
    <div className="container py-20 text-center">
      <h1 className="text-4xl font-bold mb-8">Create Booster Club Event</h1>
      <p className="text-xl mb-12">Crowd-fund team expenses fast — businesses contribute, money goes to team.</p>

      <div className="max-w-md mx-auto space-y-12">
        <Input placeholder="Event Name (e.g., Post-Game Meals)" value={eventName} onChange={(e) => setEventName(e.target.value)} />
        <Input type="number" placeholder="Funding Goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
        <textarea
          placeholder="Description (e.g., Meals for road games)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border-4 border-black p-6 h-40 text-xl"
        />
        <Button onClick={handleCreate} className="w-full h-20 text-3xl bg-green-400 text-black">
          Create Event & Get Share Link
        </Button>

        {shareLink && (
          <div className="mt-12">
            <p className="text-2xl mb-4">Share this link:</p>
            <p className="text-xl break-all">{shareLink}</p>
          </div>
        )}
      </div>
    </div>
  )
}