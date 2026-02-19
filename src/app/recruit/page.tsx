'use client'

import Link from 'next/link'

export default function RecruitLandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-mono form-page">
      {/* Hero */}
      <section className="py-20 px-6 sm:px-12 lg:px-32 text-center">
        <div className="bg-black text-white p-16 mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
            Get Recruited. Automatically.
          </h2>
        </div>

        <p className="text-xl sm:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
          Let LocalHustle handle the outreach. We connect your athlete with college coaches
          across the country — emails, DMs, and follow-ups on autopilot.
        </p>

        <Link
          href="/recruit/signup"
          className="btn-fixed-200"
        >
          Sign Up Your Athlete
        </Link>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm" style={{ color: '#666' }}>
          <span>Coaches in all 50 states</span>
          <span>100% automated outreach</span>
          <span>Real-time response tracking</span>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 sm:px-12 lg:px-32 bg-gray-50">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          How It Works
        </h2>

        <div className="max-w-4xl mx-auto space-y-12">
          {[
            { step: '1', title: 'Create Profile', desc: "Enter your athlete's information: stats, highlights, and achievements." },
            { step: '2', title: 'Connect X Account', desc: 'Link their X (Twitter) account so we can amplify their visibility.' },
            { step: '3', title: 'We Handle Outreach', desc: 'Our agents automatically reach out to coaches and track all responses.' },
          ].map((item) => (
            <div key={item.step} className="bg-white p-8 border-4 border-black flex gap-6 items-start">
              <div className="bg-black text-white w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-lg" style={{ color: '#666' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 sm:px-12 lg:px-32">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          Why Choose LocalHustle?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {[
            { title: 'Smart Targeting', desc: 'Our system identifies coaches looking for athletes in your position and level.' },
            { title: 'Always On', desc: 'Your profile works 24/7, reaching coaches while you sleep.' },
            { title: 'Response Tracking', desc: 'See every response, track sentiment, and manage conversations.' },
            { title: 'Real Connections', desc: 'No spam. We connect athletes with coaches who are genuinely interested.' },
          ].map((feature, idx) => (
            <div key={idx} className="bg-green-100 p-8 border-4 border-green-600">
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p style={{ color: '#333' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 sm:px-12 lg:px-32 text-center bg-gray-50">
        <h2 className="text-3xl font-bold mb-6">Ready to get your athlete recruited?</h2>
        <p className="text-lg mb-8" style={{ color: '#666' }}>
          Join athletes already getting responses from coaches across D1, D2, NAIA, and JUCO.
        </p>
        <Link href="/recruit/signup" className="btn-fixed-200">
          Get Started Now
        </Link>
      </section>
    </div>
  )
}
