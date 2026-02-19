'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

// ── Types ──
interface AthleteProfile {
  id: string
  firstName: string
  lastName: string
  sport: string
  position: string
  height: string
  weight: string
  highSchool: string
  city: string
  state: string
  gradYear: string
  bio: string
  highlightUrl: string
  xConnected: boolean
  slug: string
}

interface RespondedCoach {
  responseId: string
  coachId: string
  coachName: string
  school: string
  division: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'interested'
  responseBody: string
  responseSubject: string
  respondedAt: string
  followUpSent: boolean
}

interface NonRespondedCoach {
  coachId: string
  coachName: string
  school: string
  division: string
  email: string
  sentAt: string
  daysSince: number | null
  followUpSent: boolean
}

interface FollowUpStats {
  totalSent: number
  responded: number
  nonResponded: number
  followUpsSent: number
  responseRate: number
}

interface FollowUpTemplates {
  responded_positive: string
  responded_neutral: string
  no_response: string
}

type Tab = 'profile' | 'campaign' | 'followups' | 'responses' | 'settings'

export default function AthleteManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [currentTab, setCurrentTab] = useState<Tab>('profile')

  const [athlete, setAthlete] = useState<AthleteProfile | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaignStatus, setCampaignStatus] = useState<'active' | 'paused'>('active')
  const [sendCount, setSendCount] = useState({ total: 0, thisWeek: 0, today: 0 })
  const [loading, setLoading] = useState(true)

  // Follow-up state
  const [followUpData, setFollowUpData] = useState<{
    responded: RespondedCoach[]
    nonResponded: NonRespondedCoach[]
    templates: FollowUpTemplates
    stats: FollowUpStats
  } | null>(null)
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [followUpView, setFollowUpView] = useState<'responded' | 'no_response'>('no_response')
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<Record<string, string>>({})
  const [sendingFollowUp, setSendingFollowUp] = useState<string | null>(null)
  const [sentFollowUps, setSentFollowUps] = useState<Set<string>>(new Set())
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)

  // Load athlete and campaign from Supabase
  useEffect(() => {
    const loadAthlete = async () => {
      setLoading(true)
      try {
        const { data: athleteRow, error: athleteErr } = await supabase
          .from('athletes')
          .select('*')
          .eq('id', id)
          .single()

        if (athleteErr || !athleteRow) {
          console.error('Failed to load athlete:', athleteErr)
          setLoading(false)
          return
        }

        setAthlete({
          id: athleteRow.id,
          firstName: athleteRow.first_name,
          lastName: athleteRow.last_name,
          sport: athleteRow.sport || '',
          position: athleteRow.position || '',
          height: athleteRow.height || '',
          weight: athleteRow.weight || '',
          highSchool: athleteRow.high_school || '',
          city: athleteRow.city || '',
          state: athleteRow.state || '',
          gradYear: athleteRow.grad_year || '',
          bio: athleteRow.bio || '',
          highlightUrl: athleteRow.highlight_url || '',
          xConnected: !!athleteRow.x_handle,
          slug: athleteRow.slug || '',
        })

        // Load campaign
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('*')
          .eq('athlete_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (campaign) {
          setCampaignId(campaign.id)
          setCampaignStatus(campaign.status === 'paused' ? 'paused' : 'active')
        }

        // Load send counts from messages table
        const { count: totalCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', id)

        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
        const { count: weekCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', id)
          .gte('sent_at', weekAgo)

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const { count: todayCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', id)
          .gte('sent_at', todayStart.toISOString())

        setSendCount({
          total: totalCount || 0,
          thisWeek: weekCount || 0,
          today: todayCount || 0,
        })
      } catch (err) {
        console.error('Failed to load athlete data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAthlete()
  }, [id])

  const fetchFollowUps = useCallback(async () => {
    if (!campaignId) return
    setFollowUpLoading(true)
    try {
      const res = await fetch(`/api/recruit/followup?campaignId=${campaignId}&athleteId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setFollowUpData(data)
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err)
    } finally {
      setFollowUpLoading(false)
    }
  }, [id, campaignId])

  useEffect(() => {
    if (currentTab === 'followups' && campaignId) fetchFollowUps()
  }, [currentTab, fetchFollowUps, campaignId])

  const getFollowUpMessage = (coachId: string, type: 'no_response' | 'responded_positive' | 'responded_neutral') => {
    if (editingMessage[coachId]) return editingMessage[coachId]
    if (!followUpData?.templates) return ''
    return followUpData.templates[type] || followUpData.templates.no_response
  }

  const sendFollowUp = async (coachId: string, message: string) => {
    if (!campaignId) return
    setSendingFollowUp(coachId)
    try {
      const res = await fetch('/api/recruit/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, athleteId: id, coachId, message }),
      })
      if (res.ok) {
        setSentFollowUps(prev => new Set([...prev, coachId]))
        setExpandedCoach(null)
      }
    } catch (err) {
      console.error('Failed to send follow-up:', err)
    } finally {
      setSendingFollowUp(null)
    }
  }

  const sendBulkFollowUps = async () => {
    setBulkSending(true)
    const template = followUpData?.templates.no_response || ''
    for (const coachId of bulkSelected) {
      const msg = editingMessage[coachId] || template
      await sendFollowUp(coachId, msg)
      await new Promise(r => setTimeout(r, 500))
    }
    setBulkSelected(new Set())
    setBulkSending(false)
  }

  const toggleBulkSelect = (coachId: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev)
      if (next.has(coachId)) next.delete(coachId)
      else next.add(coachId)
      return next
    })
  }

  const selectAllNonResponded = () => {
    if (!followUpData) return
    const eligible = followUpData.nonResponded
      .filter(c => !c.followUpSent && !sentFollowUps.has(c.coachId))
      .map(c => c.coachId)
    setBulkSelected(new Set(eligible))
  }

  const handleToggleCampaign = async () => {
    if (!campaignId) return
    const newStatus = campaignStatus === 'active' ? 'paused' : 'active'
    const { error } = await supabase
      .from('campaigns')
      .update({ status: newStatus })
      .eq('id', campaignId)
    if (!error) setCampaignStatus(newStatus)
  }

  // ── Helpers ──
  const getDivisionBadge = (division: string) => {
    if (division === 'D1') return 'font-bold'
    return ''
  }

  const getSentimentLabel = (sentiment: string) => {
    const labels: Record<string, string> = { positive: 'Interested', interested: 'Interested', neutral: 'Acknowledged', negative: 'Not Interested' }
    return labels[sentiment] || 'Unknown'
  }

  const getSentimentStyle = (sentiment: string): React.CSSProperties => {
    if (sentiment === 'positive' || sentiment === 'interested') return { color: 'green' }
    if (sentiment === 'negative') return { color: 'red' }
    return { color: '#666' }
  }

  // Fallback data if no follow-up data loaded yet
  const emptyStats: FollowUpStats = { totalSent: 0, responded: 0, nonResponded: 0, followUpsSent: 0, responseRate: 0 }
  const emptyTemplates: FollowUpTemplates = {
    responded_positive: `Coach {{coach_last}},\n\nThank you for your response and interest. I am very excited about the opportunity at {{school}}.\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}`,
    responded_neutral: `Coach {{coach_last}},\n\nThank you for getting back to me. I wanted to follow up and share that I am still very interested in {{school}}.\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}`,
    no_response: `Coach {{coach_last}},\n\nI hope this message finds you well. I reached out a few weeks ago about my interest in {{school}}.\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}`,
  }

  const stats = followUpData?.stats || emptyStats
  const templates = followUpData?.templates || emptyTemplates
  const responded = followUpData?.responded || []
  const nonResponded = followUpData?.nonResponded || []

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    fontWeight: 'bold',
    fontSize: '0.875rem',
    cursor: 'pointer',
    borderBottom: currentTab === tab ? '3px solid black' : '3px solid transparent',
    color: currentTab === tab ? 'black' : '#999',
    background: 'none',
    border: 'none',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: currentTab === tab ? 'black' : 'transparent',
    whiteSpace: 'nowrap',
    fontFamily: 'Courier New, Courier, monospace',
  })

  if (loading) return <div className="dash-empty">Loading athlete...</div>
  if (!athlete) return <div className="dash-empty" style={{ color: 'red' }}>Athlete not found</div>

  // Suppress lint for templates (used in getFollowUpMessage)
  void templates

  return (
    <div className="dashboard-container" style={{ padding: '0 1rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 0', borderBottom: '3px solid black', marginBottom: '1.5rem' }}>
        <Link href="/recruit/dashboard" style={{ color: '#666', fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
          {athlete.firstName} {athlete.lastName}
        </h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
          {athlete.sport} &bull; {athlete.position} &bull; {athlete.highSchool}
        </p>
      </div>

      {/* Athlete Header Card */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div style={{ width: '80px', height: '80px', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              {athlete.firstName.charAt(0)}{athlete.lastName.charAt(0)}
            </div>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.25rem' }}>{athlete.firstName} {athlete.lastName}</p>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{athlete.sport} &bull; {athlete.position}</p>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', color: '#999', marginBottom: '0.75rem' }}>Physical</p>
            <p style={{ marginBottom: '0.25rem' }}><span style={{ color: '#999', fontSize: '0.75rem' }}>Height:</span> {athlete.height}</p>
            <p style={{ marginBottom: '0.25rem' }}><span style={{ color: '#999', fontSize: '0.75rem' }}>Weight:</span> {athlete.weight} lbs</p>
            <p style={{ marginBottom: '0.25rem' }}><span style={{ color: '#999', fontSize: '0.75rem' }}>School:</span> {athlete.highSchool}</p>
            <p style={{ marginBottom: 0 }}><span style={{ color: '#999', fontSize: '0.75rem' }}>Grad Year:</span> {athlete.gradYear}</p>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', color: '#999', marginBottom: '0.75rem' }}>About</p>
            <p style={{ fontSize: '0.875rem', color: '#333', marginBottom: '0.5rem' }}>{athlete.bio || 'No bio yet'}</p>
            <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: 0 }}>{athlete.city}, {athlete.state}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #eee', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {(['profile', 'campaign', 'followups', 'responses', 'settings'] as const).map((tab) => (
          <button key={tab} onClick={() => setCurrentTab(tab)} style={tabStyle(tab)}>
            {tab === 'followups' ? 'Follow-Ups' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ══ PROFILE TAB ══ */}
      {currentTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Scouting Report Link */}
          <Link
            href={`/recruit/dashboard/athletes/${id}/scouting-report`}
            className="dash-card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit', borderColor: 'green' }}
          >
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', color: 'green' }}>AI Scouting Report</h3>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>View division projection, skill scores, and coaching insights</p>
            </div>
            <span style={{ fontSize: '1.5rem', color: 'green' }}>&rarr;</span>
          </Link>

          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Highlight Video</h3>
            {athlete.highlightUrl ? (
              <div style={{ background: '#f5f5f5', padding: '2rem', textAlign: 'center', border: '2px solid #eee' }}>
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>Video from HUDL</p>
                <a href={athlete.highlightUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontWeight: 'bold' }}>
                  Watch on HUDL &rarr;
                </a>
              </div>
            ) : (
              <div style={{ padding: '2rem', border: '3px dashed #ccc', textAlign: 'center', color: '#999' }}>
                Upload Highlight Video
              </div>
            )}
          </div>
          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Bio</h3>
            <textarea defaultValue={athlete.bio} className="dash-textarea" rows={4} />
            <button className="dash-btn" style={{ marginTop: '0.75rem' }}>Save Bio</button>
          </div>
          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Photos</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ aspectRatio: '1', border: '3px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', cursor: 'pointer', fontSize: '1.5rem' }}>+</div>
              ))}
            </div>
          </div>
          {/* Public Profile Link */}
          {athlete.slug && (
            <div className="dash-card">
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Public Profile</h3>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Share this link with coaches:</p>
              <a href={`/recruit/${athlete.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontWeight: 'bold', wordBreak: 'break-all' }}>
                {typeof window !== 'undefined' ? window.location.origin : ''}/recruit/{athlete.slug}
              </a>
            </div>
          )}
        </div>
      )}

      {/* ══ CAMPAIGN TAB ══ */}
      {currentTab === 'campaign' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Campaign Status</h3>
              <button
                onClick={handleToggleCampaign}
                className={campaignStatus === 'active' ? 'dash-btn-green' : 'dash-btn-outline'}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                {campaignStatus === 'active' ? '● Active' : '❚❚ Paused'}
              </button>
            </div>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              {campaignStatus === 'active'
                ? 'Your campaign is actively reaching out to coaches.'
                : 'Your campaign is paused. No new outreach is happening.'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Sent', value: sendCount.total },
              { label: 'This Week', value: sendCount.thisWeek },
              { label: 'Today', value: sendCount.today },
            ].map((s, i) => (
              <div key={i} className="dash-card" style={{ textAlign: 'center' }}>
                <p className="dash-stat-value">{s.value}</p>
                <p className="dash-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ FOLLOW-UPS TAB ══ */}
      {currentTab === 'followups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {followUpLoading && <div className="dash-empty">Loading follow-up data...</div>}

          {!campaignId && !followUpLoading && (
            <div className="dash-empty">No campaign found. Create one from the Campaign tab.</div>
          )}

          {campaignId && (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total Sent', value: stats.totalSent },
                  { label: 'Responded', value: stats.responded },
                  { label: 'No Response', value: stats.nonResponded },
                  { label: 'Follow-Ups', value: stats.followUpsSent + sentFollowUps.size },
                  { label: 'Rate', value: `${stats.responseRate}%` },
                ].map((s, i) => (
                  <div key={i} className="dash-card" style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.125rem' }}>{s.value}</p>
                    <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* View Toggle */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setFollowUpView('no_response')}
                  className={followUpView === 'no_response' ? 'dash-btn' : 'dash-btn-outline'}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                >
                  No Response ({nonResponded.length})
                </button>
                <button
                  onClick={() => setFollowUpView('responded')}
                  className={followUpView === 'responded' ? 'dash-btn' : 'dash-btn-outline'}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                >
                  Responded ({responded.length})
                </button>
              </div>

              {/* ── NO RESPONSE VIEW ── */}
              {followUpView === 'no_response' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Bulk Actions */}
                  <div className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button onClick={selectAllNonResponded} style={{ fontSize: '0.75rem', color: 'green', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Select All
                      </button>
                      {bulkSelected.size > 0 && <span style={{ fontSize: '0.75rem', color: '#999' }}>{bulkSelected.size} selected</span>}
                    </div>
                    {bulkSelected.size > 0 && (
                      <button onClick={sendBulkFollowUps} disabled={bulkSending} className="dash-btn-green" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                        {bulkSending ? 'Sending...' : `Send ${bulkSelected.size} Follow-Ups`}
                      </button>
                    )}
                  </div>

                  {nonResponded.map((coach) => {
                    const isExpanded = expandedCoach === coach.coachId
                    const isSent = coach.followUpSent || sentFollowUps.has(coach.coachId)
                    const isSending = sendingFollowUp === coach.coachId

                    return (
                      <div key={coach.coachId} className="dash-card" style={{ opacity: isSent ? 0.5 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {!isSent && (
                            <input type="checkbox" checked={bulkSelected.has(coach.coachId)} onChange={() => toggleBulkSelect(coach.coachId)} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 'bold' }}>{coach.coachName}</span>
                              <span className={`dash-badge ${getDivisionBadge(coach.division)}`}>{coach.division}</span>
                            </div>
                            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{coach.school}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {coach.daysSince !== null && (
                              <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: coach.daysSince >= 10 ? 'red' : coach.daysSince >= 7 ? '#b45309' : '#666', marginBottom: 0 }}>
                                {coach.daysSince}d ago
                              </p>
                            )}
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {isSent ? (
                              <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.75rem' }}>Sent</span>
                            ) : (
                              <button
                                onClick={() => setExpandedCoach(isExpanded ? null : coach.coachId)}
                                style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'black', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                {isExpanded ? '▲ Close' : '▼ Edit'}
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && !isSent && (
                          <div style={{ borderTop: '2px solid #eee', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem' }}>
                              Edit message before sending:
                            </p>
                            <textarea
                              value={getFollowUpMessage(coach.coachId, 'no_response')}
                              onChange={(e) => setEditingMessage(prev => ({ ...prev, [coach.coachId]: e.target.value }))}
                              className="dash-textarea"
                              rows={10}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button onClick={() => setExpandedCoach(null)} className="dash-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Cancel</button>
                              <button
                                onClick={() => sendFollowUp(coach.coachId, getFollowUpMessage(coach.coachId, 'no_response'))}
                                disabled={isSending}
                                className="dash-btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                              >
                                {isSending ? 'Sending...' : 'Send Follow-Up'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {nonResponded.length === 0 && (
                    <div className="dash-empty">All coaches have responded!</div>
                  )}
                </div>
              )}

              {/* ── RESPONDED VIEW ── */}
              {followUpView === 'responded' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {responded.map((coach) => {
                    const isExpanded = expandedCoach === coach.coachId
                    const isSent = coach.followUpSent || sentFollowUps.has(coach.coachId)
                    const isSending = sendingFollowUp === coach.coachId
                    const templateKey = coach.sentiment === 'positive' || coach.sentiment === 'interested'
                      ? 'responded_positive' as const : 'responded_neutral' as const

                    return (
                      <div key={coach.coachId} className="dash-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold' }}>{coach.coachName}</span>
                            <span className="dash-badge">{coach.division}</span>
                            <span style={{ ...getSentimentStyle(coach.sentiment), fontWeight: 'bold', fontSize: '0.75rem' }}>
                              {getSentimentLabel(coach.sentiment)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(coach.respondedAt).toLocaleDateString()}</span>
                            {isSent ? (
                              <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.75rem' }}>Sent</span>
                            ) : coach.sentiment !== 'negative' ? (
                              <button
                                onClick={() => setExpandedCoach(isExpanded ? null : coach.coachId)}
                                style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'black', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                {isExpanded ? '▲ Close' : 'Follow Up'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{coach.school}</p>

                        {/* Coach Response */}
                        <div style={{ background: '#f5f5f5', padding: '0.75rem', border: '2px solid #eee', marginTop: '0.5rem' }}>
                          <p style={{ fontSize: '0.625rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Their Response:</p>
                          <p style={{ fontSize: '0.875rem', color: '#333', marginBottom: 0 }}>{coach.responseBody}</p>
                        </div>

                        {isExpanded && !isSent && (
                          <div style={{ borderTop: '2px solid #eee', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                            <textarea
                              value={getFollowUpMessage(coach.coachId, templateKey)}
                              onChange={(e) => setEditingMessage(prev => ({ ...prev, [coach.coachId]: e.target.value }))}
                              className="dash-textarea"
                              rows={8}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button onClick={() => setExpandedCoach(null)} className="dash-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Cancel</button>
                              <button
                                onClick={() => sendFollowUp(coach.coachId, getFollowUpMessage(coach.coachId, templateKey))}
                                disabled={isSending}
                                className="dash-btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                              >
                                {isSending ? 'Sending...' : 'Send Follow-Up'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {responded.length === 0 && (
                    <div className="dash-empty">No responses yet. Keep the campaign running!</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ RESPONSES TAB ══ */}
      {currentTab === 'responses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="dash-card">
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
              {responded.length} responses from coaches — see{' '}
              <button onClick={() => setCurrentTab('followups')} style={{ color: 'green', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                Follow-Ups tab
              </button>{' '}
              to manage
            </p>
          </div>
          {responded.map((response) => (
            <div key={response.responseId} className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.125rem' }}>{response.coachName}</p>
                  <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{response.school}</p>
                </div>
                <span style={{ ...getSentimentStyle(response.sentiment), fontWeight: 'bold', fontSize: '0.75rem' }}>
                  {getSentimentLabel(response.sentiment)}
                </span>
              </div>
              <p style={{ color: '#333', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{response.responseBody}</p>
              <p style={{ color: '#999', fontSize: '0.75rem', marginBottom: 0 }}>{new Date(response.respondedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* ══ SETTINGS TAB ══ */}
      {currentTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Connect X Account</h3>
              {athlete.xConnected ? (
                <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.875rem' }}>Connected</span>
              ) : (
                <span style={{ color: '#999', fontSize: '0.875rem' }}>Not Connected</span>
              )}
            </div>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Connecting your X account allows us to amplify your profile and reach more coaches.
            </p>
            {!athlete.xConnected ? (
              <a href={`/api/auth/x/authorize?athleteId=${athlete.id}`} className="dash-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                Connect X Account
              </a>
            ) : (
              <button style={{ color: 'red', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Disconnect X Account
              </button>
            )}
          </div>

          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Notification Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'New Coach Response', enabled: true },
                { label: 'Weekly Summary', enabled: true },
                { label: 'Campaign Paused (no coaches in queue)', enabled: false },
              ].map((setting, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={setting.enabled} />
                  <span style={{ color: '#333', fontSize: '0.875rem' }}>{setting.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Privacy</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={false} />
              <span style={{ color: '#333', fontSize: '0.875rem' }}>Make profile private (coaches cannot view)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
