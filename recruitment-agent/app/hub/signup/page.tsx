'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

type FormStep = 1 | 2;

interface ParentFormData {
  name: string;
  email: string;
  phone: string;
}

interface AthleteFormData {
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  height: string;
  weight: string;
  gradYear: string;
  highSchool: string;
  city: string;
  state: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parentData, setParentData] = useState<ParentFormData>({
    name: '',
    email: '',
    phone: '',
  });

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
  });

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAthleteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAthleteData((prev) => ({ ...prev, [name]: value }));
  };

  const validateParentForm = () => {
    if (!parentData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!parentData.email.trim() || !parentData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (!parentData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    return true;
  };

  const validateAthleteForm = () => {
    if (!athleteData.firstName.trim()) {
      setError("Please enter athlete's first name");
      return false;
    }
    if (!athleteData.lastName.trim()) {
      setError("Please enter athlete's last name");
      return false;
    }
    if (!athleteData.sport) {
      setError('Please select a sport');
      return false;
    }
    if (!athleteData.position.trim()) {
      setError('Please enter position');
      return false;
    }
    if (!athleteData.height.trim()) {
      setError('Please enter height');
      return false;
    }
    if (!athleteData.weight.trim()) {
      setError('Please enter weight');
      return false;
    }
    if (!athleteData.gradYear) {
      setError('Please select graduation year');
      return false;
    }
    if (!athleteData.highSchool.trim()) {
      setError('Please enter high school');
      return false;
    }
    if (!athleteData.city.trim()) {
      setError('Please enter city');
      return false;
    }
    if (!athleteData.state) {
      setError('Please select state');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (validateParentForm()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAthleteForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/hub/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: parentData,
          athlete: athleteData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }

      const data = await response.json();
      router.push('/hub/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const sports = [
    'Football',
    'Basketball',
    'Baseball',
    'Soccer',
    'Lacrosse',
    'Volleyball',
    'Tennis',
    'Cross Country',
    'Track & Field',
    'Swimming',
    'Golf',
    'Softball',
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  const currentYear = new Date().getFullYear();
  const gradYears = Array.from({ length: 8 }, (_, i) => (currentYear + i).toString());

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <Link href="/hub" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">Get Your Athlete Recruited</h1>
        <p className="text-slate-400">
          Fill out this quick form and we'll start reaching out to coaches.
        </p>
      </div>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-4 mb-4">
          <div
            className={`flex-1 h-2 rounded-full transition-colors ${
              currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          />
          <div
            className={`flex-1 h-2 rounded-full transition-colors ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          />
        </div>
        <p className="text-sm text-slate-400">
          Step {currentStep} of 2
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg p-8 border border-slate-700">
        <form onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Parent/Guardian Information</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={parentData.name}
                  onChange={handleParentChange}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={parentData.email}
                  onChange={handleParentChange}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={parentData.phone}
                  onChange={handleParentChange}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Athlete Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={athleteData.firstName}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Alex"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={athleteData.lastName}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Johnson"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="sport" className="block text-sm font-medium mb-2">
                    Sport
                  </label>
                  <select
                    id="sport"
                    name="sport"
                    value={athleteData.sport}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="">Select a sport</option>
                    {sports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={athleteData.position}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Quarterback"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium mb-2">
                    Height
                  </label>
                  <input
                    type="text"
                    id="height"
                    name="height"
                    value={athleteData.height}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    placeholder="6'2\""
                  />
                </div>

                <div>
                  <label htmlFor="weight" className="block text-sm font-medium mb-2">
                    Weight (lbs)
                  </label>
                  <input
                    type="text"
                    id="weight"
                    name="weight"
                    value={athleteData.weight}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    placeholder="210"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="gradYear" className="block text-sm font-medium mb-2">
                    Graduation Year
                  </label>
                  <select
                    id="gradYear"
                    name="gradYear"
                    value={athleteData.gradYear}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="">Select year</option>
                    {gradYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="highSchool" className="block text-sm font-medium mb-2">
                    High School
                  </label>
                  <input
                    type="text"
                    id="highSchool"
                    name="highSchool"
                    value={athleteData.highSchool}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Lincoln High School"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={athleteData.city}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium mb-2">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={athleteData.state}
                    onChange={handleAthleteChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Form buttons */}
          <div className="mt-8 flex gap-4">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-6 py-3 border border-slate-600 rounded-lg text-white hover:bg-slate-700 transition font-medium"
              >
                Back
              </button>
            )}

            <button
              type={currentStep === 1 ? 'button' : 'submit'}
              onClick={currentStep === 1 ? handleNext : undefined}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition ${
                isLoading
                  ? 'bg-blue-600/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Creating account...' : currentStep === 1 ? 'Next' : 'Complete Signup'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </div>
        </form>
      </div>

      {/* Info section */}
      <div className="max-w-2xl mx-auto mt-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: '🔒', title: 'Secure', desc: 'Your data is encrypted and safe' },
          { icon: '⚡', title: 'Instant', desc: 'Start receiving outreach immediately' },
          { icon: '📱', title: 'Simple', desc: 'Manage everything from your phone' },
        ].map((item, idx) => (
          <div key={idx} className="text-center text-slate-400">
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-semibold text-white mb-1">{item.title}</h3>
            <p className="text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
