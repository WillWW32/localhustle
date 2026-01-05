'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'

export default function FundEvent() {
  const { slug } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return

      const { data, error } = await supabase
        .from('booster_events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Error fetching event:', error)
        return
      }

      setEvent(data)
    }

    fetchEvent()
  }, [slug])

  // Handle successful return from Stripe Checkout
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('success')) {
      setSuccess(true)
      // Optional: refresh event to show updated raised amount
      // (or rely on webhook for accuracy)
    }
  }, [])

  const handleDonate = async () => {
    if (!amount || !event) return
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Enter a valid amount')
      return
    }

    setLoading(true)

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: numAmount, 
        booster_event_id: event.id,
        success_url: `${window.location.origin}/fund/${slug}?success=1`,
        cancel_url: window.location.href,
      }),
    })

    const { id, error } = await response.json()

    if (error) {
      alert('Error: ' + error)
      setLoading(false)
      return
    }

    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    if (!stripe) {
      alert('Stripe failed to load')
      setLoading(false)
      return
    }

    const { error: redirectError } = await stripe.redirectToCheckout({ sessionId: id })

    if (redirectError) {
      alert(redirectError.message)
      setLoading(false)
    }
  }

  if (!event) return <p className="container text-center py-32 text-2xl font-mono">Loading event...</p>

  const progress = event.goal > 0 ? (event.raised / event.goal) * 100 : 0

  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Success Message */}
      {success && (
        <div className="max-w-2xl mx-auto mb-12 p-8 bg-green-100 border-4 border-green-600 rounded-lg text-center">
          <p className="text-3xl font-bold mb-4">Thank you!</p>
          <p className="text-xl">Your donation was successful. The team appreciates your support!</p>
        </div>
      )}

      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      {/* Event Image */}
      {event.image_url && (
        <div className="max-w-3xl mx-auto mb-12">
          <img 
            src={event.image_url} 
            alt={event.name}
            className="w-full max-h-96 object-cover border-4 border-black rounded-lg"
          />
        </div>
      )}

      {/* Event Title */}
      <h1 className="text-3xl sm:text-5xl font-bold text-center mb-8">
        {event.name}
      </h1>

      {/* End Date */}
      {event.end_date && (
        <p className="text-xl text-center mb-8 text-gray-600">
          Ends on {new Date(event.end_date).toLocaleDateString()}
        </p>
      )}

      {/* Description */}
      <p className="text-lg sm:text-2xl text-center mb-16 max-w-4xl mx-auto leading-relaxed">
        {event.description || 'Support this team event!'}
      </p>

      {/* Progress Meter */}
      <div className="max-w-2xl mx-auto mb-16">
        <p className="text-2xl sm:text-3xl text-center mb-6">
          ${Number(event.raised || 0).toFixed(2)} raised of ${Number(event.goal).toFixed(2)}
        </p>
        <div className="relative h-20 bg-gray-300 border-4 border-black">
          <div 
            className="absolute top-0 left-0 h-full bg-green-400 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
          <p className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
            {progress.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Donation Form */}
      <div className="max-w-md mx-auto">
        <Input
          type="number"
          placeholder="Enter donation amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-16 text-2xl text-center border-4 border-black mb-8 font-mono"
        />
        <Button 
          onClick={handleDonate}
          disabled={loading}
          className="w-full h-20 text-3xl bg-green-400 text-black font-bold font-mono"
        >
          {loading ? 'Processing...' : 'Donate Now'}
        </Button>
      </div>

      {/* Share Button */}
      <div className="max-w-md mx-auto mt-12">
        <Button 
          onClick={() => {
            const url = window.location.href
            navigator.clipboard.writeText(url)
            alert('Link copied! Share with others.')
          }}
          variant="outline"
          className="w-full h-16 text-xl border-4 border-black font-mono"
        >
          Copy Share Link
        </Button>
      </div>
    </div>
  )
}