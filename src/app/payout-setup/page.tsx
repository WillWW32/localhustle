'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
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

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: '#aaa' }}>Loading...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '2.5rem', color: '#22c55e', marginBottom: '1.5rem' }}>&#10003;</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Payout Method Added!
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Your debit card is connected. Earnings will be paid instantly.
          </p>
          <button onClick={() => router.push('/dashboard')} className="btn-fixed-200">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Add Your Debit Card</h1>
        <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Connect your debit card to receive instant payouts. Any athlete can add a card.
        </p>

        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#000',
                  fontFamily: 'Courier New, monospace',
                  '::placeholder': {
                    color: '#aaa',
                  },
                },
              },
            }}
          />
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} className="btn-fixed-200"
          style={{ width: '100%', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Processing...' : 'Connect Debit Card'}
        </button>

        <p style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'center', marginTop: '1.5rem' }}>
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
