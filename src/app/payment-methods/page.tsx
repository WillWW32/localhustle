'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentMethodsContent() {
  const [business, setBusiness] = useState<any>(null)
  const [savedMethods, setSavedMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (biz) {
        setBusiness(biz)

        const response = await fetch('/api/list-payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_id: biz.id }),
        })

        const data = await response.json()
        setSavedMethods(data.methods || [])
      }
    }

    fetchData()
  }, [router])

  const handleAddCard = async () => {
    if (!stripe || !elements) {
      setError('Stripe not loaded')
      return
    }

    setError(null)
    setSuccess(false)
    setLoading(true)

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
      setError(stripeError.message || 'Payment error')
      setLoading(false)
      return
    }

    const response = await fetch('/api/attach-payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method_id: paymentMethod.id,
        business_id: business.id,
      }),
    })

    const data = await response.json()

    if (data.error) {
      setError(data.error)
    } else {
      setSuccess(true)
      setSavedMethods([...savedMethods, data.method])
    }

    setLoading(false)
  }

  if (!business) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: '#aaa' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Payment Methods</h1>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Saved cards for wallet top-ups and auto-top-up. Add or manage cards below.
        </p>

        {/* Saved Cards */}
        {savedMethods.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '2rem' }}>No saved cards yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {savedMethods.map((method) => (
              <div key={method.id} style={{ background: '#f5f5f5', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>
                  •••• •••• •••• {method.last4}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>
                  Expires {method.exp_month}/{method.exp_year}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add New Card */}
        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>Add New Card</h2>
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
        {success && (
          <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '8px', color: '#22c55e', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
            Card added!
          </div>
        )}

        <button onClick={handleAddCard} disabled={loading} className="btn-fixed-200"
          style={{ width: '100%', opacity: loading ? 0.6 : 1, marginBottom: '1rem' }}>
          {loading ? 'Adding...' : 'Save Card'}
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            fontFamily: "'Courier New', Courier, monospace",
            background: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: '9999px',
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>

      </div>
    </div>
  )
}

export default function PaymentMethods() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsContent />
    </Elements>
  )
}
