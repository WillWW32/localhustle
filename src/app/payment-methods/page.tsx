'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
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

        // Fetch saved payment methods
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

  if (!business) return <p className="text-center py-32 text-2xl">Loading...</p>

  return (
    <div className="min-h-screen bg-white text-black font-mono py-16 px-6 form-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">
          Payment Methods
        </h1>

        <p className="text-xl text-center mb-12">
          Saved cards for wallet top-ups and auto-top-up.<br />
          Add or manage cards below.
        </p>

        {/* Saved Cards */}
        {savedMethods.length === 0 ? (
          <p className="text-center text-xl mb-12">No saved cards yet.</p>
        ) : (
          <div className="space-y-8 mb-16">
            {savedMethods.map((method) => (
              <div key={method.id} className="border-4 border-black p-8 bg-gray-100">
                <p className="text-xl">
                  •••• •••• •••• {method.last4}<br />
                  Expires {method.exp_month}/{method.exp_year}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add New Card */}
        <div className="bg-gray-100 p-12 border-4 border-black mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Add New Card
          </h2>
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
        {success && (
          <p className="text-green-600 text-center mb-8 text-xl">
            Card added!
          </p>
        )}

        <Button 
          onClick={handleAddCard}
          disabled={loading}
          className="w-full h-20 text-2xl bg-black text-white font-bold"
        >
          {loading ? 'Adding...' : 'Save Card'}
        </Button>

        <div className="mt-12 text-center">
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="h-16 text-xl border-4 border-black"
          >
            Back to Dashboard
          </Button>
        </div>
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