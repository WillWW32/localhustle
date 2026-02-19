'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface AthleteProfile {
  slug: string
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
  bio: string
  stats: Record<string, string>
  achievements: string[]
  highlightUrl: string
  viewCount: number
  isPrivate: boolean
  athleteId: string
}

interface ScoutingReportSummary {
  overall_score: number
  division_projection: string
  stars: number | null
}

export default function PublicAthleteProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null)
  const [scoutingReport, setScoutingReport] = useState<ScoutingReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [coachLetters, setCoachLetters] = useState<{ id: string; coachName: string; school: string; letterText: string; uploadedAt: string }[]>([])

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        // Load athlete profile by slug
        const { data: profile } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('slug', slug)
          .single()

        if (!profile) {
          setLoading(false)
          return
        }

        // Load athlete data
        const { data: athleteRow } = await supabase
          .from('athletes')
          .select('*')
          .eq('id', profile.athlete_id)
          .single()

        if (!athleteRow) {
          setLoading(false)
          return
        }

        // Increment view count
        await supabase
          .from('athlete_profiles')
          .update({ views: (profile.views || 0) + 1 })
          .eq('id', profile.id)

        setAthlete({
          slug,
          firstName: athleteRow.first_name,
          lastName: athleteRow.last_name,
          sport: athleteRow.sport || '',
          position: athleteRow.position || '',
          height: athleteRow.height || '',
          weight: athleteRow.weight || '',
          gradYear: athleteRow.grad_year || '',
          highSchool: athleteRow.high_school || '',
          city: athleteRow.city || '',
          state: athleteRow.state || '',
          bio: athleteRow.bio || profile.about || '',
          stats: athleteRow.stats || {},
          achievements: profile.achievements || [],
          highlightUrl: athleteRow.highlight_url || '',
          viewCount: (profile.views || 0) + 1,
          isPrivate: profile.visibility === 'private',
          athleteId: athleteRow.id,
        })

        // Load scouting report summary if exists
        const { data: report } = await supabase
          .from('scouting_reports')
          .select('report')
          .eq('athlete_id', athleteRow.id)
          .single()

        if (report?.report) {
          setScoutingReport({
            overall_score: report.report.overall_score,
            division_projection: report.report.division_projection,
            stars: report.report.stars || null,
          })
        }

        // Load coach letters
        const { data: letters } = await supabase
          .from('coach_letters')
          .select('*')
          .eq('athlete_id', athleteRow.id)
          .order('created_at', { ascending: false })

        if (letters) {
          setCoachLetters(letters.map(l => ({
            id: l.id,
            coachName: l.coach_name,
            school: l.school,
            letterText: l.letter_text,
            uploadedAt: l.created_at,
          })))
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black font-mono flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-white text-black font-mono flex items-center justify-center px-4">
        <div className="text-center">
          <h1 style={{ fontSize: '2rem' }}>Profile Not Found</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>This athlete profile does not exist.</p>
          <a href="/recruit" style={{ color: 'green', fontWeight: 'bold' }}>Return to Recruit</a>
        </div>
      </div>
    )
  }

  if (athlete.isPrivate) {
    return (
      <div className="min-h-screen bg-white text-black font-mono flex items-center justify-center px-4">
        <div className="text-center">
          <h1 style={{ fontSize: '2rem' }}>Profile Not Found</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>This athlete profile is private.</p>
          <a href="/recruit" style={{ color: 'green', fontWeight: 'bold' }}>Return to Recruit</a>
        </div>
      </div>
    )
  }

  const handleShare = (platform: string) => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : ''
    const text = `Check out ${athlete.firstName} ${athlete.lastName}, a talented ${athlete.sport} prospect!`
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      copy: profileUrl,
    }
    if (platform === 'copy') {
      navigator.clipboard.writeText(profileUrl)
      setShowShareMenu(false)
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=550,height=420')
      setShowShareMenu(false)
    }
  }

  const getDivisionLabel = (projection: string) => {
    const labels: Record<string, string> = {
      'D1-Major': 'D1 Major Conference',
      'D1-Mid': 'D1 Mid-Major',
      'D1-Small': 'D1 Small Conference',
      'D2': 'Division II',
      'D3': 'Division III',
      'NAIA': 'NAIA',
      'JUCO': 'Junior College',
    }
    return labels[projection] || projection
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header */}
      <header style={{ borderBottom: '3px solid black', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/recruit" style={{ fontWeight: 'bold', color: 'black', textDecoration: 'none', fontSize: '1.25rem' }}>
          LocalHustle
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#999', fontSize: '0.875rem' }}>{athlete.viewCount} views</span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              style={{ background: 'black', color: 'white', border: 'none', padding: '0.5rem 1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Share
            </button>
            {showShareMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem', border: '3px solid black', background: 'white', zIndex: 10, minWidth: '180px' }}>
                <button onClick={() => handleShare('twitter')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', borderBottom: '1px solid #eee', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Share on X
                </button>
                <button onClick={() => handleShare('facebook')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', borderBottom: '1px solid #eee', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Share on Facebook
                </button>
                <button onClick={() => handleShare('copy')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Scouting Report Banner (if available) */}
        {scoutingReport && (
          <div style={{ border: '4px solid green', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 'bold', color: 'green', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>AI Scouting Report</p>
              <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                {getDivisionLabel(scoutingReport.division_projection)}
                {scoutingReport.stars && ` ${'★'.repeat(scoutingReport.stars)}`}
              </p>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>Overall Score: {scoutingReport.overall_score}/100</p>
            </div>
            <a
              href={`/recruit/dashboard/athletes/${athlete.athleteId}/scouting-report`}
              style={{ background: 'green', color: 'white', padding: '0.5rem 1rem', fontWeight: 'bold', textDecoration: 'none', fontFamily: 'inherit' }}
            >
              View Full Report
            </a>
          </div>
        )}

        {/* Hero Section */}
        <div style={{ border: '4px solid black', padding: '2rem', marginBottom: '2rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div style={{ width: '120px', height: '120px', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                {athlete.firstName.charAt(0)}{athlete.lastName.charAt(0)}
              </div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{athlete.firstName} {athlete.lastName}</h1>
              <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {athlete.sport} &bull; {athlete.position}
              </p>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {athlete.highSchool} &bull; Class of {athlete.gradYear}
              </p>
              <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: 0 }}>
                {athlete.city}, {athlete.state}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="sm:col-span-2">
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: '#999' }}>Season Stats</h3>
              {Object.keys(athlete.stats).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(athlete.stats).map(([key, value]) => (
                    <div key={key} style={{ border: '3px solid black', padding: '0.75rem', textAlign: 'center' }}>
                      <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{key}</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'green', marginBottom: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999' }}>No stats added yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ marginBottom: '2rem' }}>
          {/* Left — Video and Bio */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Highlight Video */}
            {athlete.highlightUrl && (
              <div style={{ border: '4px solid black' }}>
                <div style={{ background: '#f5f5f5', padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: '#666', marginBottom: '0.75rem' }}>Game Highlights</p>
                  <a href={athlete.highlightUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontWeight: 'bold' }}>
                    Watch Full Video on HUDL &rarr;
                  </a>
                </div>
              </div>
            )}

            {/* Bio */}
            {athlete.bio && (
              <div style={{ border: '4px solid black', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>About</h2>
                <p style={{ color: '#333', lineHeight: 1.7 }}>{athlete.bio}</p>
              </div>
            )}

            {/* Coach Letters */}
            {coachLetters.length > 0 && (
              <div style={{ border: '4px solid black', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Letters from Coaches</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {coachLetters.map(letter => (
                    <div key={letter.id} style={{ border: '2px solid #eee', padding: '1rem', background: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <p style={{ fontWeight: 'bold', marginBottom: '0.125rem' }}>{letter.coachName}</p>
                          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{letter.school}</p>
                        </div>
                        <span style={{ color: '#999', fontSize: '0.75rem' }}>{new Date(letter.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ color: '#333', fontSize: '0.875rem', whiteSpace: 'pre-wrap', marginBottom: 0 }}>{letter.letterText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Achievements */}
          <div>
            {athlete.achievements.length > 0 && (
              <div style={{ border: '4px solid black', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Achievements</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {athlete.achievements.map((achievement, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', background: '#f5f5f5', border: '2px solid #eee' }}>
                      <span style={{ color: 'green', fontWeight: 'bold', flexShrink: 0 }}>&#10003;</span>
                      <span style={{ fontSize: '0.875rem', color: '#333' }}>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* For Coaches */}
        <div style={{ border: '4px solid black', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="bg-black text-white p-4 mb-4" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem', marginTop: '-1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>For Coaches</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Position Fit</h3>
              <p style={{ color: '#666', fontSize: '0.875rem' }}>
                {athlete.sport} {athlete.position} with proven ability.
                {athlete.height && ` ${athlete.height}`}{athlete.weight && `, ${athlete.weight} lbs.`}
              </p>
            </div>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Recruitment Status</h3>
              <p style={{ color: '#666', fontSize: '0.875rem' }}>
                Actively being recruited. Interested in schools with strong academic programs.
              </p>
            </div>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Contact</h3>
              <p style={{ color: '#666', fontSize: '0.875rem' }}>
                Interested coaches can connect through the LocalHustle platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '3px solid black', padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.75rem' }}>
        &copy; {new Date().getFullYear()} LocalHustle. Connecting athletes with coaches.
      </footer>
    </div>
  )
}
