'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ReelContainer from '@/components/ReelContainer'
import PlayerCardCreator from '@/components/player-cards/PlayerCardCreator'
import PlayerCardDisplay from '@/components/player-cards/PlayerCardDisplay'

// ── Types ──
interface AthleteProfile {
  id: string
  firstName: string
  lastName: string
  email: string
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
  instagramReels: string[]
  profileImageUrl: string
  ppg: string
  rpg: string
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
  const [instagramReels, setInstagramReels] = useState<string[]>([])
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
  const [playerCards, setPlayerCards] = useState<any[]>([])
  const [creatingCard, setCreatingCard] = useState(false)
  const [editingCard, setEditingCard] = useState<any>(null)

  // Template state
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [runningCampaign, setRunningCampaign] = useState(false)
  const [campaignResult, setCampaignResult] = useState<{
    emailsSent: number;
    sentCoaches: Array<{ id: string; name: string; school: string; division: string }>;
    errors: any[];
    remaining: number;
    upNext: Array<{ id: string; name: string; school: string; division: string }>;
  } | null>(null)
  const [staggerProgress, setStaggerProgress] = useState<{ sent: number; total: number; batch: number; done: boolean } | null>(null)
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Open results state
  const [outreachResults, setOutreachResults] = useState<any>(null)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Load athlete and campaign via server-side API
  useEffect(() => {
    const loadAthlete = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/recruit/athlete?id=${id}`)
        if (!res.ok) {
          console.error('Failed to load athlete')
          setLoading(false)
          return
        }
        const data = await res.json()

        setAthlete(data.athlete)
        setInstagramReels(data.athlete.instagramReels || [])

        if (data.campaign) {
          setCampaignId(data.campaign.id)
          setCampaignStatus(data.campaign.status === 'paused' ? 'paused' : 'active')
        }

        setSendCount(data.sendCount)

        // Fetch player cards
        try {
          const cardsRes = await fetch(`/api/player-cards?athleteId=${id}`)
          if (cardsRes.ok) {
            const cardsData = await cardsRes.json()
            setPlayerCards(cardsData.cards || [])
          }
        } catch { /* player cards fetch failed silently */ }
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

  // Build a default template pre-populated with athlete data
  const buildDefaultTemplate = (a: AthleteProfile) => {
    const subject = `Interest in {{school}} — ${a.firstName} ${a.lastName}, Class of ${a.gradYear}`
    const statsLine = a.ppg || a.rpg
      ? `This season I averaged${a.ppg ? ` ${a.ppg} points` : ''}${a.ppg && a.rpg ? ',' : ''}${a.rpg ? ` ${a.rpg} rebounds` : ''} per game.\n\n`
      : ''
    const highlightLine = a.highlightUrl
      ? `My highlight film is available here: ${a.highlightUrl}\n\n`
      : ''
    const body = `Coach {{coach_last}},\n\nMy name is ${a.firstName} ${a.lastName}, a ${a.height}, ${a.weight} lb ${a.position} from ${a.highSchool} in ${a.city}, ${a.state} (Class of ${a.gradYear}).\n\nI am very interested in {{school}} and believe I could contribute to your program. ${statsLine}${highlightLine}I would love the opportunity to learn more about your program and what it takes to be part of your team.\n\nThank you for your time, Coach.\n\nRespectfully,\n${a.firstName} ${a.lastName}\n${a.email || ''}\nlocalhustle.org/recruit/${a.slug || ''}`
    return { subject, body }
  }

  // Load template when campaign tab is opened
  useEffect(() => {
    if (currentTab === 'campaign' && !templateLoaded && athlete) {
      if (campaignId) {
        fetch(`/api/recruit/template?campaignId=${campaignId}`)
          .then(res => res.json())
          .then(data => {
            if (data.template) {
              setTemplateSubject(data.template.subject || '')
              setTemplateBody(data.template.body || '')
            } else {
              const defaults = buildDefaultTemplate(athlete)
              setTemplateSubject(defaults.subject)
              setTemplateBody(defaults.body)
            }
            setTemplateLoaded(true)
          })
          .catch(() => setTemplateLoaded(true))
      } else {
        // No campaign yet — show default template pre-populated with athlete data
        const defaults = buildDefaultTemplate(athlete)
        setTemplateSubject(defaults.subject)
        setTemplateBody(defaults.body)
        setTemplateLoaded(true)
      }
    }
  }, [currentTab, campaignId, templateLoaded, athlete])

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

  const refetchCards = async () => {
    const res = await fetch(`/api/player-cards?athleteId=${id}`)
    const data = await res.json()
    setPlayerCards(data.cards || [])
  }

  const deleteCard = async (cardId: string) => {
    if (!confirm('Delete this card?')) return
    await fetch(`/api/player-cards?id=${cardId}`, { method: 'DELETE' })
    refetchCards()
  }

  const selectAllNonResponded = () => {
    if (!followUpData) return
    const eligible = followUpData.nonResponded
      .filter(c => !c.followUpSent && !sentFollowUps.has(c.coachId))
      .map(c => c.coachId)
    setBulkSelected(new Set(eligible))
  }

  const saveTemplate = async () => {
    setSavingTemplate(true)
    try {
      const activeCampaignId = await ensureCampaign()
      if (!activeCampaignId) {
        setSavingTemplate(false)
        return
      }
      const res = await fetch('/api/recruit/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: activeCampaignId, subject: templateSubject, bodyText: templateBody }),
      })
      if (res.ok) {
        setEditingTemplate(false)
      } else {
        alert('Failed to save template')
      }
    } catch {
      alert('Failed to save template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const ensureCampaign = async (): Promise<string | null> => {
    if (campaignId) return campaignId
    // Auto-create a campaign for this athlete
    try {
      const res = await fetch('/api/recruit/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: id }),
      })
      const data = await res.json()
      if (data.campaignId) {
        setCampaignId(data.campaignId)
        return data.campaignId
      }
      alert('Failed to create campaign: ' + (data.error || 'Unknown error'))
      return null
    } catch {
      alert('Failed to create campaign. Please try again.')
      return null
    }
  }

  const runCampaign = async (count: number) => {
    setRunningCampaign(true)
    setCampaignResult(null)
    try {
      const activeCampaignId = await ensureCampaign()
      if (!activeCampaignId) {
        setRunningCampaign(false)
        return
      }
      // Save template first
      await fetch('/api/recruit/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: activeCampaignId, subject: templateSubject, bodyText: templateBody }),
      })
      const res = await fetch('/api/recruit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: activeCampaignId, maxEmails: count }),
      })
      const data = await res.json()
      if (data.success) {
        setCampaignResult({
          emailsSent: data.emailsSent,
          sentCoaches: data.sentCoaches || [],
          errors: data.errors,
          remaining: data.remaining,
          upNext: data.upNext || [],
        })
        setSendCount(prev => ({
          total: prev.total + data.emailsSent,
          thisWeek: prev.thisWeek + data.emailsSent,
          today: prev.today + data.emailsSent,
        }))
      } else {
        alert('Campaign error: ' + (data.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Failed to run campaign: ' + err.message)
    } finally {
      setRunningCampaign(false)
    }
  }

  // Test Send — sends one test email to a specified address
  const sendTestEmail = async () => {
    setTestSending(true)
    setTestResult(null)
    try {
      const activeCampaignId = await ensureCampaign()
      if (!activeCampaignId) { setTestSending(false); return }

      const res = await fetch('/api/recruit/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: activeCampaignId,
          testEmail: 'jesse@entreartists.com',
          subject: templateSubject,
          bodyText: templateBody,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: `Test sent to ${data.testEmail}` })
      } else {
        setTestResult({ success: false, message: data.error || 'Test send failed' })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message })
    } finally {
      setTestSending(false)
    }
  }

  // Send All Staggered — sends batches of 10 with 3s gaps
  const runCampaignStaggered = async () => {
    setRunningCampaign(true)
    setCampaignResult(null)
    setStaggerProgress({ sent: 0, total: 0, batch: 0, done: false })
    try {
      const activeCampaignId = await ensureCampaign()
      if (!activeCampaignId) {
        setRunningCampaign(false)
        setStaggerProgress(null)
        return
      }
      // Save template first
      await fetch('/api/recruit/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: activeCampaignId, subject: templateSubject, bodyText: templateBody }),
      })

      let totalSent = 0
      let totalErrors: any[] = []
      let remaining = 999
      let batchNum = 0

      while (remaining > 0) {
        batchNum++
        setStaggerProgress({ sent: totalSent, total: 0, batch: batchNum, done: false })

        const res = await fetch('/api/recruit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: activeCampaignId, maxEmails: 10 }),
        })
        const data = await res.json()
        if (!data.success) {
          alert('Campaign error: ' + (data.error || 'Unknown error'))
          break
        }

        totalSent += data.emailsSent
        totalErrors = [...totalErrors, ...data.errors]
        remaining = data.remaining

        setStaggerProgress({ sent: totalSent, total: totalSent + remaining, batch: batchNum, done: false })
        setSendCount(prev => ({
          total: prev.total + data.emailsSent,
          thisWeek: prev.thisWeek + data.emailsSent,
          today: prev.today + data.emailsSent,
        }))

        // If no emails sent this batch (limit hit or no more coaches), stop
        if (data.emailsSent === 0) break

        // Wait 3 seconds between batches to be polite to Resend rate limits
        if (remaining > 0) {
          await new Promise(r => setTimeout(r, 3000))
        }
      }

      setCampaignResult({ emailsSent: totalSent, sentCoaches: [], errors: totalErrors, remaining, upNext: [] })
      setStaggerProgress({ sent: totalSent, total: totalSent + remaining, batch: batchNum, done: true })
    } catch (err: any) {
      alert('Failed to run staggered campaign: ' + err.message)
      setStaggerProgress(null)
    } finally {
      setRunningCampaign(false)
    }
  }

  // Load outreach results (open rates, delivery stats)
  const loadResults = async () => {
    const activeCampaignId = campaignId
    if (!activeCampaignId) return
    setResultsLoading(true)
    try {
      const res = await fetch(`/api/recruit/results?campaignId=${activeCampaignId}`)
      const data = await res.json()
      setOutreachResults(data)
      setShowResults(true)
    } catch (err: any) {
      alert('Failed to load results: ' + err.message)
    } finally {
      setResultsLoading(false)
    }
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
    borderBottom: currentTab === tab ? '2px solid black' : '2px solid transparent',
    color: currentTab === tab ? 'black' : '#999',
    background: 'none',
    border: 'none',
    borderBottomWidth: '2px',
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
      <div style={{ padding: '1.5rem 0', borderBottom: '1px solid #eee', marginBottom: '1.5rem' }}>
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
        {/* Row 1: Profile photo+name (left) | Physical stats (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0 }}>
              {athlete.firstName.charAt(0)}{athlete.lastName.charAt(0)}
            </div>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.25rem' }}>{athlete.firstName} {athlete.lastName}</p>
              <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{athlete.sport} &bull; {athlete.position}</p>
            </div>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', color: '#999', marginBottom: '0.75rem' }}>Physical</p>
            <p style={{ marginBottom: '0.25rem' }}><span style={{ color: '#999', fontSize: '0.75rem' }}>Height:</span> {athlete.height}</p>
            <p style={{ marginBottom: '0.25rem' }}><span style={{ color: '#999', fontSize: '0.75rem' }}>Weight:</span> {athlete.weight} lbs</p>
            <p style={{ marginBottom: '0.25rem' }}><span style={{ color: '#999', fontSize: '0.75rem' }}>School:</span> {athlete.highSchool}</p>
            <p style={{ marginBottom: 0 }}><span style={{ color: '#999', fontSize: '0.75rem' }}>Grad Year:</span> {athlete.gradYear}</p>
          </div>
        </div>
        {/* Row 2: Full-width About/Bio */}
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <p style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', color: '#999', marginBottom: '0.5rem' }}>About</p>
          <p style={{ fontSize: '0.875rem', color: '#333', marginBottom: '0.25rem' }}>{athlete.bio || 'No bio yet'}</p>
          <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: 0 }}>{athlete.city}, {athlete.state}</p>
        </div>
      </div>

      {/* X Connection Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem',
        borderRadius: '12px', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.875rem',
        background: athlete.xConnected ? '#e6f9e6' : '#fff3e0',
        border: athlete.xConnected ? '1.5px solid #4caf50' : '1.5px solid #ff9800',
        color: athlete.xConnected ? '#2e7d32' : '#e65100',
      }}>
        {athlete.xConnected ? (
          <span>&#10003; X Connected @{athlete.firstName.toLowerCase()}{athlete.lastName.toLowerCase()}</span>
        ) : (
          <>
            <span style={{ fontSize: '1.125rem' }}>&#x1D54F;</span>
            <span>Connect X Account to enable DM outreach</span>
            <a
              href={`/api/auth/x/authorize?athleteId=${athlete.id}`}
              style={{ marginLeft: 'auto', padding: '0.4rem 1rem', borderRadius: '9999px', background: '#ff9800', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit', textDecoration: 'none' }}
            >
              Connect X
            </a>
          </>
        )}
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
          {/* Profile Photo */}
          <div className="dash-card" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {athlete.profileImageUrl ? (
                <img src={athlete.profileImageUrl} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto' }}>
                  {athlete.firstName.charAt(0)}{athlete.lastName.charAt(0)}
                </div>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}>{athlete.firstName} {athlete.lastName}</h2>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>{athlete.sport} &bull; {athlete.position}</p>
            <label style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#f0f0f0', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'inherit' }}>
              {athlete.profileImageUrl ? 'Change Photo' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  // Compress image client-side to stay under Vercel's 4.5MB limit
                  const compress = (f: File): Promise<Blob> => {
                    return new Promise((resolve) => {
                      const img = new Image()
                      img.onload = () => {
                        const canvas = document.createElement('canvas')
                        const maxSize = 800
                        let w = img.width, h = img.height
                        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
                        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
                        canvas.width = w; canvas.height = h
                        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
                        canvas.toBlob((blob) => resolve(blob || f), 'image/jpeg', 0.85)
                      }
                      img.src = URL.createObjectURL(f)
                    })
                  }
                  const compressed = await compress(file)
                  const formData = new FormData()
                  formData.append('file', compressed, 'profile.jpg')
                  formData.append('athleteId', id)
                  const res = await fetch('/api/recruit/upload-image', { method: 'POST', body: formData })
                  if (res.ok) {
                    const { url } = await res.json()
                    setAthlete(prev => prev ? { ...prev, profileImageUrl: url } : prev)
                    alert('Profile photo saved!')
                  } else {
                    const err = await res.json().catch(() => ({}))
                    alert('Failed to upload: ' + (err.error || 'Unknown error'))
                  }
                }}
              />
            </label>
          </div>

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

          {/* Campaign Overview (on Profile tab) */}
          <div className="dash-card" style={{ borderColor: '#1976d2', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0, color: '#1976d2' }}>Outreach Campaign</h3>
              <button
                onClick={handleToggleCampaign}
                className={campaignStatus === 'active' ? 'dash-btn-green' : 'dash-btn-outline'}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
              >
                {campaignStatus === 'active' ? '● Active' : '❚❚ Paused'}
              </button>
            </div>

            {/* Workflow steps */}
            <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', color: '#999', marginBottom: '0.75rem' }}>Outreach Workflow</p>
              {[
                { step: 1, text: 'Connect X account for DM outreach', done: athlete.xConnected },
                { step: 2, text: 'Review your 172 target coaches', done: sendCount.total > 0 },
                { step: 3, text: 'Set up email & DM templates', done: false },
                { step: 4, text: 'Launch automated outreach campaign', done: campaignStatus === 'active' },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0, background: item.done ? '#4caf50' : '#e0e0e0', color: item.done ? 'white' : '#666' }}>
                    {item.done ? '\u2713' : item.step}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: item.done ? '#333' : '#666' }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Campaign stats counters */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Sent', value: sendCount.total },
                { label: 'This Week', value: sendCount.thisWeek },
                { label: 'Today', value: sendCount.today },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '10px', padding: '0.75rem' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.125rem' }}>{s.value}</p>
                  <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Outreach Targets Card */}
          <div className="dash-card" style={{ borderColor: '#7b1fa2', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', color: '#7b1fa2' }}>Outreach Targets</h3>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{sendCount.total || 172}</span> coaches loaded
                </p>
                <p style={{ color: '#999', fontSize: '0.8rem', marginBottom: 0 }}>172 coaches pre-loaded from previous research.</p>
              </div>
              <button
                onClick={() => setCurrentTab('campaign')}
                style={{ padding: '0.5rem 1rem', borderRadius: '9999px', background: '#7b1fa2', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit', flexShrink: 0 }}
              >
                Start Campaign
              </button>
            </div>
          </div>

          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Highlight Video</h3>
            {athlete.highlightUrl ? (
              <div style={{ background: '#f5f5f5', padding: '2rem', textAlign: 'center', borderRadius: '12px' }}>
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>Video from HUDL</p>
                <a href={athlete.highlightUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontWeight: 'bold' }}>
                  Watch on HUDL &rarr;
                </a>
              </div>
            ) : (
              <div style={{ padding: '2rem', border: '2px dashed #ddd', borderRadius: '12px', textAlign: 'center', color: '#999' }}>
                Upload Highlight Video
              </div>
            )}
          </div>

          {/* Instagram Reels */}
          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Instagram Reels</h3>
            <ReelContainer
              editable
              reels={instagramReels}
              onReelsChange={async (newReels) => {
                setInstagramReels(newReels)
                await fetch('/api/recruit/update-profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ athleteId: id, field: 'instagram_reels', value: newReels }),
                })
              }}
            />
          </div>
          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Bio</h3>
            <textarea id="bio-input" defaultValue={athlete.bio} className="dash-textarea" rows={4} />
            <button className="dash-btn" style={{ marginTop: '0.75rem' }} onClick={async () => {
              const bio = (document.getElementById('bio-input') as HTMLTextAreaElement).value
              const res = await fetch('/api/recruit/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ athleteId: id, field: 'about', value: bio }),
              })
              if (res.ok) alert('Bio saved!')
              else alert('Failed to save bio')
            }}>Save Bio</button>
          </div>
          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Photos</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ aspectRatio: '1', border: '2px dashed #ddd', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', cursor: 'pointer', fontSize: '1.5rem' }}>+</div>
              ))}
            </div>
          </div>
          {/* Player Cards */}
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Player Cards</h3>
              {!creatingCard && !editingCard && (
                <button className="dash-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }} onClick={() => setCreatingCard(true)}>
                  Create Card
                </button>
              )}
            </div>

            {creatingCard || editingCard ? (
              <PlayerCardCreator
                profile={{
                  id: athlete.id,
                  full_name: `${athlete.firstName} ${athlete.lastName}`.toUpperCase(),
                  school: athlete.highSchool?.toUpperCase(),
                  sport: athlete.sport,
                  state: athlete.state,
                }}
                athleteId={athlete.id}
                existingCard={editingCard}
                useApi
                onSave={() => {
                  setCreatingCard(false)
                  setEditingCard(null)
                  refetchCards()
                }}
                onCancel={() => {
                  setCreatingCard(false)
                  setEditingCard(null)
                }}
              />
            ) : playerCards.length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                No player cards yet — create a retro trading card to share with coaches.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {playerCards.map((card: any) => (
                  <PlayerCardDisplay
                    key={card.id}
                    card={card}
                    compact
                    onEdit={() => setEditingCard(card)}
                    onDelete={() => deleteCard(card.id)}
                  />
                ))}
              </div>
            )}
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
          {/* Status + Stats Row */}
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
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Sent', value: sendCount.total },
                { label: 'This Week', value: sendCount.thisWeek },
                { label: 'Today', value: sendCount.today },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '10px', padding: '0.75rem' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.125rem' }}>{s.value}</p>
                  <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Outreach Letter */}
          <div className="dash-card" style={{ borderColor: '#1976d2', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0, color: '#1976d2' }}>Outreach Letter</h3>
              {!editingTemplate ? (
                <button onClick={() => setEditingTemplate(true)} className="dash-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                  Edit Letter
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setEditingTemplate(false)} className="dash-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                  <button onClick={saveTemplate} disabled={savingTemplate} className="dash-btn" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                    {savingTemplate ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {!templateLoaded ? (
              <p style={{ color: '#999', fontSize: '0.875rem' }}>Loading template...</p>
            ) : editingTemplate ? (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Subject Line</label>
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: "'Courier New', Courier, monospace", border: '1px solid #ddd', borderRadius: '8px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Email Body</label>
                  <textarea
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    className="dash-textarea"
                    rows={14}
                  />
                </div>
                <div style={{ marginTop: '0.75rem', background: '#f0f7ff', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '0.25rem' }}>Available Variables</p>
                  <p style={{ fontSize: '0.7rem', color: '#666', marginBottom: 0, lineHeight: 1.8 }}>
                    {'{{coach_first}} {{coach_last}} {{school}} {{athlete_first}} {{athlete_last}} {{position}} {{height}} {{weight}} {{high_school}} {{city}} {{state}} {{grad_year}} {{ppg}} {{rpg}} {{highlight_url}} {{athlete_email}}'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Subject</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: 0 }}>
                    {(templateSubject || 'No subject set')
                      .replace(/\{\{school\}\}/g, '[School]')
                      .replace(/\{\{coach_last\}\}/g, '[Coach Name]')
                      .replace(/\{\{coach_first\}\}/g, '[Coach First]')}
                  </p>
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Preview</p>
                  <pre style={{ fontSize: '0.8rem', color: '#333', margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Courier New', Courier, monospace", lineHeight: 1.6 }}>
                    {(templateBody || 'No template set. Click "Edit Letter" to create your outreach letter.')
                      .replace(/\{\{school\}\}/g, '[School]')
                      .replace(/\{\{coach_last\}\}/g, '[Coach Name]')
                      .replace(/\{\{coach_first\}\}/g, '[Coach First]')
                      .replace(/\{\{coach_title\}\}/g, '[Title]')}
                  </pre>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.5rem', marginBottom: 0, fontStyle: 'italic' }}>
                  [School] and [Coach Name] are filled automatically for each coach when sent.
                </p>
              </>
            )}
          </div>

          {/* Send Outreach */}
          <div className="dash-card" style={{ borderColor: '#22c55e', borderWidth: '1.5px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#22c55e' }}>Send Outreach</h3>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Each coach gets a personalized version with their name and school filled in automatically.
            </p>

            {/* Test result */}
            {testResult && (
              <div style={{ background: testResult.success ? '#e6f9e6' : '#fff3e0', borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 'bold', color: testResult.success ? '#2e7d32' : '#e65100' }}>{testResult.message}</span>
              </div>
            )}

            {/* Buttons row */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button
                onClick={sendTestEmail}
                disabled={testSending || runningCampaign || !templateBody}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', background: testSending ? '#ccc' : '#666', color: 'white', border: 'none', cursor: testSending ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                {testSending ? 'Sending...' : 'Test Send'}
              </button>
              <button
                onClick={() => runCampaign(5)}
                disabled={runningCampaign || !templateBody}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', background: runningCampaign ? '#ccc' : '#22c55e', color: 'white', border: 'none', cursor: runningCampaign ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                {runningCampaign ? 'Sending...' : 'Send 5'}
              </button>
              <button
                onClick={() => runCampaign(20)}
                disabled={runningCampaign || !templateBody}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', background: runningCampaign ? '#ccc' : '#1976d2', color: 'white', border: 'none', cursor: runningCampaign ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                {runningCampaign ? 'Sending...' : 'Send 20'}
              </button>
              <button
                onClick={runCampaignStaggered}
                disabled={runningCampaign || !templateBody}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', background: runningCampaign ? '#ccc' : '#e65100', color: 'white', border: 'none', cursor: runningCampaign ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                {runningCampaign ? 'Sending...' : 'Send All (Staggered)'}
              </button>
            </div>

            {/* Stagger progress bar */}
            {staggerProgress && !staggerProgress.done && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                  <span>Batch {staggerProgress.batch} &mdash; {staggerProgress.sent} sent</span>
                  <span>{staggerProgress.total > 0 ? `${Math.round((staggerProgress.sent / staggerProgress.total) * 100)}%` : '...'}</span>
                </div>
                <div style={{ background: '#e0e0e0', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #e65100, #ff9800)', height: '100%', borderRadius: '9999px', width: staggerProgress.total > 0 ? `${Math.min(100, (staggerProgress.sent / staggerProgress.total) * 100)}%` : '10%', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {!templateBody && (
              <p style={{ color: '#e65100', fontSize: '0.8rem', marginTop: '0', marginBottom: '0.5rem' }}>
                Edit your outreach letter above before sending.
              </p>
            )}

            {/* Send results — who was sent + who's next */}
            {campaignResult && (
              <div style={{ marginTop: '0.25rem' }}>
                <div style={{ background: campaignResult.emailsSent > 0 ? '#e6f9e6' : '#fff3e0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: campaignResult.emailsSent > 0 ? '#2e7d32' : '#e65100' }}>
                    {campaignResult.emailsSent > 0 ? `Sent ${campaignResult.emailsSent} emails!` : 'No emails sent'}
                  </p>
                  {campaignResult.errors.length > 0 && (
                    <p style={{ color: '#e65100', marginBottom: '0.25rem' }}>{campaignResult.errors.length} error{campaignResult.errors.length > 1 ? 's' : ''}</p>
                  )}
                  <p style={{ color: '#666', marginBottom: 0 }}>{campaignResult.remaining} coaches remaining</p>
                </div>

                {/* Sent coaches list */}
                {campaignResult.sentCoaches.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Sent To</p>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {campaignResult.sentCoaches.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                          <span style={{ color: '#666' }}>{c.school} {c.division && <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#7b1fa2' }}>({c.division})</span>}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Up next coaches */}
                {campaignResult.upNext.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1976d2', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Up Next</p>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {campaignResult.upNext.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.8rem', color: '#999' }}>
                          <span>{c.name}</span>
                          <span>{c.school} {c.division && <span style={{ fontSize: '0.7rem' }}>({c.division})</span>}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Open Results */}
          <div className="dash-card" style={{ borderColor: '#1976d2', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', margin: 0, color: '#1976d2' }}>Outreach Results</h3>
              <button
                onClick={loadResults}
                disabled={resultsLoading || !campaignId}
                className="dash-btn"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#1976d2', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}
              >
                {resultsLoading ? 'Loading...' : showResults ? 'Refresh' : 'View Results'}
              </button>
            </div>

            {!showResults && !resultsLoading && (
              <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: 0 }}>
                Click &ldquo;View Results&rdquo; to see delivery and open rates for your outreach.
              </p>
            )}

            {showResults && outreachResults && (
              <>
                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Sent', value: outreachResults.summary.sent, color: '#333' },
                    { label: 'Delivered', value: outreachResults.summary.delivered, color: '#1976d2' },
                    { label: 'Opened', value: outreachResults.summary.opened, color: '#22c55e' },
                    { label: 'Replied', value: outreachResults.summary.replied, color: '#7b1fa2' },
                    { label: 'Failed', value: outreachResults.summary.failed, color: '#e65100' },
                    { label: 'Open Rate', value: `${outreachResults.summary.openRate}%`, color: '#22c55e' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: '#f9f9f9', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Per-coach results list */}
                {outreachResults.results.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                          <th style={{ padding: '0.4rem 0.5rem', color: '#999', fontWeight: 600 }}>Coach</th>
                          <th style={{ padding: '0.4rem 0.5rem', color: '#999', fontWeight: 600 }}>School</th>
                          <th style={{ padding: '0.4rem 0.5rem', color: '#999', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '0.4rem 0.5rem', color: '#999', fontWeight: 600 }}>Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outreachResults.results.map((r: any) => {
                          const statusColors: Record<string, string> = {
                            sent: '#999', delivered: '#1976d2', opened: '#22c55e', replied: '#7b1fa2', failed: '#e65100', queued: '#ccc',
                          }
                          return (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '0.4rem 0.5rem' }}>{r.coachName}</td>
                              <td style={{ padding: '0.4rem 0.5rem', color: '#666' }}>{r.school}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <span style={{
                                  display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 'bold',
                                  background: (statusColors[r.status] || '#999') + '20', color: statusColors[r.status] || '#999',
                                }}>
                                  {r.status === 'opened' ? 'Opened' : r.status === 'delivered' ? 'Delivered' : r.status === 'replied' ? 'Replied' : r.status === 'failed' ? 'Failed' : r.status === 'sent' ? 'Sent' : 'Queued'}
                                </span>
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem', color: '#999' }}>
                                {r.sentAt ? new Date(r.sentAt).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#999', fontSize: '0.8rem', marginBottom: 0 }}>No emails sent yet.</p>
                )}
              </>
            )}
          </div>

          {/* Coach Targets */}
          <div className="dash-card" style={{ borderColor: '#7b1fa2', borderWidth: '1.5px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', color: '#7b1fa2' }}>Outreach Targets</h3>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', color: '#333' }}>172</span> coaches loaded &mdash; D1 head coaches, Pacific Northwest region
            </p>
            <p style={{ color: '#999', fontSize: '0.8rem', marginBottom: 0 }}>
              {sendCount.total > 0
                ? `${sendCount.total} contacted so far. ${Math.max(0, 172 - sendCount.total)} remaining.`
                : 'No coaches contacted yet. Start your campaign above.'}
            </p>
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
                        <div style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
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

          {/* Custom Profile URL */}
          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Profile URL</h3>
            <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Customize your public profile link. Use lowercase letters, numbers, and hyphens only.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: '#999', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>localhustle.org/recruit/</span>
              <input
                type="text"
                defaultValue={athlete.slug}
                id="slug-input"
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontFamily: "'Courier New', Courier, monospace",
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                }}
                placeholder="josiah-boone-26"
              />
              <button
                className="dash-btn"
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                onClick={async () => {
                  const input = document.getElementById('slug-input') as HTMLInputElement
                  const newSlug = input.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-')
                  if (!newSlug || newSlug.length < 3) { alert('URL must be at least 3 characters'); return }
                  const res = await fetch('/api/recruit/update-slug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ athleteId: id, slug: newSlug }),
                  })
                  if (res.ok) {
                    setAthlete(prev => prev ? { ...prev, slug: newSlug } : prev)
                    alert('Profile URL updated!')
                  } else {
                    const data = await res.json()
                    alert(data.error || 'Failed to update URL')
                  }
                }}
              >
                Save
              </button>
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
