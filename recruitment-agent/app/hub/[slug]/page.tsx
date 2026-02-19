'use client';

import { useState } from 'react';
import { Share2, Eye, ExternalLink, Award } from 'lucide-react';

interface AthleteProfile {
  slug: string;
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
  bio: string;
  stats: Record<string, string>;
  achievements: string[];
  highlightUrl: string;
  viewCount: number;
  isPrivate: boolean;
}

export default function PublicAthleteProfilePage({ params }: { params: { slug: string } }) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Mock athlete data - in production this would be fetched from the database
  const athlete: AthleteProfile = {
    slug: params.slug,
    firstName: 'Alex',
    lastName: 'Johnson',
    sport: 'Football',
    position: 'Quarterback',
    height: "6'2\"",
    weight: '210 lbs',
    gradYear: '2025',
    highSchool: 'Lincoln High School',
    city: 'San Francisco',
    state: 'CA',
    bio: 'Elite quarterback with excellent arm strength, field vision, and leadership abilities. Strong academics (4.0 GPA) and community involvement. Looking for schools where I can contribute immediately and grow as a student-athlete.',
    stats: {
      'Passing Yards': '4,200',
      'Touchdowns': '45',
      'Completion %': '72%',
      'Rushing Yards': '520',
      'GPA': '4.0',
    },
    achievements: [
      'First Team All-League (2024)',
      'Academic All-State (2024)',
      'Team Captain (2024)',
      'State Tournament Selection (2023)',
      'All-Bay Area Honors (2024)',
    ],
    highlightUrl: 'https://www.hudl.com/profile/123456',
    viewCount: 284,
    isPrivate: false,
  };

  if (athlete.isPrivate) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-slate-400 mb-6">This athlete profile is private.</p>
          <a href="/hub" className="text-blue-400 hover:text-blue-300">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  const handleShare = (platform: string) => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${athlete.firstName} ${athlete.lastName}, a talented ${athlete.sport} prospect!`;

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=550,height=420');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/hub" className="text-2xl font-bold">
            <span className="text-blue-500">Local</span>Hustle
          </a>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Eye size={16} />
              <span>{athlete.viewCount} views</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                <Share2 size={18} />
                Share
              </button>

              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
                  <button
                    onClick={() => {
                      handleShare('twitter');
                      setShowShareMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-700 transition first:rounded-t-lg"
                  >
                    Share on X/Twitter
                  </button>
                  <button
                    onClick={() => {
                      handleShare('facebook');
                      setShowShareMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-700 transition"
                  >
                    Share on Facebook
                  </button>
                  <button
                    onClick={() => {
                      handleShare('linkedin');
                      setShowShareMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-700 transition last:rounded-b-lg"
                  >
                    Share on LinkedIn
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        typeof window !== 'undefined' ? window.location.href : ''
                      );
                      setShowShareMenu(false);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-700 transition last:rounded-b-lg border-t border-slate-700"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section - Athlete Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg p-8 border border-slate-700 mb-12">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Photo and basic info */}
            <div>
              <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-6xl font-bold">
                  {athlete.firstName.charAt(0)}{athlete.lastName.charAt(0)}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{athlete.firstName} {athlete.lastName}</h1>
              <p className="text-xl text-cyan-400 mb-3">
                {athlete.sport} • {athlete.position}
              </p>
              <p className="text-slate-300">
                {athlete.highSchool} • Class of {athlete.gradYear}
              </p>
              <p className="text-slate-400 text-sm mt-2">
                📍 {athlete.city}, {athlete.state}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold mb-4">Season Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(athlete.stats).map(([key, value]) => (
                  <div key={key} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs font-semibold mb-1">{key}</p>
                    <p className="text-2xl font-bold text-cyan-400">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Video and Bio */}
          <div className="lg:col-span-2 space-y-8">
            {/* Highlight Video */}
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <div className="bg-slate-900 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 mb-3">Game Highlights</p>
                  <a
                    href={athlete.highlightUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition font-semibold"
                  >
                    Watch Full Video on HUDL
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <p className="text-slate-300 leading-relaxed">{athlete.bio}</p>
            </div>
          </div>

          {/* Right Column - Achievements */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award size={20} className="text-yellow-500" />
                Achievements
              </h2>
              <div className="space-y-3">
                {athlete.achievements.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-700"
                  >
                    <span className="text-yellow-500 font-bold flex-shrink-0">✓</span>
                    <span className="text-slate-300 text-sm">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coaching Prospect Info */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-12">
          <h2 className="text-2xl font-bold mb-6">For Coaches</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-slate-300 mb-2">Position Fit</h3>
              <p className="text-slate-400">
                Elite {athlete.sport} prospect with proven leadership and academic excellence.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-300 mb-2">Recruitment Status</h3>
              <p className="text-slate-400">
                Actively being recruited. Interested in schools with strong academic programs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-300 mb-2">Contact</h3>
              <p className="text-slate-400">
                Interested coaches can connect through the LocalHustle platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>&copy; 2024 LocalHustle. Connecting athletes with coaches.</p>
        </div>
      </footer>
    </div>
  );
}
