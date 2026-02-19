'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type FormStep = 1 | 2

interface ParentFormData {
  name: string
  email: string
  phone: string
}

interface AthleteFormData {
  firstName: string
  lastName: string
  sport: string
  position: string
  height: string
  weight: string
  gradYear: string
  highSchool: string
  city: string
  state: string
}

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<FormStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [parentData, setParentData] = useState<ParentFormData>({
    name: '',
    email: '',
    phone: '',
  })

  const [athleteData, setAthleteData] = useState<AthleteFormData>({
    firstName: '',
    lastName: '',
    sport: '',
    position: '',
    height: '',
    weight: '',
    gradYear: '',
    highSchool: '',
    city: '',
    state: '',
  })

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setParentData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAthleteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setAthleteData((prev) => ({ ...prev, [name]: value }))
  }

  const validateParentForm = () => {
    if (!parentData.name.trim()) { setError('Please enter your name'); return false }
    if (!parentData.email.trim() || !parentData.email.includes('@')) { setError('Please enter a valid email'); return false }
    if (!parentData.phone.trim()) { setError('Please enter your phone number'); return false }
    return true
  }

  const validateAthleteForm = () => {
    if (!athleteData.firstName.trim()) { setError("Please enter athlete's first name"); return false }
    if (!athleteData.lastName.trim()) { setError("Please enter athlete's last name"); return false }
    if (!athleteData.sport) { setError('Please select a sport'); return false }
    if (!athleteData.position.trim()) { setError('Please enter position'); return false }
    if (!athleteData.height.trim()) { setError('Please enter height'); return false }
    if (!athleteData.weight.trim()) { setError('Please enter weight'); return false }
    if (!athleteData.gradYear) { setError('Please select graduation year'); return false }
    if (!athleteData.highSchool.trim()) { setError('Please enter high school'); return false }
    if (!athleteData.city.trim()) { setError('Please enter city'); return false }
    if (!athleteData.state) { setError('Please select state'); return false }
    return true
  }

  const handleNext = () => {
    setError(null)
    if (validateParentForm()) setCurrentStep(2)
  }

  const handleBack = () => {
    setError(null)
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateAthleteForm()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/recruit/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: parentData, athlete: athleteData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      router.push('/recruit/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  const sports = [
    'Football', 'Basketball', 'Baseball', 'Soccer', 'Lacrosse',
    'Volleyball', 'Tennis', 'Cross Country', 'Track & Field',
    'Swimming', 'Golf', 'Softball',
  ]

  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY',
  ]

  const currentYear = new Date().getFullYear()
  const gradYears = Array.from({ length: 8 }, (_, i) => (currentYear + i).toString())

  const inputClass = 'w-full px-4 py-3 border-4 border-black bg-white text-black font-mono text-left focus:outline-none focus:border-green-600'
  const selectClass = 'w-full px-4 py-3 border-4 border-black bg-white text-black font-mono focus:outline-none focus:border-green-600'

  return (
    <div className="min-h-screen bg-white text-black font-mono" style={{ padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <Link href="/recruit" className="inline-block mb-6" style={{ color: '#666' }}>
          &larr; Back to Recruit
        </Link>
        <div className="bg-black text-white p-8 mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold">Get Your Athlete Recruited</h2>
        </div>
        <p style={{ color: '#666' }}>
          Fill out this quick form and we&apos;ll start reaching out to coaches.
        </p>
      </div>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-4 mb-2">
          <div className="flex-1 h-3 border-2 border-black">
            <div className={`h-full ${currentStep >= 1 ? 'bg-black' : 'bg-gray-200'}`} />
          </div>
          <div className="flex-1 h-3 border-2 border-black">
            <div className={`h-full ${currentStep >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
          </div>
        </div>
        <p className="text-sm" style={{ color: '#666' }}>Step {currentStep} of 2</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto border-4 border-black p-6 sm:p-8">
        <form onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-black">Parent/Guardian Information</h3>

              <div>
                <label htmlFor="name" className="block text-sm font-bold mb-2 uppercase">Full Name</label>
                <input type="text" id="name" name="name" value={parentData.name} onChange={handleParentChange}
                  className={inputClass} placeholder="John Smith" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold mb-2 uppercase">Email Address</label>
                <input type="email" id="email" name="email" value={parentData.email} onChange={handleParentChange}
                  className={inputClass} placeholder="john@example.com" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold mb-2 uppercase">Phone Number</label>
                <input type="tel" id="phone" name="phone" value={parentData.phone} onChange={handleParentChange}
                  className={inputClass} placeholder="(555) 123-4567" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-black">Athlete Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-bold mb-2 uppercase">First Name</label>
                  <input type="text" id="firstName" name="firstName" value={athleteData.firstName} onChange={handleAthleteChange}
                    className={inputClass} placeholder="Alex" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-bold mb-2 uppercase">Last Name</label>
                  <input type="text" id="lastName" name="lastName" value={athleteData.lastName} onChange={handleAthleteChange}
                    className={inputClass} placeholder="Johnson" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sport" className="block text-sm font-bold mb-2 uppercase">Sport</label>
                  <select id="sport" name="sport" value={athleteData.sport} onChange={handleAthleteChange} className={selectClass}>
                    <option value="">Select a sport</option>
                    {sports.map((sport) => (<option key={sport} value={sport}>{sport}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-bold mb-2 uppercase">Position</label>
                  <input type="text" id="position" name="position" value={athleteData.position} onChange={handleAthleteChange}
                    className={inputClass} placeholder="Quarterback" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height" className="block text-sm font-bold mb-2 uppercase">Height</label>
                  <input type="text" id="height" name="height" value={athleteData.height} onChange={handleAthleteChange}
                    className={inputClass} placeholder="6'2&quot;" />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-bold mb-2 uppercase">Weight (lbs)</label>
                  <input type="text" id="weight" name="weight" value={athleteData.weight} onChange={handleAthleteChange}
                    className={inputClass} placeholder="210" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gradYear" className="block text-sm font-bold mb-2 uppercase">Graduation Year</label>
                  <select id="gradYear" name="gradYear" value={athleteData.gradYear} onChange={handleAthleteChange} className={selectClass}>
                    <option value="">Select year</option>
                    {gradYears.map((year) => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="highSchool" className="block text-sm font-bold mb-2 uppercase">High School</label>
                  <input type="text" id="highSchool" name="highSchool" value={athleteData.highSchool} onChange={handleAthleteChange}
                    className={inputClass} placeholder="Lincoln High School" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-bold mb-2 uppercase">City</label>
                  <input type="text" id="city" name="city" value={athleteData.city} onChange={handleAthleteChange}
                    className={inputClass} placeholder="San Francisco" />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-bold mb-2 uppercase">State</label>
                  <select id="state" name="state" value={athleteData.state} onChange={handleAthleteChange} className={selectClass}>
                    <option value="">Select state</option>
                    {states.map((state) => (<option key={state} value={state}>{state}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 border-4 border-red-600 bg-red-50 text-red-700 font-bold">
              {error}
            </div>
          )}

          {/* Form buttons */}
          <div className="mt-8 flex gap-4">
            {currentStep === 2 && (
              <button type="button" onClick={handleBack}
                className="flex-1 py-3 px-6 border-4 border-black bg-white text-black font-bold font-mono hover:bg-gray-100 transition">
                Back
              </button>
            )}
            <button
              type={currentStep === 1 ? 'button' : 'submit'}
              onClick={currentStep === 1 ? handleNext : undefined}
              disabled={isLoading}
              className={`flex-1 py-3 px-6 border-4 border-black font-bold font-mono transition ${
                isLoading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isLoading ? 'Creating account...' : currentStep === 1 ? 'Next →' : 'Complete Signup →'}
            </button>
          </div>
        </form>
      </div>

      {/* Info section */}
      <div className="max-w-2xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: 'Secure', desc: 'Your data is encrypted and safe' },
          { title: 'Instant', desc: 'Start receiving outreach immediately' },
          { title: 'Simple', desc: 'Manage everything from your phone' },
        ].map((item, idx) => (
          <div key={idx} className="text-center border-4 border-black p-6">
            <h4 className="font-bold mb-1">{item.title}</h4>
            <p className="text-sm" style={{ color: '#666' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
