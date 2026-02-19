'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap, Users, Target } from 'lucide-react';

export default function HubPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="text-blue-500">Local</span>Hustle
          </div>
          <div className="flex items-center gap-6">
            <Link href="/hub/dashboard" className="text-slate-300 hover:text-white transition">
              Dashboard
            </Link>
            <button className="text-slate-300 hover:text-white transition">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Get Recruited. Automatically.
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Let LocalHustle handle the outreach. We connect your athlete with coaches across the country,
            automatically managing communications and tracking responses.
          </p>

          <Link
            href="/hub/signup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition transform hover:scale-105"
          >
            Sign Up Your Athlete
            <ArrowRight size={20} />
          </Link>

          {/* Trust indicators */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>Coaches in all 50 states</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>100% automated outreach</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>Real-time response tracking</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Create Profile',
                description: 'Enter your athlete\'s information: stats, highlights, and achievements.',
                icon: Users,
              },
              {
                step: 2,
                title: 'Connect X Account',
                description: 'Link their X (Twitter) account so we can amplify their visibility.',
                icon: Zap,
              },
              {
                step: 3,
                title: 'We Handle Outreach',
                description: 'Our agents automatically reach out to coaches and track all responses.',
                icon: Target,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  onMouseEnter={() => setHoveredStep(item.step)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={`relative p-8 rounded-lg border transition-all duration-300 ${
                    hoveredStep === item.step
                      ? 'border-blue-500 bg-slate-700/50 transform -translate-y-2'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  {/* Step number */}
                  <div className="absolute -top-6 left-8 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>

                  <Icon className="w-10 h-10 text-cyan-400 mb-4 mt-2" />
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose LocalHustle?</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: 'Smart Targeting',
                description: 'Our AI identifies coaches looking for athletes in your position and level.',
              },
              {
                title: 'Always On',
                description: 'Your profile works 24/7, reaching coaches while you sleep.',
              },
              {
                title: 'Response Tracking',
                description: 'See every response, track sentiment, and manage conversations in one place.',
              },
              {
                title: 'Real Connections',
                description: 'No spam. We connect athletes with coaches who are genuinely interested.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get your athlete recruited?</h2>
          <p className="text-lg text-slate-300 mb-8">
            Join hundreds of athletes already getting responses from coaches.
          </p>
          <Link
            href="/hub/signup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition transform hover:scale-105"
          >
            Get Started Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto text-center text-slate-400 text-sm">
          <p>&copy; 2024 LocalHustle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
