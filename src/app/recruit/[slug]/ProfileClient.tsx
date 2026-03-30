'use client'

import { useState, useEffect } from 'react'
import ReelContainer from '@/components/ReelContainer'

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
  hudlUrl: string
  viewCount: number
  isPrivate: boolean
  athleteId: string
  instagramReels: string[]
  contactEmail: string
  contactPhone: string
  profileImageUrl: string
  parentRelationship: string
}

interface CoachInterest {
  programsContacted: number
  coachResponses: number
  schoolsReached: number
  divisions: string[]
}

interface ScoutingReportSummary {
  overall_score: number
  division_projection: string
  stars: number | null
}

export default function ProfileClient({ slug }: { slug: string }) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null)
  const [coachInterest, setCoachInterest] = useState<CoachInterest | null>(null)
  const [scoutingReport, setScoutingReport] = useState<ScoutingReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [coachLetters, setCoachLetters] = useState<{ id: string; coachName: string; school: string; letterText: string; uploadedAt: string }[]>([])

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/recruit/profile?slug=${encodeURIComponent(slug)}`)
        if (!res.ok) {
          setLoading(false)
          return
        }
        const data = await res.json()

        setAthlete({
          slug,
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          sport: data.profile.sport || '',
          position: data.profile.position || '',
          height: data.profile.height || '',
          weight: data.profile.weight || '',
          gradYear: data.profile.gradYear || '',
          highSchool: data.profile.highSchool || '',
          city: data.profile.city || '',
          state: data.profile.state || '',
          bio: data.profile.bio || '',
          stats: data.profile.stats || {},
          achievements: data.profile.achievements || [],
          highlightUrl: data.profile.highlightUrl || '',
          hudlUrl: data.profile.hudlUrl || '',
          viewCount: data.profile.viewCount || 0,
          isPrivate: data.profile.isPrivate || false,
          athleteId: data.profile.athleteId,
          instagramReels: data.profile.instagramReels || [],
          contactEmail: data.profile.contactEmail || '',
          contactPhone: data.profile.contactPhone || '',
          profileImageUrl: data.profile.profileImageUrl || '',
          parentRelationship: data.profile.parentRelationship || '',
        })

        if (data.coachInterest) {
          setCoachInterest(data.coachInterest)
        }

        if (data.scoutingReport) {
          setScoutingReport(data.scoutingReport)
        }

        if (data.coachLetters) {
          setCoachLetters(data.coachLetters)
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
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999' }}>Loading profile...</p>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Profile Not Found</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>This athlete profile does not exist.</p>
          <a href="/recruit" style={{ color: 'green', fontWeight: 'bold' }}>Return to Recruit</a>
        </div>
      </div>
    )
  }

  if (athlete.isPrivate) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Profile Private</h1>
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
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Courier New', Courier, monospace" }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #eee', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/recruit" style={{ fontWeight: 'bold', color: 'black', textDecoration: 'none', fontSize: '1.125rem' }}>
          LocalHustle
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#999', fontSize: '0.75rem' }}>{athlete.viewCount} views</span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              style={{ background: 'black', color: 'white', border: 'none', borderRadius: '9999px', padding: '0.5rem 1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem' }}
            >
              Share
            </button>
            {showShareMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 10, minWidth: '180px', overflow: 'hidden' }}>
                <button onClick={() => handleShare('twitter')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', borderBottom: '1px solid #f0f0f0', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  Share on X
                </button>
                <button onClick={() => handleShare('facebook')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', borderBottom: '1px solid #f0f0f0', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  Share on Facebook
                </button>
                <button onClick={() => handleShare('copy')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Scouting Report Banner */}
        {scoutingReport && (
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: 'bold', color: 'green', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>AI Scouting Report</p>
              <p style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                {getDivisionLabel(scoutingReport.division_projection)}
                {scoutingReport.stars && ` ${'★'.repeat(scoutingReport.stars)}`}
              </p>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>Overall Score: {scoutingReport.overall_score}/100</p>
            </div>
            <a
              href={`/recruit/dashboard/athletes/${athlete.athleteId}/scouting-report`}
              style={{ background: 'green', color: 'white', padding: '0.5rem 1.25rem', fontWeight: 'bold', textDecoration: 'none', fontFamily: 'inherit', borderRadius: '9999px', fontSize: '0.8rem' }}
            >
              View Full Report
            </a>
          </div>
        )}

        {/* Coach Interest / Social Proof */}
        {coachInterest && coachInterest.programsContacted > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '2rem', color: 'white' }}>
            <p style={{ fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: '#8b9dc3' }}>
              Coach Interest
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.125rem', color: '#4ade80' }}>{coachInterest.programsContacted}</p>
                <p style={{ fontSize: '0.7rem', color: '#8b9dc3', marginBottom: 0 }}>Programs Contacted</p>
              </div>
              {coachInterest.coachResponses > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.125rem', color: '#4ade80' }}>{coachInterest.coachResponses}</p>
                  <p style={{ fontSize: '0.7rem', color: '#8b9dc3', marginBottom: 0 }}>Coach Responses</p>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.125rem', color: '#4ade80' }}>{coachInterest.schoolsReached}</p>
                <p style={{ fontSize: '0.7rem', color: '#8b9dc3', marginBottom: 0 }}>Schools Reached</p>
              </div>
              {coachInterest.divisions.length > 0 && (
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {coachInterest.divisions.map(d => (
                      <span key={d} style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              {athlete.profileImageUrl ? (
                <img src={athlete.profileImageUrl} alt={`${athlete.firstName} ${athlete.lastName}`} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  {athlete.firstName.charAt(0)}{athlete.lastName.charAt(0)}
                </div>
              )}
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
              <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' }}>Season Stats</h3>
              {Object.keys(athlete.stats).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(athlete.stats).map(([key, value]) => (
                    <div key={key} style={{ background: '#f0f0f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
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
          {/* Left — Video, Reels, Bio */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Highlight Video */}
            {athlete.highlightUrl && (
              <div>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Highlight Video</h2>
                {athlete.highlightUrl.includes('drive.google.com') ? (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                    <iframe
                      src={athlete.highlightUrl.replace('/view', '/preview')}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', borderRadius: '12px' }}
                      allow="autoplay"
                      allowFullScreen
                    />
                  </div>
                ) : athlete.highlightUrl.includes('youtube.com') || athlete.highlightUrl.includes('youtu.be') ? (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                    <iframe
                      src={athlete.highlightUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', borderRadius: '12px' }}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: '#666', marginBottom: '0.75rem' }}>Game Highlights</p>
                    <a href={athlete.highlightUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontWeight: 'bold' }}>
                      See Highlights &rarr;
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Hudl Profile */}
            {athlete.hudlUrl && (
              <div>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Hudl Profile</h2>
                <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                  <a href={athlete.hudlUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#FF6B00', fontWeight: 'bold', fontSize: '1rem' }}>
                    View Full Hudl Profile &rarr;
                  </a>
                </div>
              </div>
            )}

            {/* Instagram Reels */}
            {athlete.instagramReels.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Instagram Reels</h2>
                <ReelContainer reels={athlete.instagramReels} />
              </div>
            )}

            {/* Bio */}
            {athlete.bio && (
              <div>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>About</h2>
                <p style={{ color: '#333', lineHeight: 1.7, fontSize: '0.9rem' }}>{athlete.bio}</p>
              </div>
            )}

            {/* Coach Letters */}
            {coachLetters.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Letters from Coaches</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {coachLetters.map(letter => (
                    <div key={letter.id} style={{ background: '#fafafa', borderRadius: '12px', padding: '1.25rem' }}>
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
              <div>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Achievements</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {athlete.achievements.map((achievement, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '8px' }}>
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
        <div style={{ background: '#fafafa', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1.25rem' }}>For Coaches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Position Fit</h3>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
                {athlete.sport} {athlete.position} with proven ability.
                {athlete.height && ` ${athlete.height}`}{athlete.weight && `, ${athlete.weight} lbs.`}
              </p>
            </div>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Recruitment Status</h3>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
                Actively being recruited. Interested in schools with strong academic programs.
              </p>
            </div>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contact</h3>
              {athlete.contactEmail ? (
                <div>
                  <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    {athlete.contactEmail}{athlete.parentRelationship ? ` (${athlete.parentRelationship})` : ''}
                  </p>
                  {athlete.contactPhone && (
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
                      {athlete.contactPhone}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
                  Contact through LocalHustle platform.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #eee', padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '0.75rem' }}>
        &copy; {new Date().getFullYear()} LocalHustle. Connecting athletes with coaches.
      </footer>
    </div>
  )
}
