'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const gigTypes = [
  { title: 'ShoutOut', amount: '50', description: 'Visit a favorite business and make a quick shoutout 15-sec reel about what you like.' },
  { title: 'Youth Clinic', amount: '500+', description: 'Run 30–60 min sessions for younger athletes (with teammates).' },
  { title: 'Team Sponsor', amount: '1000', description: 'Business sponsors team meals/gear — money split equally.' },
  { title: 'Product Review', amount: '50', description: '$50 + Perks (e.g., post your order — get free coffee for a month).' },
  { title: 'Cameo', amount: '100', description: 'Custom 15-Sec Video for Younger Athletes (birthdays, pre-game pep talks).' },
  { title: 'Custom Gig', amount: '200+', description: 'Create a gig and offer it.' },
]

export default function BusinessOnboard() {
  const [selectedGig, setSelectedGig] = useState<typeof gigTypes[0] | null>(null)
  const [customDetails, setCustomDetails] = useState('')
  const [amount, setAmount] = useState('')
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)

  const handleGigSelect = (gig: typeof gigTypes[0]) => {
    setSelectedGig(gig)
    setAmount('')
    setCustomDetails('')
  }

  const handlePost = async () => {
    alert('Offer posted and wallet funded (test mode)!')
  }

  return (
    <div className="container py-8">
      {/* Title */}
      <h1 className="text-center text-3xl mb-4 font-bold">Welcome Local Business</h1>
      <p className="text-center text-xl mb-4">An athlete invited you to support the team.</p>
      <p className="text-center text-xl mb-12">Here's How:</p>

      {/* Arrow */}
      <div className="text-center mb-12">
        <div style={{ fontSize: '2rem' }}>▼</div>
      </div>

      {/* Gig Descriptions */}
      <div className="max-w-4xl mx-auto mb-32">
        <div className="border border-black p-12 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {gigTypes.map((gig) => (
              <div key={gig.title}>
                <h3 className="text-2xl font-bold mb-4">{gig.title}</h3>
                <p className="font-bold mb-4">${gig.amount}</p>
                <p>{gig.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Giant Gig Buttons — shadcn Button with custom styles */}
      <h2 className="text-center text-3xl mb-12 font-bold">Choose a Gig to Sponsor</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-4xl mx-auto mb-32">
        {gigTypes.map((gig) => (
          <div key={gig.title}>
            <Button
              onClick={() => handleGigSelect(gig)}
              className="w-full h-52 text-3xl p-12 flex flex-col justify-center font-mono text-white hover:bg-gray-800"
              style={{
                backgroundColor: selectedGig?.title === gig.title ? '#333' : 'black',
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              <span className="mb-4">{gig.title}</span>
              <span className="mb-4">${gig.amount}</span>
              <span className="text-xl">{gig.description}</span>
            </Button>

            {/* Form below selected gig */}
            {selectedGig?.title === gig.title && (
              <div className="mt-12 bg-gray-100 p-12 border border-black max-w-md mx-auto">
                <h3 className="text-2xl mb-8 font-bold">Customize Your {gig.title}</h3>
                <div className="space-y-8">
                  <div>
                    <label className="block text-xl mb-2">Offer Amount</label>
                    <Input
                      placeholder="Enter Offer Amount - Min $50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="font-mono"
                      style={{ color: '#666' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xl mb-2">Custom Details</label>
                    <textarea
                      placeholder="Add your details (e.g., Come to Bridge Pizza this Friday)"
                      value={customDetails}
                      onChange={(e) => setCustomDetails(e.target.value)}
                      className="w-full border-4 border-black p-6 h-40 text-xl font-mono"
                      style={{ color: '#666' }}
                    />
                  </div>
                  <Button onClick={handlePost} className="w-full h-20 text-3xl bg-black text-white hover:bg-gray-800 font-mono font-bold">
                    Fund & Post Offer
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Popup */}
      <div className="text-center mb-20">
        <Button onClick={() => setShowPaymentPopup(true)} variant="outline" className="text-xl py-6">
          How payments work?
        </Button>
      </div>

      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-12 border-4 border-black max-w-lg">
            <h2 className="text-3xl mb-8 font-bold">How Payments Work</h2>
            <p className="mb-4">1. Athlete uploads clip</p>
            <p className="mb-4">2. You review & approve</p>
            <p className="mb-4">3. Parent approves (for minors)</p>
            <p className="mb-8">4. $ sent — clips you love</p>
            <Button onClick={() => setShowPaymentPopup(false)} className="w-full text-xl py-6">
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}