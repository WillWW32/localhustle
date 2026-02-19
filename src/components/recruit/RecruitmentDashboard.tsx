'use client'

import React, { useState, useEffect } from 'react'

interface StatsData {
  emailsSent: number
  emailsToday: number
  dmsSent: number
  dmsToday: number
  responsesReceived: number
  responseRate: number
}

interface ActivityItem {
  id: string
  coachName: string
  school: string
  division: string
  timestamp: string
  type: 'email' | 'dm'
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed'
  preview: string
  fullMessage?: string
}

interface ResponseItem {
  id: string
  coachName: string
  school: string
  date: string
  preview: string
  sentiment: 'positive' | 'neutral' | 'negative'
  forwarded: boolean
  fullMessage: string
}

interface Coach {
  id: string
  name: string
  school: string
  division: string
  state: string
  email: string
  status: 'pending' | 'sent' | 'contacted'
}

interface RecruitmentDashboardProps {
  campaignId: string
}

export default function RecruitmentDashboard({ campaignId }: RecruitmentDashboardProps) {

  const [stats, setStats] = useState<StatsData>({
    emailsSent: 0, emailsToday: 0, dmsSent: 0, dmsToday: 0, responsesReceived: 0, responseRate: 0,
  })

  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null)
  const [batchSize, setBatchSize] = useState(25)
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [divisionFilter, setDivisionFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/recruit/stats?campaignId=${campaignId}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load stats')
    }
  }

  const fetchCoaches = async () => {
    try {
      const response = await fetch(`/api/recruit/coaches?campaignId=${campaignId}&contacted=false`)
      if (!response.ok) throw new Error('Failed to fetch coaches')
      const data = await response.json()
      setCoaches(data.slice(0, 20))
    } catch (err) {
      console.error('Error fetching coaches:', err)
    }
  }

  const fetchResponses = async () => {
    try {
      const response = await fetch(`/api/recruit/responses?campaignId=${campaignId}`)
      if (!response.ok) throw new Error('Failed to fetch responses')
      const data = await response.json()
      setResponses(data)
    } catch (err) {
      console.error('Error fetching responses:', err)
    }
  }

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/recruit/stats?campaignId=${campaignId}&includeMessages=true`)
      if (!response.ok) throw new Error('Failed to fetch activity')
      const data = await response.json()
      if (data.recentMessages) {
        setActivity(data.recentMessages.map((m: Record<string, string>) => ({
          id: m.id,
          coachName: m.coach_name || 'Unknown Coach',
          school: m.school || '',
          division: m.division || '',
          timestamp: m.sent_at || m.created_at,
          type: m.type === 'dm' ? 'dm' as const : 'email' as const,
          status: m.status || 'sent',
          preview: (m.body || '').slice(0, 80) + ((m.body || '').length > 80 ? '...' : ''),
          fullMessage: m.body,
        })))
      }
    } catch (err) {
      console.error('Error fetching activity:', err)
      setActivity([])
    }
  }

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchCoaches(), fetchResponses(), fetchActivity()])
      setLoading(false)
    }
    loadDashboard()
  }, [])

  useEffect(() => {
    if (!isSending) return
    const interval = setInterval(() => {
      fetchStats()
      fetchActivity()
      setSendProgress((prev) => {
        if (prev >= 100) { setIsSending(false); return 0 }
        return prev + Math.random() * 15
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [isSending])

  const handleBatchSend = async () => {
    setIsSending(true)
    setSendProgress(0)
    try {
      const response = await fetch('/api/recruit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, batchSize }),
      })
      if (!response.ok) throw new Error('Failed to start batch send')

      const progressInterval = setInterval(() => {
        setSendProgress((prev) => {
          if (prev >= 100) { clearInterval(progressInterval); setIsSending(false); fetchStats(); fetchActivity(); return 100 }
          return prev + Math.random() * 20
        })
      }, 500)
    } catch (err) {
      console.error('Error starting batch send:', err)
      setIsSending(false)
      setError('Failed to start batch send')
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { sent: 'Sent', delivered: 'Delivered', opened: 'Opened', replied: 'Replied', failed: 'Failed', pending: 'Pending', contacted: 'Contacted' }
    return labels[status] || status
  }

  const getSentimentStyle = (sentiment: string): React.CSSProperties => {
    if (sentiment === 'positive') return { color: 'green' }
    if (sentiment === 'negative') return { color: 'red' }
    return { color: '#666' }
  }

  const filteredCoaches = divisionFilter === 'all' ? coaches : coaches.filter((c) => c.division === divisionFilter)

  if (loading) return <div className="dash-empty">Loading recruitment dashboard...</div>

  return (
    <div>
      {error && (
        <div style={{ padding: '0.75rem 1rem', border: '3px solid red', background: '#fff5f5', color: 'red', marginBottom: '1rem', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Emails Sent', value: stats.emailsSent, sub: `${stats.emailsToday} today` },
          { label: 'DMs Sent', value: stats.dmsSent, sub: `${stats.dmsToday} today` },
          { label: 'Responses', value: stats.responsesReceived, sub: 'coaches' },
          { label: 'Rate', value: `${stats.responseRate.toFixed(1)}%`, sub: 'conversion' },
        ].map((s, i) => (
          <div key={i} className="dash-card" style={{ textAlign: 'center' }}>
            <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.125rem' }}>{s.value}</p>
            <p style={{ color: '#999', fontSize: '0.625rem', marginBottom: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Action Panel */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Send Batch Campaign</h3>
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#999', display: 'block', marginBottom: '0.25rem' }}>Batch Size</label>
            <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} disabled={isSending} className="dash-input">
              <option value={10}>10 coaches</option>
              <option value={25}>25 coaches</option>
              <option value={50}>50 coaches</option>
              <option value={100}>100 coaches</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#999', display: 'block', marginBottom: '0.25rem' }}>Status</label>
            <div className="dash-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSending ? '#b45309' : '#999' }} />
              {isSending ? 'Sending...' : 'Ready'}
            </div>
          </div>
        </div>

        {isSending && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Progress</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{Math.round(sendProgress)}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${sendProgress}%` }} />
            </div>
          </div>
        )}

        <button onClick={handleBatchSend} disabled={isSending} className="dash-btn" style={{ width: '100%' }}>
          {isSending ? 'Sending Campaign...' : 'Send Batch'}
        </button>
      </div>

      {/* Recent Activity */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {activity.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>No activity yet</p>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                onClick={() => setExpandedActivityId(expandedActivityId === item.id ? null : item.id)}
                style={{ padding: '0.75rem', border: '2px solid #eee', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{item.coachName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#999' }}>{item.school}</span>
                  </div>
                  <span className="dash-badge">{getStatusLabel(item.status)}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: 0 }}>{item.preview}</p>
                {expandedActivityId === item.id && item.fullMessage && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
                    <p style={{ fontSize: '0.875rem', color: '#333', whiteSpace: 'pre-wrap', marginBottom: '0.25rem' }}>{item.fullMessage}</p>
                    <p style={{ fontSize: '0.625rem', color: '#999', marginBottom: 0 }}>{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Responses */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Coach Responses ({responses.length})</h3>
        {responses.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>No responses yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {responses.map((response) => (
              <div key={response.id} style={{ padding: '0.75rem', border: '2px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.125rem' }}>{response.coachName}</p>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{response.school}</p>
                  </div>
                  <span style={{ ...getSentimentStyle(response.sentiment), fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {response.sentiment}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#333', marginBottom: '0.5rem' }}>{response.preview}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.625rem', color: '#999' }}>{response.date}</span>
                  {response.forwarded ? (
                    <span className="dash-badge-green" style={{ fontSize: '0.625rem' }}>Forwarded</span>
                  ) : (
                    <button className="dash-btn-sm">Forward</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coach Queue */}
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 0 }}>Coach Queue (Next 20)</h3>
          <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)} className="dash-input" style={{ width: 'auto' }}>
            <option value="all">All</option>
            <option value="D1">D1</option>
            <option value="D2">D2</option>
            <option value="NAIA">NAIA</option>
            <option value="JUCO">JUCO</option>
          </select>
        </div>
        {filteredCoaches.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>No coaches in queue</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>School</th>
                  <th>Div</th>
                  <th>State</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoaches.map((coach) => (
                  <tr key={coach.id}>
                    <td style={{ fontWeight: 'bold' }}>{coach.name}</td>
                    <td>{coach.school}</td>
                    <td><span className="dash-badge">{coach.division}</span></td>
                    <td>{coach.state}</td>
                    <td><span className="dash-badge">{getStatusLabel(coach.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
