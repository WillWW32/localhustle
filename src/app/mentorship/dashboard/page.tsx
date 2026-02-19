'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Mentor {
  id: string
  name: string
  sport: string
  college: string
  bio: string
  status: string
}

interface Session {
  id: string
  mentor_id: string
  athlete_id: string
  scheduled_at: string | null
  status: string
  notes: string
  mentors?: { name: string; sport: string; college: string }
}

export default function MentorshipDashboardPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'browse' | 'sessions'>('browse')
  const [sportFilter, setSportFilter] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [mentorRes, sessionRes] = await Promise.all([
          fetch('/api/mentorship/mentors'),
          fetch('/api/mentorship/sessions'),
        ])
        const mentorData = await mentorRes.json()
        const sessionData = await sessionRes.json()
        if (Array.isArray(mentorData)) setMentors(mentorData)
        if (Array.isArray(sessionData)) setSessions(sessionData)
      } catch (err) {
        console.error('Failed to load mentorship data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredMentors = sportFilter === 'all'
    ? mentors
    : mentors.filter(m => m.sport === sportFilter)

  const sports = [...new Set(mentors.map(m => m.sport))].sort()

  const getStatusBadge = (status: string) => {
    if (status === 'confirmed') return 'dash-badge-green'
    if (status === 'completed') return 'dash-badge-green'
    if (status === 'cancelled') return 'dash-badge'
    return 'dash-badge-yellow'
  }

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    fontWeight: 'bold',
    fontSize: '0.875rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: activeView === tab ? 'black' : 'transparent',
    color: activeView === tab ? 'black' : '#999',
    fontFamily: 'Courier New, Courier, monospace',
  })

  return (
    <div className="dashboard-container" style={{ padding: '0 1rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 0', borderBottom: '3px solid black', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mentorship</h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>Connect with college athlete mentors</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #eee', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveView('browse')} style={tabStyle('browse')}>Browse Mentors</button>
        <button onClick={() => setActiveView('sessions')} style={tabStyle('sessions')}>My Sessions</button>
      </div>

      {loading ? (
        <div className="dash-empty">Loading...</div>
      ) : activeView === 'browse' ? (
        <div>
          {/* Sport Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{filteredMentors.length} mentors available</p>
            <select
              value={sportFilter}
              onChange={e => setSportFilter(e.target.value)}
              className="dash-input"
              style={{ width: 'auto' }}
            >
              <option value="all">All Sports</option>
              {sports.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filteredMentors.length === 0 ? (
            <div className="dash-empty">
              <p style={{ marginBottom: '1rem' }}>No mentors available yet.</p>
              <Link href="/mentorship/signup" className="dash-btn">Become the First Mentor</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredMentors.map(mentor => (
                <div key={mentor.id} className="dash-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                          {mentor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1rem', marginBottom: '0.125rem' }}>{mentor.name}</h3>
                          <p style={{ color: 'green', fontWeight: 'bold', fontSize: '0.875rem', marginBottom: 0 }}>
                            {mentor.sport} &bull; {mentor.college}
                          </p>
                        </div>
                      </div>
                      {mentor.bio && (
                        <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                          {mentor.bio.length > 150 ? mentor.bio.slice(0, 150) + '...' : mentor.bio}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontWeight: 'bold', color: 'green', fontSize: '1.25rem', marginBottom: '0.25rem' }}>$35</p>
                      <p style={{ color: '#999', fontSize: '0.625rem', marginBottom: 0 }}>per session</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {sessions.length === 0 ? (
            <div className="dash-empty">
              <p style={{ marginBottom: '1rem' }}>No sessions yet.</p>
              <button onClick={() => setActiveView('browse')} className="dash-btn">Browse Mentors</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.map(session => (
                <div key={session.id} className="dash-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {session.mentors?.name || 'Mentor'}
                      </p>
                      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {session.mentors?.sport} &bull; {session.mentors?.college}
                      </p>
                      {session.scheduled_at && (
                        <p style={{ color: '#999', fontSize: '0.75rem', marginBottom: 0 }}>
                          {new Date(session.scheduled_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className={getStatusBadge(session.status)}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                  {session.notes && (
                    <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                      {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
