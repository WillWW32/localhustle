'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Remove Textarea import — not needed

export default function Ambassador() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [school, setSchool] = useState('')
  const [sport, setSport] = useState('')
  const [why, setWhy] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!name || !email || !phone || !school || !sport || !why) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
        data: { role: 'athlete' },
      },
    })

    if (authError) {
      alert('Error: ' + authError.message)
      setLoading(false)
      return
    }

    const { error: dbError } = await supabase
      .from('ambassador_applications')
      .insert({
        name,
        email,
        phone,
        school,
        sport,
        why,
        status: 'new',
      })

    if (dbError) {
      alert('Application error: ' + dbError.message)
    } else {
      setSubmitted(true)
    }

    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white text-black font-mono flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Application Submitted!</h1>
        <p className="text-2xl text-center mb-12 max-w-2xl">
          Thank you, {name}! We've received your application.<br />
          Check your email for login link — start pitching businesses and earning today.
        </p>
        <Button onClick={() => router.push('/')} className="h-16 text-xl bg-black text-white">
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Job Header */}
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-8">
          LocalHustle Ambassador (Part-Time, Remote)
        </h1>

        <p className="text-2xl text-center mb-12 font-bold">
          Earn $100 Bonus + 5% Lifetime Commissions
        </p>

        {/* Description */}
        <div className="bg-gray-100 p-12 border-4 border-black mb-12">
          <p className="text-lg leading-relaxed mb-6">
            We’re looking for self-motivated high school varsity athletes (or recent grads) to help grow LocalHustle — the app that lets student athletes earn real money and Freedom Scholarships from local businesses.
          </p>

          <p className="text-lg leading-relaxed mb-6">
            <strong>Your Role:</strong><br />
            Pitch 10 local businesses using our proven letter.<br />
            Get them to fund a gig → you earn $100 bonus + 5% of every dollar they ever spend.
          </p>

          <p className="text-lg leading-relaxed mb-6">
            <strong>Top Requirements:</strong>
            <ul className="list-disc pl-8 space-y-2">
              <li><strong>Agency & Drive</strong> — You take initiative and get things done.</li>
              <li><strong>Self-Motivated</strong> — You see a goal and go after it.</li>
              <li><strong>Strong Communication</strong> — Clear, confident, professional.</li>
              <li>Varsity athletic experience is a plus.</li>
            </ul>
          </p>

          <p className="text-lg leading-relaxed mb-6">
            <strong>Compensation:</strong><br />
            • $100 cash bonus (complete in 7 days).<br />
            • 5% lifetime commission on all gigs from businesses you onboard.<br />
            • Top performers → promoted to Executive Sales Team (national brands + salary).
          </p>

          <p className="text-lg leading-relaxed">
            <strong>Work Style:</strong> Fully remote • Flexible • Work around practice & games.
          </p>
        </div>

        {/* Application Form */}
        <h2 className="text-3xl font-bold text-center mb-12">
          Apply Now
        </h2>

        <div className="space-y-8 max-w-2xl mx-auto">
          <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="School" value={school} onChange={(e) => setSchool(e.target.value)} />
          <Input placeholder="Sport" value={sport} onChange={(e) => setSport(e.target.value)} />
          <textarea 
            placeholder="Why do you want to be an ambassador? (Show us your hustle!)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={6}
            className="w-full p-4 text-lg border-4 border-black font-mono rounded-lg"
          />

          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-20 text-2xl bg-black text-white"
          >
            {loading ? 'Submitting...' : 'Submit Application — Start Earning'}
          </Button>
        </div>
      </div>
    </div>
  )
}