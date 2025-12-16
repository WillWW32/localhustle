'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [school, setSchool] = useState('')
  const [sport, setSport] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
        setSchool(data.school || '')
        setSport(data.sport || '')
        setParentEmail(data.parent_email || '')
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          school,
          sport,
          parent_email: parentEmail,
        })
        .eq('id', user.id)

      if (error) alert(error.message)
      else alert('Profile updated!')
    }
    setLoading(false)
  }

  if (!profile) return <p className="container text-center">Loading...</p>

  return (
    <div className="container">
      <h1 className="text-center text-5xl mb-12">Edit Profile</h1>

      <div className="max-w-md mx-auto space-y-12">
        <div className="space-y-4">
          <Label htmlFor="school" className="text-2xl">School</Label>
          <Input
            id="school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Lincoln High"
            className="text-2xl py-8 border-2 border-black"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="sport" className="text-2xl">Sport</Label>
          <Input
            id="sport"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="Basketball"
            className="text-2xl py-8 border-2 border-black"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="parent" className="text-2xl">Parent/Guardian Email (for payouts)</Label>
          <Input
            id="parent"
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@example.com"
            className="text-2xl py-8 border-2 border-black"
          />
          <p className="text-sm text-gray-600">
            Your earnings are sent to your parent for safety and compliance. 
            Please ask them to forward the money to you promptly (e.g., to your Venmo Teen or cash).
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full text-3xl py-12 border-4 border-black hover:bg-black hover:text-white">
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  )
}