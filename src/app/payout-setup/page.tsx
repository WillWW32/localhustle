'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PayoutSetupContent() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, payout_method_setup')
        .eq('id', user.id)
        .single()

      if (prof) {
        setProfile(prof)
        if (prof.payout_method_setup) {
          setSuccess(true)
        }
      }
    }

    fetchProfile()
  }, [router])

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      setError('Stripe not loaded')
      return
    }

    setLoading(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Card element not found')
      setLoading(false)
      return
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (stripeError) {
      setError(stripeError.message || 'Payment method error')
      setLoading(false)
      return
    }

    // Attach to backend
    const response = await fetch('/api/attach-payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method_id: paymentMethod.id,
        athlete_id: profile.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      setError(data.error)
    } else {
      await supabase
        .from('profiles')
        .update({ payout_method_setup: true })
        .eq('id', profile.id)

      setSuccess(true)
    }

    setLoading(false)
  }

  if (!profile) return <p className="container text-center py-32">Loading...</p>

  if (success) {
    return (
      <div className="min-h-screen bg-white text-black font-mono flex flex-col items-center justify-center px-6">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-600">
          Payout Method Added!
        </h1>
        <p className="text-2xl text-center mb-12 max-w-2xl">
          Your debit card is connected.<br />
          Earnings will be paid instantly.
        </p>
        <Button 
          onClick={() => router.push('/dashboard')}
          className="w-full max-w-md h-20 text-2xl bg-black text-white"
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono py-16 px-6 form-page">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">
          Add Your Debit Card
        </h1>

        <p className="text-xl text-center mb-12">
          Connect your debit card to receive instant payouts.<br />
          Any athlete can add a card.
        </p>

        <div className="bg-gray-100 p-8 border-4 border-black mb-12">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '20px',
                  color: '#000',
                  fontFamily: 'Courier New, monospace',
                  '::placeholder': {
                    color: '#666',
                  },
                },
              },
            }}
          />
        </div>

        {error && (
          <p className="text-red-600 text-center mb-8 text-xl">
            {error}
          </p>
        )}

        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-20 text-2xl bg-black text-white font-bold"
        >
          {loading ? 'Processing...' : 'Connect Debit Card'}
        </Button>

        <p className="text-center mt-12 text-lg text-gray-600">
          Secure via Stripe — we never store your card details.
        </p>
      </div>
    </div>
  )
}

export default function PayoutSetup() {
  return (
    <Elements stripe={stripePromise}>
      <PayoutSetupContent />
    </Elements>
  )
}