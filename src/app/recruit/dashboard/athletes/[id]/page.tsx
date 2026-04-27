'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ReelContainer from '@/components/ReelContainer'
import PlayerCardCreator from '@/components/player-cards/PlayerCardCreator'
import PlayerCardDisplay from '@/components/player-cards/PlayerCardDisplay'
import InboxMessages from '@/components/recruit/InboxMessages'

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
  mpg: string
  threePtPct: string
  fgPct: string
  parentName: string
  parentEmail: string
  photos: string[]
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

interface EngagementCoach {
  coachId: string
  coachName: string
  school: string
  division: string
  email: string
  score: number
  tier: 'Hot' | 'Warm' | 'Cold'
  breakdown: string
  opens: number
  clicks: number
  replied: boolean
  delivered: number
  lastInteraction: string | null
}

interface EngagementData {
  coaches: EngagementCoach[]
  summary: {
    totalEngaged: number
    hottestLead: { name: string; school: string; score: number } | null
    averageScore: number
  }
}

type Tab = 'profile' | 'campaign' | 'followups' | 'responses' | 'messages' | 'settings'

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

  // Highlight URL edit state
  const [editingHighlight, setEditingHighlight] = useState(false)
  const [highlightDraft, setHighlightDraft] = useState('')
  const [savingHighlight, setSavingHighlight] = useState(false)

  // Athlete photos state
  const [athletePhotos, setAthletePhotos] = useState<string[]>([])
  const [uploadingPhotoIdx, setUploadingPhotoIdx] = useState<number | null>(null)

  const uploadAthletePhoto = async (file: File, index: number) => {
    setUploadingPhotoIdx(index)
    try {
      const compress = (f: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          const objectUrl = URL.createObjectURL(f)
          img.onload = () => {
            URL.revokeObjectURL(objectUrl)
            const canvas = document.createElement('canvas')
            const maxSize = 1200
            let w = img.width, h = img.height
            if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
            else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
            canvas.width = w; canvas.height = h
            canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Failed to compress'))
            }, 'image/jpeg', 0.85)
          }
          img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')) }
          img.src = objectUrl
        })
      }
      const compressed = await compress(file)
      const formData = new FormData()
      formData.append('file', compressed, `photo-${index}.jpg`)
      formData.append('athleteId', id)
      formData.append('photoIndex', String(index))
      const res = await fetch('/api/recruit/upload-image', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json()
        setAthletePhotos(prev => {
          const updated = [...prev]
          updated[index] = url
          return updated
        })
        // Save photo URLs to profile
        const updatedPhotos = [...athletePhotos]
        updatedPhotos[index] = url
        await fetch('/api/recruit/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId: id, field: 'photos', value: updatedPhotos.filter(Boolean) }),
        })
      } else {
        const err = await res.json().catch(() => ({}))
        alert('Upload failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploadingPhotoIdx(null)
    }
  }

  const deleteAthletePhoto = async (index: number) => {
    const updated = [...athletePhotos]
    updated[index] = ''
    setAthletePhotos(updated)
    await fetch('/api/recruit/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId: id, field: 'photos', value: updated.filter(Boolean) }),
    })
  }

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

  // Deliverability state
  const [deliverability, setDeliverability] = useState<{
    stats: { totalSent: number; delivered: number; opened: number; clicked: number; bounced: number; failed: number; complained: number; deliveryRate: number; openRate: number; clickRate: number }
    recentIssues: Array<{ type: string; recipient: string | null; error: string | null; date: string; coachName: string | null }>
  } | null>(null)
  const [deliverabilityLoading, setDeliverabilityLoading] = useState(false)

  // Custom outreach queue state
  const [outreachQueue, setOutreachQueue] = useState<any[]>([])
  const [queueLoaded, setQueueLoaded] = useState(false)
  const [sendingOutreachId, setSendingOutreachId] = useState<string | null>(null)
  const [previewOutreachId, setPreviewOutreachId] = useState<string | null>(null)

  // Target coaches list state
  const [targetCoaches, setTargetCoaches] = useState<any[]>([])
  const [targetCoachesLoaded, setTargetCoachesLoaded] = useState(false)
  const [coachFilter, setCoachFilter] = useState<'all' | 'not_contacted' | 'emailed' | 'responded'>('all')
  const [coachSearch, setCoachSearch] = useState('')
  const [showCoachesList, setShowCoachesList] = useState(false)
  const [favoriteCoaches, setFavoriteCoaches] = useState<Set<string>>(new Set())

  // Parent/Guardian access state
  const [parentAccessList, setParentAccessList] = useState<any[]>([])
  const [parentAccessPrimary, setParentAccessPrimary] = useState<string | null>(null)
  const [showAddParent, setShowAddParent] = useState(false)
  const [newParentEmail, setNewParentEmail] = useState('')
  const [newParentName, setNewParentName] = useState('')
  const [newParentRelationship, setNewParentRelationship] = useState('')
  const [addingParent, setAddingParent] = useState(false)
  const [addParentError, setAddParentError] = useState<string | null>(null)

  // X DM Hub state
  const [dmCoaches, setDmCoaches] = useState<any[]>([])
  const [dmCoachesLoaded, setDmCoachesLoaded] = useState(false)
  const [sendingDmTo, setSendingDmTo] = useState<string | null>(null)
  const [dmMessage, setDmMessage] = useState('')
  const [dmResult, setDmResult] = useState<{ success: boolean; message: string } | null>(null)
  const [dmComposeCoach, setDmComposeCoach] = useState<any | null>(null)

  // Bulk DM state
  const [bulkDmTemplate, setBulkDmTemplate] = useState('')
  const [bulkDmShowPreview, setBulkDmShowPreview] = useState(false)
  const [bulkDmSending, setBulkDmSending] = useState(false)
  const [bulkDmPaused, setBulkDmPaused] = useState(false)
  const [bulkDmProgress, setBulkDmProgress] = useState({ sent: 0, total: 0, failed: 0 })
  const [bulkDmStatus, setBulkDmStatus] = useState<{ sentToday: number; dailyLimit: number; remainingToday: number; totalQueued: number } | null>(null)
  const [bulkDmLog, setBulkDmLog] = useState<Array<{ coach: string; success: boolean; error?: string }>>([])

  // X Engagement state (follow/like)
  const [xEngagements, setXEngagements] = useState<Record<string, { followed: boolean; likedTweets: string[] }>>({})
  const [xEngagementsLoaded, setXEngagementsLoaded] = useState(false)
  const [xEngageLoading, setXEngageLoading] = useState<string | null>(null)
  const [xEngageResult, setXEngageResult] = useState<{ success: boolean; message: string } | null>(null)

  // Auto-dismiss engagement toast after 5s
  useEffect(() => {
    if (xEngageResult) {
      const t = setTimeout(() => setXEngageResult(null), 5000)
      return () => clearTimeout(t)
    }
  }, [xEngageResult])

  // Coach Engagement state
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null)
  const [engagementLoaded, setEngagementLoaded] = useState(false)
  const [engagementFilter, setEngagementFilter] = useState<'all' | 'Hot' | 'Warm' | 'Cold'>('all')

  // Activity Tracker state
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [activityForm, setActivityForm] = useState({
    activityType: 'campus_visit',
    title: '',
    school: '',
    activityDate: '',
    description: '',
    status: 'planned',
  })
  const [savingActivity, setSavingActivity] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [outcomeText, setOutcomeText] = useState<Record<string, string>>({})

  // Offer Board state
  const [offers, setOffers] = useState<any[]>([])
  const [offersLoaded, setOffersLoaded] = useState(false)
  const [showAddOffer, setShowAddOffer] = useState(false)
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null)
  const [offerForm, setOfferForm] = useState({
    school: '', division: '', offer_type: 'interest', scholarship_amount: '',
    notes: '', interest_level: 3, coach_interest_level: 3, decision_deadline: '',
  })
  const [savingOffer, setSavingOffer] = useState(false)

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
        setAthletePhotos(data.athlete.photos || [])

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

  // Fetch activities when followups tab opens
  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/recruit/activities?athleteId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setActivitiesLoaded(true)
    }
  }, [id])

  useEffect(() => {
    if (currentTab === 'followups' && !activitiesLoaded) fetchActivities()
  }, [currentTab, activitiesLoaded, fetchActivities])

  const saveActivity = async () => {
    setSavingActivity(true)
    try {
      const res = await fetch('/api/recruit/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: id, ...activityForm }),
      })
      if (res.ok) {
        setShowAddActivity(false)
        setActivityForm({ activityType: 'campus_visit', title: '', school: '', activityDate: '', description: '', status: 'planned' })
        fetchActivities()
      }
    } catch (err) {
      console.error('Failed to save activity:', err)
    } finally {
      setSavingActivity(false)
    }
  }

  const updateActivityStatus = async (activityId: string, newStatus: string, outcome?: string) => {
    try {
      const body: any = { id: activityId, status: newStatus }
      if (outcome !== undefined) body.outcome = outcome
      const res = await fetch('/api/recruit/activities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) fetchActivities()
    } catch (err) {
      console.error('Failed to update activity:', err)
    }
  }

  const deleteActivity = async (activityId: string) => {
    if (!confirm('Delete this activity?')) return
    try {
      const res = await fetch(`/api/recruit/activities?id=${activityId}`, { method: 'DELETE' })
      if (res.ok) fetchActivities()
    } catch (err) {
      console.error('Failed to delete activity:', err)
    }
  }

  // Build a default template pre-populated with athlete data
  const buildDefaultTemplate = (a: AthleteProfile) => {
    const subject = `${a.firstName} ${a.lastName} - ${a.gradYear} ${a.position} interested in {{school}}`
    const parentLine = a.parentName ? `\n\nMy dad, ${a.parentName}, can also be reached at ${a.parentEmail || '{{parent_email}}'}` : ''
    const body = `Coach {{coach_last}},

I know recruiting season keeps you busy, so I'll keep this brief. My name is ${a.firstName} ${a.lastName}. I'm a ${a.height}, ${a.weight} lb ${a.position} from ${a.highSchool} in ${a.city}, ${a.state}, Class of ${a.gradYear}, and a coach's son.

I've been researching {{school}}'s program and I'm reaching out because I believe my game is a fit for what you're building. The way your teams play, the toughness, the competitiveness, that's how I was raised and how I play every night.

This past season I started all 25 games and led my team in points, shooting percentage, three-point percentage, steals, deflections, PER, and plus-minus. I averaged ${a.ppg || '{{ppg}}'} ppg, ${a.rpg || '{{rpg}}'} rpg, and ${a.mpg || '{{mpg}}'} mpg while shooting ${a.fgPct || '{{fg_pct}}'} from the field and ${a.threePtPct || '{{three_pt_pct}}'} from three. We finished 3rd at the Montana Class AA State Tournament. My coaches have also credited me for helping develop our younger players and being someone the team looks to on and off the court.

Here is my film: ${a.highlightUrl || '{{highlight_url}}'}

I'd love to set up a call, visit campus, or come get a run in with the squad this spring.

Thank you for your time, Coach {{coach_last}}.

Respectfully,
${a.firstName} ${a.lastName}
406-218-0765
${a.email || ''}
localhustle.org/recruit/${a.slug || ''}${parentLine}`
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
        const errData = await res.json().catch(() => ({}))
        console.error('Template save failed:', res.status, errData)
        alert('Failed to save template: ' + (errData.error || `HTTP ${res.status}`))
      }
    } catch (err: any) {
      console.error('Template save error:', err)
      alert('Failed to save template: ' + (err.message || 'Network error'))
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

  // Load custom outreach queue
  const loadOutreachQueue = async () => {
    if (!athlete) return
    try {
      const res = await fetch(`/api/recruit/outreach-queue?athleteId=${athlete.id}`)
      const data = await res.json()
      if (data.success) {
        setOutreachQueue(data.outreach || [])
      }
    } catch {
      // silently fail
    } finally {
      setQueueLoaded(true)
    }
  }

  // Send a queued custom outreach
  const sendQueuedOutreach = async (outreachId: string) => {
    setSendingOutreachId(outreachId)
    try {
      const res = await fetch('/api/recruit/outreach-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outreachId }),
      })
      const data = await res.json()
      if (data.success) {
        await loadOutreachQueue()
      } else {
        alert('Send failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Send error: ' + err.message)
    } finally {
      setSendingOutreachId(null)
    }
  }

  // Stop a custom outreach sequence
  const stopOutreach = async (outreachId: string) => {
    try {
      await fetch('/api/recruit/outreach-queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: outreachId }),
      })
      await loadOutreachQueue()
    } catch {
      // silently fail
    }
  }

  // Generate follow-up preview messages (client-side mirror of followup-cron templates)
  const getFollowUpPreview = (step: number, item: any) => {
    if (!athlete) return ''
    const coachLast = item.coach_name?.split(' ').pop() || 'Coach'
    const school = item.school || ''
    const highlightUrl = athlete.highlightUrl || ''
    const name = `${athlete.firstName} ${athlete.lastName}`
    const email = athlete.email || ''
    const labels = ['', 'Circling Back', 'Adding Muscle', 'Held My Own', 'Still Growing']
    const bodies: Record<number, string> = {
      1: `Coach ${coachLast},\n\nJust circling back. I'm in the gym 6 days a week this spring putting up 300 shots a day. Still very interested in ${school} and would love to connect when you have a moment.\n\nRespectfully,\n${name}\n${email}`,
      2: `Coach ${coachLast},\n\nPlanning to come back next season with 15 lbs of extra muscle and a tighter handle. Have you had a chance to check my film?\n\nFilm: ${highlightUrl}\n\nRespectfully,\n${name}\n${email}`,
      3: `Coach ${coachLast},\n\nJust wrapped up a week of open runs against college guys in Missoula. Held my own. Still here, still grinding, still interested in ${school}.\n\n${name}\n${email}`,
      4: `Coach ${coachLast},\n\nLast one from me for now. I'll let my work speak. But if you need a gym rat who plays bigger than 6'4 (and I think I'm still growing) and will outwork your whole roster, I'm your guy.\n\nRespectfully,\n${name}\n${email}`,
    }
    return { label: labels[step] || `Step ${step}`, body: bodies[step] || '' }
  }

  // Load target coaches list
  const loadTargetCoaches = async () => {
    if (!athlete) return
    try {
      const res = await fetch(`/api/recruit/coaches?athleteId=${athlete.id}`)
      const data = await res.json()
      if (data.success) {
        const coaches = data.coaches || []
        const favIds = new Set<string>(coaches.filter((c: any) => c.is_favorite).map((c: any) => c.id))
        setFavoriteCoaches(favIds)
        setTargetCoaches(coaches)
      }
    } catch {
      // silently fail
    } finally {
      setTargetCoachesLoaded(true)
    }
  }

  const toggleFavoriteCoach = async (coachId: string) => {
    if (!athlete) return
    const isFav = favoriteCoaches.has(coachId)
    // Optimistic update
    setFavoriteCoaches(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(coachId)
      else next.add(coachId)
      return next
    })
    try {
      const res = await fetch('/api/recruit/coaches/favorite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.id, coachId, favorite: !isFav }),
      })
      if (!res.ok) {
        // Revert on failure
        setFavoriteCoaches(prev => {
          const next = new Set(prev)
          if (isFav) next.add(coachId)
          else next.delete(coachId)
          return next
        })
      }
    } catch {
      // Revert on failure
      setFavoriteCoaches(prev => {
        const next = new Set(prev)
        if (isFav) next.add(coachId)
        else next.delete(coachId)
        return next
      })
    }
  }

  // Load queue and coaches when campaign tab opens
  useEffect(() => {
    if (currentTab === 'campaign' && !queueLoaded && athlete) {
      loadOutreachQueue()
    }
    if (currentTab === 'campaign' && !targetCoachesLoaded && athlete) {
      loadTargetCoaches()
    }
  }, [currentTab, queueLoaded, targetCoachesLoaded, athlete])

  // Load parent access when settings tab opens
  const [parentAccessLoaded, setParentAccessLoaded] = useState(false)
  useEffect(() => {
    if (currentTab === 'settings' && !parentAccessLoaded && athlete) {
      fetch(`/api/recruit/parent-access?athleteId=${athlete.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setParentAccessPrimary(data.primaryEmail)
            setParentAccessList(data.guardians || [])
          }
        })
        .catch(() => {})
        .finally(() => setParentAccessLoaded(true))
    }
  }, [currentTab, parentAccessLoaded, athlete])

  // Load offers when responses tab opens
  useEffect(() => {
    if (currentTab === 'responses' && !offersLoaded && athlete) {
      fetch(`/api/recruit/offers?athleteId=${athlete.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setOffers(data.offers || [])
        })
        .catch(() => {})
        .finally(() => setOffersLoaded(true))
    }
  }, [currentTab, offersLoaded, athlete])

  // Load DM-eligible coaches when campaign tab opens
  const loadDmCoaches = async () => {
    if (!athlete) return
    try {
      const res = await fetch(`/api/recruit/dm/coaches?athleteId=${athlete.id}`)
      const data = await res.json()
      if (data.success) {
        setDmCoaches(data.coaches || [])
      }
    } catch {
      // silently fail
    } finally {
      setDmCoachesLoaded(true)
    }
  }

  // Send a DM to a coach
  const sendDm = async (coachXHandle: string, message: string) => {
    if (!athlete || !message.trim()) return
    setSendingDmTo(coachXHandle)
    setDmResult(null)
    try {
      const res = await fetch('/api/recruit/dm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.id, coachXHandle, message: message.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setDmResult({ success: true, message: `DM sent to @${coachXHandle}` })
        setDmMessage('')
        setDmComposeCoach(null)
        await loadDmCoaches()
      } else {
        setDmResult({ success: false, message: data.error || 'DM failed' })
      }
    } catch (err: any) {
      setDmResult({ success: false, message: err.message })
    } finally {
      setSendingDmTo(null)
    }
  }

  // Fill DM template with coach/athlete data
  const fillDmTemplate = (template: string, coach: any) => {
    return template
      .replace(/\{\{coach_first\}\}/g, coach.firstName || coach.first_name || '')
      .replace(/\{\{coach_last\}\}/g, coach.lastName || coach.last_name || coach.name?.split(' ').pop() || '')
      .replace(/\{\{coach_name\}\}/g, coach.name || `${coach.first_name} ${coach.last_name}`)
      .replace(/\{\{school\}\}/g, coach.school || '')
      .replace(/\{\{division\}\}/g, coach.division || '')
      .replace(/\{\{state\}\}/g, coach.state || '')
      .replace(/\{\{athlete_first\}\}/g, athlete?.firstName || '')
      .replace(/\{\{athlete_last\}\}/g, athlete?.lastName || '')
      .replace(/\{\{position\}\}/g, athlete?.position || '')
      .replace(/\{\{height\}\}/g, athlete?.height || '')
      .replace(/\{\{weight\}\}/g, athlete?.weight || '')
      .replace(/\{\{high_school\}\}/g, athlete?.highSchool || '')
      .replace(/\{\{grad_year\}\}/g, athlete?.gradYear || '')
      .replace(/\{\{highlight_url\}\}/g, athlete?.highlightUrl || '')
      .replace(/\{\{gpa\}\}/g, (athlete as any)?.gpa || '')
  }

  // Load bulk DM status
  const loadBulkDmStatus = async () => {
    if (!athlete) return
    try {
      const res = await fetch(`/api/recruit/dm/bulk?athleteId=${athlete.id}`)
      const data = await res.json()
      if (data.success) {
        setBulkDmStatus({
          sentToday: data.sentToday,
          dailyLimit: data.dailyLimit,
          remainingToday: data.remainingToday,
          totalQueued: data.totalQueued,
        })
        if (data.totalQueued > 0) {
          setBulkDmProgress(prev => ({ ...prev, total: data.totalQueued + data.totalSent }))
        }
      }
    } catch {
      // silently fail
    }
  }

  // Start bulk DM campaign
  const startBulkDm = async () => {
    if (!athlete || !bulkDmTemplate.trim()) return

    const eligibleCoaches = dmCoaches.filter((c: any) => c.dmStatus === 'not_sent')
    if (eligibleCoaches.length === 0) {
      setDmResult({ success: false, message: 'No unsent coaches to DM' })
      return
    }

    setBulkDmSending(true)
    setBulkDmPaused(false)
    setBulkDmLog([])

    try {
      // Queue all DMs via bulk API
      const res = await fetch('/api/recruit/dm/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: athlete.id,
          template: bulkDmTemplate,
          coachIds: eligibleCoaches.map((c: any) => c.id),
        }),
      })
      const data = await res.json()
      if (!data.success && data.queued === undefined) {
        setDmResult({ success: false, message: data.error || 'Failed to queue DMs' })
        setBulkDmSending(false)
        return
      }

      setBulkDmProgress({ sent: 0, total: data.queued || 0, failed: 0 })
      setDmResult({ success: true, message: `${data.queued} DMs queued. Sending...` })

      // Now send them one by one with delays
      await processBulkDmQueue(data.queued || 0)
    } catch (err: any) {
      setDmResult({ success: false, message: err.message || 'Bulk DM failed' })
      setBulkDmSending(false)
    }
  }

  // Process queued DMs one at a time
  const processBulkDmQueue = async (totalToSend: number) => {
    let sentCount = 0
    let failedCount = 0

    for (let i = 0; i < totalToSend; i++) {
      // Check if paused or stopped
      // We use a ref-like approach through the state setter to check current value
      const shouldContinue = await new Promise<boolean>((resolve) => {
        setBulkDmPaused(current => {
          resolve(!current)
          return current
        })
      })

      if (!shouldContinue) {
        // Paused - break out and let resume pick up
        setDmResult({ success: true, message: `Paused after ${sentCount} sent, ${failedCount} failed. ${totalToSend - sentCount - failedCount} remaining.` })
        return
      }

      try {
        const res = await fetch('/api/recruit/dm/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId: athlete?.id, action: 'send_next' }),
        })
        const data = await res.json()

        if (data.done) {
          // No more queued DMs
          break
        }

        if (data.success) {
          sentCount++
          setBulkDmProgress(prev => ({ ...prev, sent: prev.sent + 1 }))
          setBulkDmLog(prev => [...prev, { coach: data.sent?.coachXHandle || 'unknown', success: true }])
        } else if (res.status === 429) {
          // Daily limit reached
          setDmResult({ success: false, message: `Daily limit reached (${data.sentToday}/${data.dailyLimit}). Remaining DMs will be sent tomorrow.` })
          setBulkDmSending(false)
          await loadDmCoaches()
          return
        } else {
          failedCount++
          setBulkDmProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
          setBulkDmLog(prev => [...prev, { coach: data.failedCoach || 'unknown', success: false, error: data.error }])
        }

        // Rate limit: wait 3 seconds between DMs to be safe
        if (i < totalToSend - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (err: any) {
        failedCount++
        setBulkDmProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
        setBulkDmLog(prev => [...prev, { coach: 'unknown', success: false, error: err.message }])
      }
    }

    setBulkDmSending(false)
    setDmResult({ success: true, message: `Bulk DM complete: ${sentCount} sent, ${failedCount} failed.` })
    await loadDmCoaches()
    await loadBulkDmStatus()
  }

  // Cancel all queued DMs
  const cancelBulkDm = async () => {
    if (!athlete) return
    try {
      const res = await fetch('/api/recruit/dm/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.id, action: 'cancel' }),
      })
      const data = await res.json()
      setBulkDmSending(false)
      setBulkDmPaused(false)
      setBulkDmProgress({ sent: 0, total: 0, failed: 0 })
      setDmResult({ success: true, message: data.message || 'Queued DMs cancelled' })
      await loadDmCoaches()
      await loadBulkDmStatus()
    } catch (err: any) {
      setDmResult({ success: false, message: err.message })
    }
  }

  // Load X engagement status (follows/likes)
  const loadXEngagements = async () => {
    if (!athlete) return
    try {
      const res = await fetch(`/api/recruit/x-engage?athleteId=${athlete.id}`)
      const data = await res.json()
      if (data.success) {
        setXEngagements(data.engagements || {})
      }
    } catch {
      // silently fail
    } finally {
      setXEngagementsLoaded(true)
    }
  }

  // Follow a coach on X
  const followOnX = async (coach: any) => {
    if (!athlete) return
    const handle = coach.x_handle.startsWith('@') ? coach.x_handle.slice(1) : coach.x_handle
    setXEngageLoading(`follow-${handle}`)
    setXEngageResult(null)
    try {
      const res = await fetch('/api/recruit/x-engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.id, action: 'follow', targetXHandle: handle, coachId: coach.id }),
      })
      const data = await res.json()
      if (data.success) {
        setXEngageResult({ success: true, message: data.alreadyDone ? `Already following @${handle}` : `Now following @${handle}` })
        setXEngagements(prev => ({
          ...prev,
          [handle.toLowerCase()]: { ...(prev[handle.toLowerCase()] || { followed: false, likedTweets: [] }), followed: true }
        }))
      } else {
        setXEngageResult({ success: false, message: data.error || 'Follow failed' })
      }
    } catch (err: any) {
      setXEngageResult({ success: false, message: err.message })
    } finally {
      setXEngageLoading(null)
    }
  }

  // Like a coach's latest tweet
  const likeLatestTweet = async (coach: any) => {
    if (!athlete) return
    const handle = coach.x_handle.startsWith('@') ? coach.x_handle.slice(1) : coach.x_handle
    setXEngageLoading(`like-${handle}`)
    setXEngageResult(null)
    try {
      if (!athlete.xConnected) {
        setXEngageResult({ success: false, message: 'Connect your X account first' })
        return
      }

      const res = await fetch('/api/recruit/x-engage/latest-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.id, targetXHandle: handle, coachId: coach.id }),
      })
      const data = await res.json()
      if (data.success) {
        setXEngageResult({ success: true, message: data.alreadyDone ? 'Already liked latest tweet' : `Liked @${handle}'s tweet` })
        setXEngagements(prev => {
          const existing = prev[handle.toLowerCase()] || { followed: false, likedTweets: [] }
          return {
            ...prev,
            [handle.toLowerCase()]: { ...existing, likedTweets: [...existing.likedTweets, data.tweetId] }
          }
        })
      } else {
        setXEngageResult({ success: false, message: data.error || 'Like failed' })
      }
    } catch (err: any) {
      setXEngageResult({ success: false, message: err.message })
    } finally {
      setXEngageLoading(null)
    }
  }

  useEffect(() => {
    if (currentTab === 'campaign' && !dmCoachesLoaded && athlete) {
      loadDmCoaches()
    }
  }, [currentTab, dmCoachesLoaded, athlete])

  // Load X engagements when DM hub loads
  useEffect(() => {
    if (currentTab === 'campaign' && !xEngagementsLoaded && athlete?.xConnected) {
      loadXEngagements()
    }
  }, [currentTab, xEngagementsLoaded, athlete])

  // Load bulk DM status when DM hub loads
  useEffect(() => {
    if (currentTab === 'campaign' && dmCoachesLoaded && athlete?.xConnected) {
      loadBulkDmStatus()
    }
  }, [currentTab, dmCoachesLoaded, athlete])

  // Set default DM template when athlete data loads
  useEffect(() => {
    if (athlete && !bulkDmTemplate) {
      setBulkDmTemplate(`Coach {{coach_last}}, my name is {{athlete_first}} {{athlete_last}}. I'm a {{height}}, {{weight}} lb {{position}} from {{high_school}} (Class of {{grad_year}}). I'm very interested in {{school}} and would love to connect. Here's my film: {{highlight_url}}`)
    }
  }, [athlete, bulkDmTemplate])

  // Load deliverability stats when campaign tab opens
  useEffect(() => {
    if (currentTab === 'campaign' && athlete && !deliverabilityLoading && !deliverability) {
      setDeliverabilityLoading(true)
      fetch(`/api/recruit/deliverability?athleteId=${athlete.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.stats) setDeliverability(data)
        })
        .catch(() => { /* silently fail */ })
        .finally(() => setDeliverabilityLoading(false))
    }
  }, [currentTab, athlete, deliverability, deliverabilityLoading])

  // Load coach engagement scores when campaign tab opens
  useEffect(() => {
    if (currentTab === 'campaign' && athlete && !engagementLoaded) {
      fetch(`/api/recruit/engagement?athleteId=${athlete.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.coaches) setEngagementData(data)
        })
        .catch(() => { /* silently fail */ })
        .finally(() => setEngagementLoaded(true))
    }
  }, [currentTab, athlete, engagementLoaded])

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
        {(['profile', 'campaign', 'followups', 'responses', 'messages', 'settings'] as const).map((tab) => (
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
                  try {
                    // Compress image client-side to stay under Vercel's 4.5MB limit
                    const compress = (f: File): Promise<Blob> => {
                      return new Promise((resolve, reject) => {
                        const img = new Image()
                        const objectUrl = URL.createObjectURL(f)
                        img.onload = () => {
                          URL.revokeObjectURL(objectUrl)
                          const canvas = document.createElement('canvas')
                          const maxSize = 800
                          let w = img.width, h = img.height
                          if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
                          else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
                          canvas.width = w; canvas.height = h
                          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
                          canvas.toBlob((blob) => {
                            if (blob) resolve(blob)
                            else reject(new Error('Failed to compress image'))
                          }, 'image/jpeg', 0.85)
                        }
                        img.onerror = () => {
                          URL.revokeObjectURL(objectUrl)
                          reject(new Error('Failed to load image'))
                        }
                        img.src = objectUrl
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
                  } catch (uploadError: any) {
                    console.error('Image upload error:', uploadError)
                    alert('Failed to upload image: ' + (uploadError.message || 'Unknown error'))
                  }
                  // Reset input so re-selecting the same file triggers onChange
                  e.target.value = ''
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
                { step: 1, text: athlete.xConnected ? 'X account connected ✓' : 'Connect X account for DM outreach', done: athlete.xConnected, action: () => { setCurrentTab('campaign'); setTimeout(() => document.getElementById('dm-hub-section')?.scrollIntoView({ behavior: 'smooth' }), 200); } },
                { step: 2, text: `Review your target coaches`, done: sendCount.total > 0, action: () => { setCurrentTab('campaign'); setShowCoachesList(true); if (!targetCoachesLoaded) loadTargetCoaches(); setTimeout(() => document.getElementById('target-coaches-section')?.scrollIntoView({ behavior: 'smooth' }), 200); } },
                { step: 3, text: 'Set up email & DM templates', done: !!templateBody, action: () => { setCurrentTab('campaign'); setEditingTemplate(true); setTimeout(() => document.getElementById('outreach-letter-section')?.scrollIntoView({ behavior: 'smooth' }), 200); } },
                { step: 4, text: 'Launch automated outreach campaign', done: campaignStatus === 'active', action: () => { setCurrentTab('campaign'); setTimeout(() => document.getElementById('send-buttons-section')?.scrollIntoView({ behavior: 'smooth' }), 200); } },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0, background: item.done ? '#4caf50' : '#e0e0e0', color: item.done ? 'white' : '#666' }}>
                    {item.done ? '\u2713' : item.step}
                  </span>
                  <button type="button" onClick={() => { console.log('Checklist step clicked:', item.step); item.action(); }} style={{ fontSize: '0.875rem', color: item.done ? '#4caf50' : '#1976d2', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left', fontFamily: 'inherit', fontWeight: 500, background: 'none', border: 'none', padding: '0.25rem 0', lineHeight: 1.3 }}>{item.text}</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Highlight Video</h3>
              {!editingHighlight ? (
                <button
                  onClick={() => { setHighlightDraft(athlete.highlightUrl || ''); setEditingHighlight(true) }}
                  className="dash-btn-outline"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  {athlete.highlightUrl ? 'Edit URL' : 'Add URL'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setEditingHighlight(false)} className="dash-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                  <button
                    disabled={savingHighlight}
                    onClick={async () => {
                      setSavingHighlight(true)
                      const res = await fetch('/api/recruit/update-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ athleteId: id, field: 'highlight_url', value: highlightDraft.trim() }),
                      })
                      if (res.ok) {
                        setAthlete(prev => prev ? { ...prev, highlightUrl: highlightDraft.trim() } : prev)
                        setEditingHighlight(false)
                      } else {
                        alert('Failed to save highlight URL')
                      }
                      setSavingHighlight(false)
                    }}
                    className="dash-btn-outline"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: '#1976d2', color: 'white', border: 'none' }}
                  >
                    {savingHighlight ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            {editingHighlight ? (
              <input
                type="url"
                value={highlightDraft}
                onChange={(e) => setHighlightDraft(e.target.value)}
                placeholder="Paste YouTube, Hudl, or other video URL"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            ) : athlete.highlightUrl ? (
              (() => {
                const url = athlete.highlightUrl
                const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
                if (ytMatch) {
                  return (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )
                }
                return (
                  <div style={{ background: '#f5f5f5', padding: '2rem', textAlign: 'center', borderRadius: '12px' }}>
                    <p style={{ color: '#666', marginBottom: '0.5rem' }}>Highlight Video</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'green', fontWeight: 'bold' }}>
                      Watch Highlights &rarr;
                    </a>
                  </div>
                )
              })()
            ) : (
              <div style={{ padding: '2rem', border: '2px dashed #ddd', borderRadius: '12px', textAlign: 'center', color: '#999' }}>
                No highlight video added yet
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
              {[0, 1, 2].map((i) => {
                const photoUrl = athletePhotos[i] || null
                return (
                  <div
                    key={i}
                    style={{ aspectRatio: '1', border: photoUrl ? 'none' : '2px dashed #ddd', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', cursor: 'pointer', fontSize: '1.5rem', position: 'relative', overflow: 'hidden', background: photoUrl ? '#000' : '#fafafa' }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#1976d2'; e.currentTarget.style.background = '#e3f2fd' }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.background = photoUrl ? '#000' : '#fafafa' }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      e.currentTarget.style.borderColor = '#ddd'
                      e.currentTarget.style.background = photoUrl ? '#000' : '#fafafa'
                      const file = e.dataTransfer.files?.[0]
                      if (!file || !file.type.startsWith('image/')) return
                      await uploadAthletePhoto(file, i)
                    }}
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (!file) return
                        await uploadAthletePhoto(file, i)
                      }
                      input.click()
                    }}
                  >
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteAthletePhoto(i)
                          }}
                          style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </>
                    ) : uploadingPhotoIdx === i ? (
                      <span style={{ fontSize: '0.8rem', color: '#1976d2' }}>Uploading...</span>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '2rem', display: 'block' }}>+</span>
                        <span style={{ fontSize: '0.65rem', display: 'block', marginTop: '0.25rem' }}>Click or drag</span>
                      </div>
                    )}
                  </div>
                )
              })}
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

          {/* March Madness Blast */}
          <div className="dash-card" style={{ borderColor: '#e65100', borderWidth: '2px', background: '#fff8f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0, color: '#e65100' }}>March Madness Blast</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', background: '#e65100', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>LIMITED TIME</span>
            </div>
            <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Send a personal congrats email + queue DMs to all D1 coaches in the tournament. Personalized by school — fires immediately.
            </p>
            <MarchMadnessBlast athleteId={athlete.id} />
          </div>

          {/* Full DB Campaign Blast */}
          <div className="dash-card" style={{ borderColor: '#1976d2', borderWidth: '2px', background: '#f5f9ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0, color: '#1976d2' }}>Full Campaign Blast</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', background: '#1976d2', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>APRIL 1</span>
            </div>
            <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Send the initial outreach letter to all D1, D2, D3, and NAIA coaches in the database. Follow-ups are handled automatically by the campaign cron.
            </p>
            <FullDbBlast athleteId={athlete.id} />
          </div>

          {/* Follow-up: Clickers Blast */}
          <div className="dash-card" style={{ borderColor: '#7b1fa2', borderWidth: '1.5px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#7b1fa2' }}>Follow-Up: Coaches Who Clicked</h3>
            <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Send a personalised follow-up to coaches who clicked your profile link in the first campaign. Mentions gym work, added muscle, and urgency around deciding soon.
            </p>
            <FollowupClickersBlast athleteId={athlete.id} />
          </div>

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
          <div id="outreach-letter-section" className="dash-card" style={{ borderColor: '#1976d2', borderWidth: '1.5px' }}>
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
                    {'{{coach_first}} {{coach_last}} {{school}} {{athlete_first}} {{athlete_last}} {{position}} {{height}} {{weight}} {{high_school}} {{city}} {{state}} {{grad_year}} {{ppg}} {{rpg}} {{mpg}} {{fg_pct}} {{three_pt_pct}} {{highlight_url}} {{athlete_email}} {{parent_name}} {{parent_email}}'}
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
                  <pre style={{ fontSize: '0.8rem', color: '#333', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: "'Courier New', Courier, monospace", lineHeight: 1.6 }}>
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

                {/* Sample Proof — what the coach actually receives */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: '#1976d2', userSelect: 'none' }}>
                    👁 View Sample Message (as coach sees it)
                  </summary>
                  <div style={{ marginTop: '0.75rem', background: 'white', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.7rem', color: '#999', margin: '0 0 0.15rem' }}>From: <span style={{ color: '#333' }}>{athlete?.firstName} {athlete?.lastName} &lt;{athlete?.firstName?.toLowerCase()}.{athlete?.lastName?.toLowerCase()}@localhustle.org&gt;</span></p>
                      <p style={{ fontSize: '0.7rem', color: '#999', margin: '0 0 0.15rem' }}>To: <span style={{ color: '#333' }}>Coach Williams &lt;williams@sampleuniversity.edu&gt;</span></p>
                      <p style={{ fontSize: '0.7rem', color: '#999', margin: 0 }}>Subject: <span style={{ color: '#333', fontWeight: 'bold' }}>{(templateSubject || '')
                        .replace(/\{\{school\}\}/g, 'Sample University')
                        .replace(/\{\{coach_last\}\}/g, 'Williams')
                        .replace(/\{\{coach_first\}\}/g, 'Coach')}</span></p>
                    </div>
                    <pre style={{ fontSize: '0.8rem', color: '#333', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: "'Courier New', Courier, monospace", lineHeight: 1.6 }}>
                      {(templateBody || '')
                        .replace(/\{\{coach_last\}\}/g, 'Williams')
                        .replace(/\{\{coach_first\}\}/g, 'Coach')
                        .replace(/\{\{school\}\}/g, 'Sample University')
                        .replace(/\{\{coach_title\}\}/g, 'Head Coach')
                        .replace(/\{\{athlete_first\}\}/g, athlete?.firstName || '')
                        .replace(/\{\{athlete_last\}\}/g, athlete?.lastName || '')
                        .replace(/\{\{position\}\}/g, athlete?.position || '')
                        .replace(/\{\{height\}\}/g, athlete?.height || '')
                        .replace(/\{\{weight\}\}/g, athlete?.weight || '')
                        .replace(/\{\{high_school\}\}/g, athlete?.highSchool || '')
                        .replace(/\{\{city\}\}/g, athlete?.city || '')
                        .replace(/\{\{state\}\}/g, athlete?.state || '')
                        .replace(/\{\{grad_year\}\}/g, athlete?.gradYear || '')
                        .replace(/\{\{ppg\}\}/g, athlete?.ppg || '')
                        .replace(/\{\{rpg\}\}/g, athlete?.rpg || '')
                        .replace(/\{\{mpg\}\}/g, athlete?.mpg || '')
                        .replace(/\{\{fg_pct\}\}/g, athlete?.fgPct || '')
                        .replace(/\{\{three_pt_pct\}\}/g, athlete?.threePtPct || '')
                        .replace(/\{\{highlight_url\}\}/g, athlete?.highlightUrl || '')
                        .replace(/\{\{athlete_email\}\}/g, athlete?.email || '')
                        .replace(/\{\{parent_name\}\}/g, athlete?.parentName || '')
                        .replace(/\{\{parent_email\}\}/g, athlete?.parentEmail || '')}
                    </pre>
                  </div>
                  <div style={{ marginTop: '0.75rem', background: '#f0f8ff', border: '1px solid #b3d9ff', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#1da1f2', marginBottom: '0.25rem' }}>Sample X DM</p>
                    <p style={{ fontSize: '0.8rem', color: '#333', margin: 0, lineHeight: 1.5, fontFamily: "'Courier New', Courier, monospace" }}>
                      Coach Williams, my name is {athlete?.firstName} {athlete?.lastName}. I&apos;m a {athlete?.height}, {athlete?.weight} lb {athlete?.position} from {athlete?.highSchool} (Class of {athlete?.gradYear}). I&apos;m very interested in Sample University and would love to connect. Here&apos;s my film: {athlete?.highlightUrl || '[highlight link]'}
                    </p>
                  </div>
                </details>
              </>
            )}
          </div>

          {/* Target Coaches List */}
          <div id="target-coaches-section" className="dash-card" style={{ borderColor: '#7b1fa2', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', margin: 0, color: '#7b1fa2' }}>Target Coaches</h3>
              <button
                onClick={() => { setShowCoachesList(!showCoachesList); if (!targetCoachesLoaded) loadTargetCoaches(); }}
                className="dash-btn-outline"
                style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}
              >
                {showCoachesList ? 'Hide List' : `View All (${targetCoaches.length || '...'})`}
              </button>
            </div>

            {/* Stats bar */}
            {targetCoachesLoaded && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total', value: targetCoaches.length, color: '#7b1fa2' },
                  { label: 'Emailed', value: targetCoaches.filter((c: any) => c.emailed).length, color: '#2e7d32' },
                  { label: 'Responded', value: targetCoaches.filter((c: any) => c.responded).length, color: '#1976d2' },
                  { label: 'Not Contacted', value: targetCoaches.filter((c: any) => c.outreach_status === 'not_contacted').length, color: '#e65100' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', padding: '0.5rem 0.75rem', flex: 1, minWidth: '70px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0, color: s.color }}>{s.value}</p>
                    <p style={{ color: '#999', fontSize: '0.6rem', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {showCoachesList && (
              <>
                {/* Search + filter */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search by name, school, or state..."
                    value={coachSearch}
                    onChange={(e) => setCoachSearch(e.target.value)}
                    style={{ flex: 1, minWidth: '180px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit' }}
                  />
                  <select
                    value={coachFilter}
                    onChange={(e) => setCoachFilter(e.target.value as any)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit', background: 'white' }}
                  >
                    <option value="all">All</option>
                    <option value="not_contacted">Not Contacted</option>
                    <option value="emailed">Emailed</option>
                    <option value="responded">Responded</option>
                  </select>
                </div>

                {/* Coach list */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                  {/* Header row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '0.3fr 2fr 2fr 0.8fr 1fr 1.2fr', padding: '0.5rem 0.75rem', background: '#f5f5f5', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', letterSpacing: '0.03em', position: 'sticky', top: 0 }}>
                    <span></span>
                    <span>Coach</span>
                    <span>School</span>
                    <span>Div</span>
                    <span>State</span>
                    <span>Status</span>
                  </div>
                  {targetCoaches
                    .filter((c: any) => {
                      if (coachFilter !== 'all' && c.outreach_status !== coachFilter) return false
                      if (coachSearch) {
                        const q = coachSearch.toLowerCase()
                        return (
                          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
                          (c.school || '').toLowerCase().includes(q) ||
                          (c.state || '').toLowerCase().includes(q) ||
                          (c.email || '').toLowerCase().includes(q)
                        )
                      }
                      return true
                    })
                    .sort((a: any, b: any) => {
                      const aFav = favoriteCoaches.has(a.id) ? 0 : 1
                      const bFav = favoriteCoaches.has(b.id) ? 0 : 1
                      return aFav - bFav
                    })
                    .map((c: any) => (
                      <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '0.3fr 2fr 2fr 0.8fr 1fr 1.2fr', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.8rem', alignItems: 'center' }}>
                        <span
                          onClick={() => toggleFavoriteCoach(c.id)}
                          style={{ cursor: 'pointer', fontSize: '1rem', color: favoriteCoaches.has(c.id) ? '#f9a825' : '#ccc', userSelect: 'none' }}
                          title={favoriteCoaches.has(c.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {favoriteCoaches.has(c.id) ? '\u2605' : '\u2606'}
                        </span>
                        <div>
                          <span style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</span>
                          {c.title && <span style={{ color: '#999', fontSize: '0.7rem', display: 'block' }}>{c.title}</span>}
                        </div>
                        <span style={{ color: '#333' }}>{c.school}</span>
                        <span style={{ color: '#7b1fa2', fontWeight: 'bold', fontSize: '0.7rem' }}>{c.division || '—'}</span>
                        <span style={{ color: '#666' }}>{c.state || '—'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {c.outreach_status === 'responded' && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#e3f2fd', color: '#1976d2', padding: '0.15rem 0.4rem', borderRadius: '9999px' }}>Responded</span>
                          )}
                          {c.outreach_status === 'emailed' && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#e8f5e9', color: '#2e7d32', padding: '0.15rem 0.4rem', borderRadius: '9999px' }}>Emailed</span>
                          )}
                          {c.outreach_status === 'queued' && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#fff3e0', color: '#e65100', padding: '0.15rem 0.4rem', borderRadius: '9999px' }}>Queued</span>
                          )}
                          {c.outreach_status === 'not_contacted' && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#f5f5f5', color: '#999', padding: '0.15rem 0.4rem', borderRadius: '9999px' }}>Not Contacted</span>
                          )}
                          {c.dmd && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#e8f5fe', color: '#1da1f2', padding: '0.15rem 0.4rem', borderRadius: '9999px' }}>DM&apos;d</span>
                          )}
                        </div>
                      </div>
                    ))}
                  {targetCoaches.filter((c: any) => {
                    if (coachFilter !== 'all' && c.outreach_status !== coachFilter) return false
                    if (coachSearch) {
                      const q = coachSearch.toLowerCase()
                      return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || (c.school || '').toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q)
                    }
                    return true
                  }).length === 0 && (
                    <p style={{ textAlign: 'center', color: '#999', padding: '1.5rem', fontSize: '0.85rem' }}>No coaches match your filters.</p>
                  )}
                </div>
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
            <div id="send-buttons-section" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
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
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {campaignResult.upNext.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.8rem', color: '#999' }}>
                          <span>{c.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{c.school} {c.division && <span style={{ fontSize: '0.7rem' }}>({c.division})</span>}</span>
                            <button
                              onClick={async () => {
                                const defaultBody = `Coach ${c.name.split(' ').pop()},\n\nMy name is ${athlete?.firstName} ${athlete?.lastName}, a ${athlete?.height}, ${athlete?.weight} lb ${athlete?.position} from ${athlete?.highSchool} in ${athlete?.city}, ${athlete?.state} (Class of ${athlete?.gradYear}).\n\n[Add your personalized message here - why this specific program?]\n\nMy highlight film: ${athlete?.highlightUrl || ''}\n\nRespectfully,\n${athlete?.firstName} ${athlete?.lastName}\n${athlete?.email}`
                                const res = await fetch('/api/recruit/outreach-queue', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    athleteId: athlete?.id,
                                    coachId: c.id,
                                    subject: `Interest in ${c.school} - ${athlete?.firstName} ${athlete?.lastName}, Class of ${athlete?.gradYear}`,
                                    body: defaultBody,
                                  }),
                                })
                                const data = await res.json()
                                if (data.success) {
                                  await loadOutreachQueue()
                                  alert(`${c.name} moved to Personalized Queue — edit the letter before sending!`)
                                }
                              }}
                              style={{ padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#e65100', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 'bold', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              Personalize
                            </button>
                          </div>
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

          {/* Personalized Outreach Queue */}
          <div className="dash-card" style={{ borderColor: '#e65100', borderWidth: '1.5px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#e65100' }}>Personalized Outreach Queue</h3>
            <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Custom letters with automatic weekly follow-ups: Checking in &rarr; Did you see my film &rarr; I&apos;m in the gym &rarr; Will work for food
            </p>

            {outreachQueue.length === 0 && queueLoaded && (
              <p style={{ color: '#999', fontSize: '0.85rem', fontStyle: 'italic' }}>No personalized outreach queued yet.</p>
            )}

            {outreachQueue.map((item) => (
              <div key={item.id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.5rem', background: item.status === 'queued' ? '#fff8e1' : item.status === 'sent' ? '#e8f5e9' : item.status === 'responded' ? '#e3f2fd' : '#f5f5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0, color: '#333' }}>{item.coach_name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>{item.school} {item.division && <span style={{ fontWeight: 'bold', color: '#7b1fa2' }}>({item.division})</span>}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: item.status === 'queued' ? '#fff3e0' : item.status === 'sent' ? '#e8f5e9' : item.status === 'responded' ? '#e3f2fd' : '#eee',
                      color: item.status === 'queued' ? '#e65100' : item.status === 'sent' ? '#2e7d32' : item.status === 'responded' ? '#1565c0' : '#999',
                    }}>
                      {item.status === 'queued' ? 'Ready to Send' : item.status === 'sent' ? `Step ${item.followup_step}/4` : item.status === 'responded' ? 'Responded!' : 'Stopped'}
                    </span>
                    {item.followup_step > 0 && item.status === 'sent' && (
                      <p style={{ fontSize: '0.65rem', color: '#999', margin: '0.2rem 0 0 0' }}>
                        Next follow-up: {item.next_send_at ? new Date(item.next_send_at).toLocaleDateString() : 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.25rem 0', fontStyle: 'italic' }}>
                  &ldquo;{item.subject}&rdquo;
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {item.status === 'queued' && (
                    <button
                      onClick={() => sendQueuedOutreach(item.id)}
                      disabled={sendingOutreachId === item.id}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', background: sendingOutreachId === item.id ? '#ccc' : '#22c55e', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', fontFamily: 'inherit' }}
                    >
                      {sendingOutreachId === item.id ? 'Sending...' : 'Send Now'}
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewOutreachId(previewOutreachId === item.id ? null : item.id)}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', background: previewOutreachId === item.id ? '#1976d2' : 'transparent', color: previewOutreachId === item.id ? 'white' : '#1976d2', border: '1px solid #1976d2', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit', fontWeight: 'bold' }}
                  >
                    {previewOutreachId === item.id ? 'Hide Preview' : 'Preview All Messages'}
                  </button>
                  {(item.status === 'queued' || item.status === 'sent') && (
                    <button
                      onClick={() => { if (confirm(`Stop the outreach sequence to ${item.coach_name} at ${item.school}? No more follow-ups will be sent.`)) stopOutreach(item.id) }}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', background: 'transparent', color: '#ef5350', border: '1px solid #ef5350', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit' }}
                    >
                      {item.status === 'sent' ? '■ Stop Sequence' : '✕ Remove'}
                    </button>
                  )}
                </div>

                {/* Expandable message preview */}
                {previewOutreachId === item.id && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid #ddd', paddingTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Sequence Preview</p>

                    {/* Step 0: Initial outreach (already sent or queued) */}
                    <div style={{ marginBottom: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: (item.followup_step >= 1 || item.status === 'sent') ? '#e8f5e9' : '#fff8e1', borderLeft: '3px solid #4caf50' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#333' }}>Initial Letter</span>
                        <span style={{ fontSize: '0.6rem', color: (item.followup_step >= 1 || item.status === 'sent') ? '#4caf50' : '#e65100', fontWeight: 'bold' }}>
                          {(item.followup_step >= 1 || item.status === 'sent') ? '✓ Sent' : 'Queued'}
                        </span>
                      </div>
                      <pre style={{ fontSize: '0.7rem', color: '#555', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.4, maxHeight: '120px', overflow: 'auto' }}>{item.body}</pre>
                    </div>

                    {/* Steps 1-4: Follow-ups */}
                    {[1, 2, 3, 4].map((step) => {
                      const preview = getFollowUpPreview(step, item)
                      const isSent = item.followup_step > step
                      const isCurrent = item.followup_step === step && item.status === 'sent'
                      const isPending = item.followup_step < step && item.status === 'sent'
                      const isStopped = item.status === 'stopped'
                      return (
                        <div key={step} style={{
                          marginBottom: '0.6rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          background: isSent ? '#e8f5e9' : isCurrent ? '#fff8e1' : isStopped ? '#f5f5f5' : '#fafafa',
                          borderLeft: `3px solid ${isSent ? '#4caf50' : isCurrent ? '#ff9800' : '#ddd'}`,
                          opacity: (isStopped && !isSent) ? 0.5 : 1,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#333' }}>
                              Step {step}: {preview.label}
                            </span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: isSent ? '#4caf50' : isCurrent ? '#ff9800' : '#999' }}>
                              {isSent ? '✓ Sent' : isCurrent ? `Next: ${item.next_send_at ? new Date(item.next_send_at).toLocaleDateString() : 'Scheduled'}` : isStopped ? 'Cancelled' : 'Pending'}
                            </span>
                          </div>
                          <pre style={{ fontSize: '0.7rem', color: '#555', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.4, maxHeight: '120px', overflow: 'auto' }}>{preview.body}</pre>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* X DM Outreach Hub */}
          <div id="dm-hub-section" className="dash-card" style={{ borderColor: '#1da1f2', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', margin: 0, color: '#1da1f2' }}>X / DM Outreach</h3>
              {athlete?.xConnected && (
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#e8f5fe', color: '#1da1f2', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  Connected
                </span>
              )}
            </div>

            {!athlete?.xConnected ? (
              <div style={{ background: '#f9f9f9', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Connect your X account to DM coaches directly.</p>
                <a href={`/api/auth/x/authorize?athleteId=${athlete?.id}`} style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#1da1f2', color: 'white', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.8rem', textDecoration: 'none' }}>
                  Connect X Account
                </a>
              </div>
            ) : (
              <>
                {/* DM result toast */}
                {dmResult && (
                  <div style={{ background: dmResult.success ? '#e6f9e6' : '#fff3e0', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 'bold', color: dmResult.success ? '#2e7d32' : '#e65100' }}>{dmResult.message}</span>
                  </div>
                )}

                {/* X Engagement result toast */}
                {xEngageResult && (
                  <div style={{ background: xEngageResult.success ? '#e6f9e6' : '#fff3e0', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 'bold', color: xEngageResult.success ? '#2e7d32' : '#e65100' }}>{xEngageResult.message}</span>
                    <button onClick={() => setXEngageResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', marginLeft: '0.5rem', fontSize: '0.75rem' }}>&times;</button>
                  </div>
                )}

                {/* Compose DM overlay */}
                {dmComposeCoach && (
                  <div style={{ background: '#f0f8ff', border: '1px solid #1da1f2', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0 }}>
                        DM to {dmComposeCoach.x_handle?.startsWith('@') ? dmComposeCoach.x_handle : `@${dmComposeCoach.x_handle}`} <span style={{ fontWeight: 'normal', color: '#666' }}>({dmComposeCoach.name} — {dmComposeCoach.school})</span>
                      </p>
                      <button onClick={() => { setDmComposeCoach(null); setDmMessage('') }} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#999' }}>&times;</button>
                    </div>
                    <textarea
                      value={dmMessage}
                      onChange={(e) => setDmMessage(e.target.value)}
                      placeholder={`Coach ${dmComposeCoach.name.split(' ').pop()}, I'm ${athlete?.firstName} ${athlete?.lastName}, a ${athlete?.position} from ${athlete?.highSchool}...`}
                      rows={4}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => sendDm(dmComposeCoach.x_handle, dmMessage)}
                        disabled={sendingDmTo === dmComposeCoach.x_handle || !dmMessage.trim()}
                        style={{ padding: '0.4rem 1rem', borderRadius: '9999px', background: sendingDmTo ? '#ccc' : '#1da1f2', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'inherit' }}
                      >
                        {sendingDmTo === dmComposeCoach.x_handle ? 'Sending...' : 'Send DM'}
                      </button>
                      <button
                        onClick={() => {
                          setDmMessage(`Coach ${dmComposeCoach.name.split(' ').pop()}, my name is ${athlete?.firstName} ${athlete?.lastName}. I'm a ${athlete?.height}, ${athlete?.weight} lb ${athlete?.position} from ${athlete?.highSchool} (Class of ${athlete?.gradYear}). I'm very interested in ${dmComposeCoach.school} and would love to connect. Here's my film: ${athlete?.highlightUrl || '[highlight link]'}`)
                        }}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '9999px', background: 'transparent', color: '#1da1f2', border: '1px solid #1da1f2', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit' }}
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>
                )}

                {/* Bulk DM Controls */}
                {dmCoaches.length > 0 && !dmComposeCoach && (
                  <div style={{ background: '#f8fbff', border: '1px solid #e0ecf8', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0, color: '#1a73e8' }}>Bulk DM Campaign</p>
                      {bulkDmStatus && (
                        <span style={{ fontSize: '0.65rem', color: '#666' }}>
                          {bulkDmStatus.sentToday}/{bulkDmStatus.dailyLimit} sent today
                        </span>
                      )}
                    </div>

                    {/* Template textarea */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                        DM Template — variables: {'{{coach_last}}'} {'{{school}}'} {'{{athlete_first}}'} {'{{athlete_last}}'} {'{{position}}'} {'{{height}}'} {'{{weight}}'} {'{{high_school}}'} {'{{grad_year}}'} {'{{highlight_url}}'}
                      </label>
                      <textarea
                        value={bulkDmTemplate}
                        onChange={(e) => setBulkDmTemplate(e.target.value)}
                        rows={4}
                        placeholder="Coach {{coach_last}}, my name is {{athlete_first}} {{athlete_last}}..."
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                        disabled={bulkDmSending}
                      />
                    </div>

                    {/* Preview */}
                    {bulkDmShowPreview && (
                      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#333', margin: '0 0 0.4rem' }}>Preview (first 3 unsent coaches):</p>
                        {dmCoaches
                          .filter((c: any) => c.dmStatus === 'not_sent')
                          .slice(0, 3)
                          .map((c: any, idx: number) => (
                            <div key={c.id} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff', borderRadius: '6px', padding: '0.4rem 0.5rem', marginBottom: '0.3rem', border: '1px solid #eee' }}>
                              <p style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#1da1f2', margin: '0 0 0.2rem' }}>
                                To: {c.x_handle?.startsWith('@') ? c.x_handle : `@${c.x_handle}`} ({c.name} — {c.school})
                              </p>
                              <p style={{ fontSize: '0.75rem', color: '#333', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.3' }}>
                                {fillDmTemplate(bulkDmTemplate, c)}
                              </p>
                            </div>
                          ))}
                        {dmCoaches.filter((c: any) => c.dmStatus === 'not_sent').length === 0 && (
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>No unsent coaches to preview.</p>
                        )}
                      </div>
                    )}

                    {/* Progress bar */}
                    {bulkDmSending && bulkDmProgress.total > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>
                          <span>{bulkDmProgress.sent} sent{bulkDmProgress.failed > 0 ? `, ${bulkDmProgress.failed} failed` : ''}</span>
                          <span>{bulkDmProgress.total - bulkDmProgress.sent - bulkDmProgress.failed} remaining</span>
                        </div>
                        <div style={{ background: '#e0e0e0', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                          <div style={{
                            background: bulkDmPaused ? '#ffa726' : '#1da1f2',
                            height: '100%',
                            borderRadius: '9999px',
                            width: `${Math.round(((bulkDmProgress.sent + bulkDmProgress.failed) / bulkDmProgress.total) * 100)}%`,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        {bulkDmPaused && (
                          <p style={{ fontSize: '0.65rem', color: '#ffa726', fontWeight: 'bold', margin: '0.2rem 0 0' }}>PAUSED</p>
                        )}
                      </div>
                    )}

                    {/* Send log (last 5) */}
                    {bulkDmLog.length > 0 && (
                      <div style={{ marginBottom: '0.5rem', maxHeight: '80px', overflowY: 'auto', fontSize: '0.65rem' }}>
                        {bulkDmLog.slice(-5).map((entry, idx) => (
                          <div key={idx} style={{ color: entry.success ? '#2e7d32' : '#e65100', padding: '0.1rem 0' }}>
                            {entry.success ? '\u2713' : '\u2717'} @{entry.coach}{entry.error ? ` — ${entry.error}` : ''}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {!bulkDmSending ? (
                        <>
                          <button
                            onClick={() => setBulkDmShowPreview(!bulkDmShowPreview)}
                            disabled={!bulkDmTemplate.trim()}
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', background: 'transparent', color: '#1da1f2', border: '1px solid #1da1f2', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            {bulkDmShowPreview ? 'Hide Preview' : 'Preview'}
                          </button>
                          <button
                            onClick={() => {
                              const unsent = dmCoaches.filter((c: any) => c.dmStatus === 'not_sent').length
                              if (unsent === 0) {
                                setDmResult({ success: false, message: 'All coaches have already been DM\'d' })
                                return
                              }
                              if (confirm(`Send DMs to ${unsent} coaches? (Max ${bulkDmStatus?.remainingToday || 20}/day will be sent today, rest queued)`)) {
                                startBulkDm()
                              }
                            }}
                            disabled={!bulkDmTemplate.trim() || dmCoaches.filter((c: any) => c.dmStatus === 'not_sent').length === 0}
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', background: (!bulkDmTemplate.trim() || dmCoaches.filter((c: any) => c.dmStatus === 'not_sent').length === 0) ? '#ccc' : '#1da1f2', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            Send to All ({dmCoaches.filter((c: any) => c.dmStatus === 'not_sent').length})
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              if (bulkDmPaused) {
                                setBulkDmPaused(false)
                                processBulkDmQueue(bulkDmProgress.total - bulkDmProgress.sent - bulkDmProgress.failed)
                              } else {
                                setBulkDmPaused(true)
                              }
                            }}
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', background: bulkDmPaused ? '#4caf50' : '#ffa726', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            {bulkDmPaused ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Cancel all remaining queued DMs?')) {
                                cancelBulkDm()
                              }
                            }}
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', background: '#e53935', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            Stop
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Coach list with DM status */}
                <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                  {dmCoaches.length > 0
                    ? `${dmCoaches.length} coaches with X handles — ${dmCoaches.filter((c: any) => c.dmStatus === 'sent').length} DM'd`
                    : dmCoachesLoaded ? 'No coaches with X handles found.' : 'Loading...'}
                </p>

                {dmCoaches.length > 0 && (
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {dmCoaches.map((c: any) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.8rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                          <span style={{ color: '#1da1f2', fontSize: '0.7rem', marginLeft: '0.4rem' }}>{c.x_handle?.startsWith('@') ? c.x_handle : `@${c.x_handle}`}</span>
                          <span style={{ color: '#999', fontSize: '0.7rem', marginLeft: '0.4rem' }}>{c.school}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                          {/* Follow status / button */}
                          {(() => {
                            const handle = (c.x_handle || '').startsWith('@') ? c.x_handle.slice(1).toLowerCase() : (c.x_handle || '').toLowerCase()
                            const engagement = xEngagements[handle]
                            if (engagement?.followed) {
                              return <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#7b1fa2', background: '#f3e5f5', padding: '0.1rem 0.35rem', borderRadius: '9999px' }}>Following &#10003;</span>
                            }
                            return (
                              <button
                                onClick={() => followOnX(c)}
                                disabled={xEngageLoading === `follow-${handle}`}
                                style={{ padding: '0.15rem 0.4rem', borderRadius: '9999px', background: xEngageLoading === `follow-${handle}` ? '#ccc' : '#7b1fa2', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                              >
                                {xEngageLoading === `follow-${handle}` ? '...' : 'Follow'}
                              </button>
                            )
                          })()}

                          {/* Like Latest button */}
                          <button
                            onClick={() => likeLatestTweet(c)}
                            disabled={xEngageLoading === `like-${((c.x_handle || '').startsWith('@') ? c.x_handle.slice(1) : c.x_handle || '').toLowerCase()}`}
                            style={{ padding: '0.15rem 0.4rem', borderRadius: '9999px', background: 'transparent', color: '#e91e63', border: '1px solid #e91e63', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            {xEngageLoading === `like-${((c.x_handle || '').startsWith('@') ? c.x_handle.slice(1) : c.x_handle || '').toLowerCase()}` ? '...' : '\u2665 Like'}
                          </button>

                          {/* DM button */}
                          {c.dmStatus === 'sent' ? (
                            <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#2e7d32', background: '#e8f5e9', padding: '0.1rem 0.35rem', borderRadius: '9999px' }}>DM&apos;d</span>
                          ) : c.dmStatus === 'queued' ? (
                            <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#e65100', background: '#fff3e0', padding: '0.1rem 0.35rem', borderRadius: '9999px' }}>Queued</span>
                          ) : (
                            <button
                              onClick={() => { setDmComposeCoach(c); setDmMessage('') }}
                              style={{ padding: '0.15rem 0.4rem', borderRadius: '9999px', background: '#1da1f2', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                            >
                              DM
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Deliverability Monitor */}
          <div className="dash-card" style={{ borderColor: '#0288d1', borderWidth: '1.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0, color: '#0288d1' }}>Email Deliverability</h3>
              {deliverability && (
                <button
                  onClick={() => { setDeliverability(null) }}
                  className="dash-btn-outline"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
                >
                  Refresh
                </button>
              )}
            </div>

            {deliverabilityLoading && (
              <p style={{ color: '#999', fontSize: '0.8rem' }}>Loading deliverability data...</p>
            )}

            {!deliverabilityLoading && deliverability && deliverability.stats.totalSent === 0 && (
              <p style={{ color: '#999', fontSize: '0.8rem', marginBottom: 0 }}>No emails sent yet. Stats will appear after your first campaign send.</p>
            )}

            {!deliverabilityLoading && deliverability && deliverability.stats.totalSent > 0 && (
              <>
                {/* Rate cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: '1rem' }}>
                  {[
                    {
                      label: 'Delivered',
                      value: `${deliverability.stats.deliveryRate}%`,
                      sub: `${deliverability.stats.delivered}/${deliverability.stats.totalSent}`,
                      color: deliverability.stats.deliveryRate >= 95 ? '#2e7d32' : deliverability.stats.deliveryRate >= 80 ? '#e65100' : '#c62828',
                      bg: deliverability.stats.deliveryRate >= 95 ? '#e8f5e9' : deliverability.stats.deliveryRate >= 80 ? '#fff3e0' : '#ffebee',
                    },
                    {
                      label: 'Opened',
                      value: `${deliverability.stats.openRate}%`,
                      sub: `${deliverability.stats.opened}/${deliverability.stats.totalSent}`,
                      color: deliverability.stats.openRate >= 30 ? '#2e7d32' : deliverability.stats.openRate >= 15 ? '#e65100' : '#c62828',
                      bg: deliverability.stats.openRate >= 30 ? '#e8f5e9' : deliverability.stats.openRate >= 15 ? '#fff3e0' : '#ffebee',
                    },
                    {
                      label: 'Clicked',
                      value: `${deliverability.stats.clickRate}%`,
                      sub: `${deliverability.stats.clicked}/${deliverability.stats.totalSent}`,
                      color: deliverability.stats.clickRate >= 5 ? '#2e7d32' : deliverability.stats.clickRate >= 1 ? '#e65100' : '#757575',
                      bg: deliverability.stats.clickRate >= 5 ? '#e8f5e9' : deliverability.stats.clickRate >= 1 ? '#fff3e0' : '#f5f5f5',
                    },
                    {
                      label: 'Bounced',
                      value: String(deliverability.stats.bounced),
                      sub: deliverability.stats.complained > 0 ? `${deliverability.stats.complained} complaints` : '',
                      color: deliverability.stats.bounced === 0 ? '#2e7d32' : deliverability.stats.bounced <= 3 ? '#e65100' : '#c62828',
                      bg: deliverability.stats.bounced === 0 ? '#e8f5e9' : deliverability.stats.bounced <= 3 ? '#fff3e0' : '#ffebee',
                    },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', background: s.bg, borderRadius: '10px', padding: '0.75rem 0.5rem' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.125rem', color: s.color }}>{s.value}</p>
                      <p style={{ color: '#666', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: 0 }}>{s.label}</p>
                      {s.sub && <p style={{ color: '#999', fontSize: '0.6rem', marginBottom: 0, marginTop: '0.125rem' }}>{s.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Summary bar */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#666', marginBottom: deliverability.recentIssues.length > 0 ? '1rem' : 0 }}>
                  <span>Total sent: <strong>{deliverability.stats.totalSent}</strong></span>
                  <span>Failed: <strong style={{ color: deliverability.stats.failed > 0 ? '#c62828' : '#666' }}>{deliverability.stats.failed}</strong></span>
                </div>

                {/* Recent issues */}
                {deliverability.recentIssues.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c62828', marginBottom: '0.5rem' }}>Recent Issues</p>
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {deliverability.recentIssues.map((issue, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.75rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              fontSize: '0.6rem',
                              fontWeight: 'bold',
                              marginRight: '0.4rem',
                              color: 'white',
                              background: issue.type === 'bounced' ? '#e65100' : issue.type === 'complained' ? '#c62828' : '#757575',
                            }}>
                              {issue.type}
                            </span>
                            <span style={{ color: '#333' }}>{issue.coachName || issue.recipient || 'Unknown'}</span>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            {issue.error && <span style={{ color: '#999', fontSize: '0.65rem', marginRight: '0.5rem' }}>{issue.error}</span>}
                            <span style={{ color: '#bbb', fontSize: '0.65rem' }}>{new Date(issue.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Coach Engagement Scoring ── */}
          <div className="dash-card" style={{ borderColor: '#ea580c', borderWidth: '2px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: '#ea580c' }}>Coach Engagement</h3>

            {!engagementLoaded && (
              <p style={{ color: '#999', fontSize: '0.875rem' }}>Loading engagement data...</p>
            )}

            {engagementLoaded && engagementData && (
              <>
                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ textAlign: 'center', background: '#fff7ed', borderRadius: '10px', padding: '0.6rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.125rem', color: '#ea580c' }}>{engagementData.summary.totalEngaged}</p>
                    <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: 0 }}>Engaged</p>
                  </div>
                  <div style={{ textAlign: 'center', background: '#fff7ed', borderRadius: '10px', padding: '0.6rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.125rem', color: '#ea580c' }}>{engagementData.summary.averageScore}</p>
                    <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: 0 }}>Avg Score</p>
                  </div>
                  <div style={{ textAlign: 'center', background: '#fff7ed', borderRadius: '10px', padding: '0.6rem', overflow: 'hidden' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.125rem', color: '#ea580c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {engagementData.summary.hottestLead ? engagementData.summary.hottestLead.name : '--'}
                    </p>
                    <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: 0 }}>Hottest Lead</p>
                  </div>
                </div>

                {/* Tier Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {(['all', 'Hot', 'Warm', 'Cold'] as const).map((tier) => {
                    const count = tier === 'all'
                      ? engagementData.coaches.length
                      : engagementData.coaches.filter(c => c.tier === tier).length
                    const isActive = engagementFilter === tier
                    return (
                      <button
                        key={tier}
                        onClick={() => setEngagementFilter(tier)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: isActive ? 'bold' : 'normal',
                          border: isActive ? '2px solid #ea580c' : '1px solid #ddd',
                          borderRadius: '8px',
                          background: isActive ? '#fff7ed' : '#fff',
                          color: isActive ? '#ea580c' : '#666',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {tier === 'Hot' ? '\uD83D\uDD25' : tier === 'Warm' ? '\u2600\uFE0F' : tier === 'Cold' ? '\u2744\uFE0F' : ''} {tier === 'all' ? 'All' : tier} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Coach Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {engagementData.coaches
                    .filter(c => engagementFilter === 'all' || c.tier === engagementFilter)
                    .map((coach) => (
                      <div
                        key={coach.coachId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '10px',
                          border: `1px solid ${coach.tier === 'Hot' ? '#fed7aa' : coach.tier === 'Warm' ? '#fef3c7' : '#e5e7eb'}`,
                          background: coach.tier === 'Hot' ? '#fffbf5' : coach.tier === 'Warm' ? '#fffef5' : '#fafafa',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>
                              {coach.tier === 'Hot' ? '\uD83D\uDD25' : coach.tier === 'Warm' ? '\u2600\uFE0F' : '\u2744\uFE0F'}
                            </span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {coach.coachName}
                            </span>
                            <span style={{
                              background: coach.tier === 'Hot' ? '#ea580c' : coach.tier === 'Warm' ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '999px',
                              flexShrink: 0,
                            }}>
                              {coach.score}
                            </span>
                          </div>
                          <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {coach.school}{coach.division ? ` (${coach.division})` : ''}
                          </p>
                          <p style={{ color: '#999', fontSize: '0.7rem', marginBottom: 0 }}>
                            {coach.breakdown}
                            {coach.lastInteraction && (
                              <> &middot; {new Date(coach.lastInteraction).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        {coach.tier === 'Warm' && (
                          <button
                            className="dash-btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', flexShrink: 0, marginLeft: '0.5rem' }}
                            onClick={() => {
                              setCurrentTab('followups')
                            }}
                          >
                            Follow-up
                          </button>
                        )}
                        {coach.tier === 'Hot' && (
                          <button
                            className="dash-btn"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', flexShrink: 0, marginLeft: '0.5rem', background: '#ea580c', borderColor: '#ea580c' }}
                            onClick={() => {
                              setCurrentTab('followups')
                            }}
                          >
                            Personalize
                          </button>
                        )}
                      </div>
                    ))}

                  {engagementData.coaches.filter(c => engagementFilter === 'all' || c.tier === engagementFilter).length === 0 && (
                    <p style={{ color: '#999', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                      No coaches in this tier yet.
                    </p>
                  )}
                </div>
              </>
            )}

            {engagementLoaded && !engagementData && (
              <p style={{ color: '#999', fontSize: '0.875rem' }}>No engagement data available. Start your campaign to see coach engagement scores.</p>
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

          {/* ── ACTIVITY TRACKER ── */}
          <div className="dash-card" style={{ borderColor: '#0d9488', borderWidth: '1.5px', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0, color: '#0d9488' }}>Activity Tracker</h3>
              <button
                onClick={() => setShowAddActivity(!showAddActivity)}
                style={{ padding: '0.5rem 1rem', borderRadius: '9999px', background: '#0d9488', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                {showAddActivity ? 'Cancel' : '+ Log Activity'}
              </button>
            </div>

            {/* Add Activity Form */}
            {showAddActivity && (
              <div style={{ background: '#f0fdfa', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid #ccfbf1' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0d9488', marginBottom: '0.25rem' }}>Activity Type</label>
                    <select
                      value={activityForm.activityType}
                      onChange={e => setActivityForm(f => ({ ...f, activityType: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    >
                      <option value="campus_visit">Campus Visit</option>
                      <option value="unofficial_visit">Unofficial Visit</option>
                      <option value="official_visit">Official Visit</option>
                      <option value="camp">Camp</option>
                      <option value="showcase">Showcase</option>
                      <option value="combine">Combine</option>
                      <option value="phone_call">Phone Call</option>
                      <option value="video_call">Video Call</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0d9488', marginBottom: '0.25rem' }}>Date</label>
                    <input
                      type="datetime-local"
                      value={activityForm.activityDate}
                      onChange={e => setActivityForm(f => ({ ...f, activityDate: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0d9488', marginBottom: '0.25rem' }}>Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Duke Campus Visit"
                      value={activityForm.title}
                      onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0d9488', marginBottom: '0.25rem' }}>School</label>
                    <input
                      type="text"
                      placeholder="School name"
                      value={activityForm.school}
                      onChange={e => setActivityForm(f => ({ ...f, school: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0d9488', marginBottom: '0.25rem' }}>Notes</label>
                    <textarea
                      placeholder="Description or notes..."
                      value={activityForm.description}
                      onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0d9488', marginBottom: '0.25rem' }}>Status</label>
                    <select
                      value={activityForm.status}
                      onChange={e => setActivityForm(f => ({ ...f, status: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    >
                      <option value="planned">Planned</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    onClick={() => setShowAddActivity(false)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '9999px', background: 'white', color: '#666', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveActivity}
                    disabled={savingActivity || !activityForm.title || !activityForm.activityDate}
                    style={{ padding: '0.5rem 1rem', borderRadius: '9999px', background: savingActivity || !activityForm.title || !activityForm.activityDate ? '#99f6e4' : '#0d9488', color: 'white', border: 'none', cursor: savingActivity || !activityForm.title || !activityForm.activityDate ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
                  >
                    {savingActivity ? 'Saving...' : 'Save Activity'}
                  </button>
                </div>
              </div>
            )}

            {!activitiesLoaded && <div className="dash-empty">Loading activities...</div>}

            {activitiesLoaded && activities.length === 0 && !showAddActivity && (
              <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', marginBottom: 0 }}>
                No activities logged yet. Click &quot;Log Activity&quot; to track campus visits, camps, calls, and more.
              </p>
            )}

            {activitiesLoaded && activities.length > 0 && (() => {
              const now = new Date()
              const upcoming = activities.filter(a => new Date(a.activityDate) >= now && a.status !== 'cancelled')
              const past = activities.filter(a => new Date(a.activityDate) < now || a.status === 'cancelled')

              const activityTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
                campus_visit: { label: 'Campus Visit', color: '#1d4ed8', bg: '#dbeafe' },
                unofficial_visit: { label: 'Unofficial Visit', color: '#1d4ed8', bg: '#dbeafe' },
                official_visit: { label: 'Official Visit', color: '#1e40af', bg: '#bfdbfe' },
                camp: { label: 'Camp', color: '#15803d', bg: '#dcfce7' },
                showcase: { label: 'Showcase', color: '#15803d', bg: '#dcfce7' },
                combine: { label: 'Combine', color: '#b45309', bg: '#fef3c7' },
                phone_call: { label: 'Phone Call', color: '#7c3aed', bg: '#ede9fe' },
                video_call: { label: 'Video Call', color: '#7c3aed', bg: '#ede9fe' },
                meeting: { label: 'Meeting', color: '#0369a1', bg: '#e0f2fe' },
                other: { label: 'Other', color: '#6b7280', bg: '#f3f4f6' },
              }

              const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                planned: { label: 'Planned', color: '#a16207', bg: '#fef9c3' },
                completed: { label: 'Completed', color: '#15803d', bg: '#dcfce7' },
                cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
              }

              const formatRelativeDate = (dateStr: string) => {
                const date = new Date(dateStr)
                const diffMs = date.getTime() - now.getTime()
                const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
                if (diffDays === 0) return 'Today'
                if (diffDays === 1) return 'Tomorrow'
                if (diffDays === -1) return 'Yesterday'
                if (diffDays > 1 && diffDays <= 30) return `In ${diffDays} days`
                if (diffDays < -1 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }

              const renderActivity = (activity: any) => {
                const typeConf = activityTypeConfig[activity.activityType] || activityTypeConfig.other
                const statConf = statusConfig[activity.status] || statusConfig.planned
                const isEditing = editingActivityId === activity.id

                return (
                  <div key={activity.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '12px', paddingTop: '0.25rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: typeConf.color, flexShrink: 0 }} />
                      <div style={{ width: '2px', flex: 1, background: '#e5e7eb', marginTop: '4px' }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: typeConf.bg, color: typeConf.color }}>
                          {typeConf.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: statConf.bg, color: statConf.color }}>
                          {statConf.label}
                        </span>
                      </div>
                      <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.125rem' }}>
                        {activity.title}
                        {activity.school && <span style={{ fontWeight: 'normal', color: '#666' }}> &mdash; {activity.school}</span>}
                      </p>
                      <p style={{ color: '#999', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        {new Date(activity.activityDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {' '}<span style={{ color: '#0d9488', fontWeight: 'bold' }}>({formatRelativeDate(activity.activityDate)})</span>
                      </p>
                      {activity.description && (
                        <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{activity.description}</p>
                      )}
                      {activity.outcome && (
                        <p style={{ color: '#15803d', fontSize: '0.8rem', marginBottom: '0.25rem', fontStyle: 'italic' }}>Outcome: {activity.outcome}</p>
                      )}

                      {/* Outcome input when editing */}
                      {isEditing && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Enter outcome notes..."
                            value={outcomeText[activity.id] || ''}
                            onChange={e => setOutcomeText(prev => ({ ...prev, [activity.id]: e.target.value }))}
                            style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', fontFamily: 'inherit' }}
                          />
                          <button
                            onClick={() => {
                              updateActivityStatus(activity.id, 'completed', outcomeText[activity.id] || undefined)
                              setEditingActivityId(null)
                            }}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: '#15803d', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingActivityId(null)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'white', color: '#666', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isEditing && activity.status === 'planned' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                          <button
                            onClick={() => setEditingActivityId(activity.id)}
                            style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: '#dcfce7', color: '#15803d', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => updateActivityStatus(activity.id, 'cancelled')}
                            style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'inherit' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deleteActivity(activity.id)}
                            style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {!isEditing && activity.status !== 'planned' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                          <button
                            onClick={() => deleteActivity(activity.id)}
                            style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div>
                  {upcoming.length > 0 && (
                    <>
                      <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Upcoming ({upcoming.length})
                      </p>
                      {upcoming.map(renderActivity)}
                    </>
                  )}
                  {past.length > 0 && (
                    <>
                      <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', marginTop: upcoming.length > 0 ? '1rem' : 0 }}>
                        Past ({past.length})
                      </p>
                      {past.map(renderActivity)}
                    </>
                  )}
                </div>
              )
            })()}
          </div>
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
          {/* ── OFFER BOARD ── */}
          <div className="dash-card" style={{ border: '2px solid #f59e0b', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0, color: '#b45309' }}>Offer Board</h3>
              <button
                onClick={() => {
                  setOfferForm({ school: '', division: '', offer_type: 'interest', scholarship_amount: '', notes: '', interest_level: 3, coach_interest_level: 3, decision_deadline: '' })
                  setEditingOfferId(null)
                  setShowAddOffer(true)
                }}
                style={{ padding: '0.4rem 1rem', borderRadius: '9999px', background: '#f59e0b', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                + Add Offer
              </button>
            </div>

            {/* Summary Stats */}
            {offers.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center', flex: '1 1 80px' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#b45309', marginBottom: '0.125rem' }}>{offers.length}</p>
                  <p style={{ fontSize: '0.7rem', color: '#92400e', marginBottom: 0 }}>Total Offers</p>
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center', flex: '1 1 80px' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#b45309', marginBottom: '0.125rem' }}>
                    {(() => {
                      const typeRank: Record<string, number> = { interest: 0, preferred_walk_on: 1, partial_scholarship: 2, full_scholarship: 3, verbal_offer: 4, official_offer: 5, committed: 6 }
                      const best = offers.reduce((a: any, b: any) => (typeRank[b.offer_type] || 0) > (typeRank[a.offer_type] || 0) ? b : a, offers[0])
                      const labels: Record<string, string> = { interest: 'Interest', preferred_walk_on: 'PWO', partial_scholarship: 'Partial', full_scholarship: 'Full', verbal_offer: 'Verbal', official_offer: 'Official', committed: 'Committed' }
                      return labels[best?.offer_type] || 'N/A'
                    })()}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: '#92400e', marginBottom: 0 }}>Highest Level</p>
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center', flex: '1 1 80px' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#b45309', marginBottom: '0.125rem' }}>{new Set(offers.map((o: any) => o.school)).size}</p>
                  <p style={{ fontSize: '0.7rem', color: '#92400e', marginBottom: 0 }}>Schools</p>
                </div>
              </div>
            )}

            {/* Add/Edit Offer Form */}
            {showAddOffer && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#92400e' }}>{editingOfferId ? 'Edit Offer' : 'Add New Offer'}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="text" placeholder="School Name *" value={offerForm.school}
                      onChange={e => setOfferForm(f => ({ ...f, school: e.target.value }))}
                      style={{ flex: '2 1 200px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    />
                    <select
                      value={offerForm.division} onChange={e => setOfferForm(f => ({ ...f, division: e.target.value }))}
                      style={{ flex: '1 1 120px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit', background: 'white' }}
                    >
                      <option value="">Division</option>
                      <option value="D1">D1</option>
                      <option value="D2">D2</option>
                      <option value="D3">D3</option>
                      <option value="NAIA">NAIA</option>
                      <option value="JUCO">JUCO</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                      value={offerForm.offer_type} onChange={e => setOfferForm(f => ({ ...f, offer_type: e.target.value }))}
                      style={{ flex: '1 1 160px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit', background: 'white' }}
                    >
                      <option value="interest">Interest</option>
                      <option value="preferred_walk_on">Preferred Walk-On</option>
                      <option value="partial_scholarship">Partial Scholarship</option>
                      <option value="full_scholarship">Full Scholarship</option>
                      <option value="verbal_offer">Verbal Offer</option>
                      <option value="official_offer">Official Offer</option>
                      <option value="committed">Committed</option>
                    </select>
                    <input
                      type="text" placeholder="Scholarship Amount" value={offerForm.scholarship_amount}
                      onChange={e => setOfferForm(f => ({ ...f, scholarship_amount: e.target.value }))}
                      style={{ flex: '1 1 140px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <textarea
                    placeholder="Notes (optional)" value={offerForm.notes}
                    onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>My Interest (1-5)</label>
                      <input type="range" min={1} max={5} value={offerForm.interest_level} onChange={e => setOfferForm(f => ({ ...f, interest_level: Number(e.target.value) }))} style={{ width: '100px' }} />
                      <span style={{ marginLeft: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>{offerForm.interest_level}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Coach Interest (1-5)</label>
                      <input type="range" min={1} max={5} value={offerForm.coach_interest_level} onChange={e => setOfferForm(f => ({ ...f, coach_interest_level: Number(e.target.value) }))} style={{ width: '100px' }} />
                      <span style={{ marginLeft: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>{offerForm.coach_interest_level}</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Decision Deadline</label>
                    <input
                      type="date" value={offerForm.decision_deadline}
                      onChange={e => setOfferForm(f => ({ ...f, decision_deadline: e.target.value }))}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      disabled={savingOffer || !offerForm.school.trim()}
                      onClick={async () => {
                        setSavingOffer(true)
                        try {
                          if (editingOfferId) {
                            const res = await fetch('/api/recruit/offers', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: editingOfferId, ...offerForm, decision_deadline: offerForm.decision_deadline || null }),
                            })
                            const data = await res.json()
                            if (data.success) {
                              setOffers(prev => prev.map(o => o.id === editingOfferId ? { ...o, ...data.offer } : o))
                              setShowAddOffer(false)
                              setEditingOfferId(null)
                            }
                          } else {
                            const res = await fetch('/api/recruit/offers', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ athlete_id: id, ...offerForm, decision_deadline: offerForm.decision_deadline || null }),
                            })
                            const data = await res.json()
                            if (data.success) {
                              setOffers(prev => [data.offer, ...prev])
                              setShowAddOffer(false)
                            }
                          }
                        } catch (err) {
                          console.error('Failed to save offer:', err)
                        } finally {
                          setSavingOffer(false)
                        }
                      }}
                      style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px', background: savingOffer || !offerForm.school.trim() ? '#ccc' : '#f59e0b', color: 'white', border: 'none', cursor: savingOffer ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
                    >
                      {savingOffer ? 'Saving...' : editingOfferId ? 'Update Offer' : 'Save Offer'}
                    </button>
                    <button
                      onClick={() => { setShowAddOffer(false); setEditingOfferId(null) }}
                      style={{ padding: '0.5rem 1rem', borderRadius: '9999px', background: 'white', color: '#666', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Offer Cards */}
            {offers.length === 0 && !showAddOffer && (
              <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', marginBottom: 0 }}>No offers yet. Add your first offer to start tracking.</p>
            )}
            {offers.map((offer: any) => {
              const typeColors: Record<string, { bg: string; color: string }> = {
                interest: { bg: '#f3f4f6', color: '#374151' },
                preferred_walk_on: { bg: '#dbeafe', color: '#1e40af' },
                partial_scholarship: { bg: '#d1fae5', color: '#065f46' },
                full_scholarship: { bg: '#fef3c7', color: '#92400e' },
                verbal_offer: { bg: '#ede9fe', color: '#5b21b6' },
                official_offer: { bg: '#d1fae5', color: '#047857' },
                committed: { bg: '#fee2e2', color: '#991b1b' },
              }
              const typeLabels: Record<string, string> = {
                interest: 'Interest', preferred_walk_on: 'Preferred Walk-On', partial_scholarship: 'Partial Scholarship',
                full_scholarship: 'Full Scholarship', verbal_offer: 'Verbal Offer', official_offer: 'Official Offer', committed: 'Committed',
              }
              const statusColors: Record<string, { bg: string; color: string }> = {
                active: { bg: '#d1fae5', color: '#065f46' },
                declined: { bg: '#f3f4f6', color: '#6b7280' },
                committed: { bg: '#fee2e2', color: '#991b1b' },
                expired: { bg: '#f3f4f6', color: '#9ca3af' },
              }
              const tc = typeColors[offer.offer_type] || typeColors.interest
              const sc = statusColors[offer.status] || statusColors.active
              const daysRemaining = offer.decision_deadline ? Math.ceil((new Date(offer.decision_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

              return (
                <div key={offer.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.125rem' }}>{offer.school}</p>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {offer.division && (
                          <span style={{ background: '#e5e7eb', color: '#374151', fontSize: '0.65rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>{offer.division}</span>
                        )}
                        <span style={{ background: tc.bg, color: tc.color, fontSize: '0.65rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>
                          {typeLabels[offer.offer_type] || offer.offer_type}
                        </span>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: '0.65rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>
                          {offer.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => {
                          setOfferForm({
                            school: offer.school || '', division: offer.division || '', offer_type: offer.offer_type || 'interest',
                            scholarship_amount: offer.scholarship_amount || '', notes: offer.notes || '',
                            interest_level: offer.interest_level ?? 3, coach_interest_level: offer.coach_interest_level ?? 3,
                            decision_deadline: offer.decision_deadline ? offer.decision_deadline.split('T')[0] : '',
                          })
                          setEditingOfferId(offer.id)
                          setShowAddOffer(true)
                        }}
                        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', color: '#666', fontFamily: 'inherit' }}
                      >
                        Edit
                      </button>
                      {offer.status === 'active' && (
                        <button
                          onClick={async () => {
                            const res = await fetch('/api/recruit/offers', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: offer.id, status: 'declined' }),
                            })
                            const data = await res.json()
                            if (data.success) setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'declined' } : o))
                          }}
                          style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', color: '#dc2626', fontFamily: 'inherit' }}
                        >
                          Decline
                        </button>
                      )}
                    </div>
                  </div>

                  {offer.coach_name && (
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.375rem' }}>Coach: {offer.coach_name}</p>
                  )}
                  {offer.scholarship_amount && (
                    <p style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 'bold', marginBottom: '0.375rem' }}>Scholarship: {offer.scholarship_amount}</p>
                  )}

                  {/* Interest Level Meters */}
                  <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      <span>My Interest: </span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} style={{ color: n <= (offer.interest_level || 0) ? '#f59e0b' : '#d1d5db', fontSize: '0.85rem' }}>&#9733;</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      <span>Coach Interest: </span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} style={{ color: n <= (offer.coach_interest_level || 0) ? '#3b82f6' : '#d1d5db', fontSize: '0.85rem' }}>&#9733;</span>
                      ))}
                    </div>
                  </div>

                  {offer.notes && (
                    <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.375rem', fontStyle: 'italic' }}>{offer.notes}</p>
                  )}

                  {daysRemaining !== null && (
                    <p style={{ fontSize: '0.75rem', color: daysRemaining <= 7 ? '#dc2626' : daysRemaining <= 30 ? '#f59e0b' : '#666', fontWeight: daysRemaining <= 7 ? 'bold' : 'normal', marginBottom: 0 }}>
                      Deadline: {new Date(offer.decision_deadline).toLocaleDateString()} ({daysRemaining > 0 ? `${daysRemaining} days left` : daysRemaining === 0 ? 'Today' : 'Passed'})
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ MESSAGES TAB ══ */}
      {currentTab === 'messages' && athlete && (
        <InboxMessages
          athleteId={id}
          athleteFirstName={athlete.firstName}
          athleteLastName={athlete.lastName}
          xConnected={athlete.xConnected}
        />
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
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <a href={`/api/auth/x/authorize?athleteId=${athlete.id}`} className="dash-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', background: athlete.xConnected ? '#1976d2' : undefined, borderColor: athlete.xConnected ? '#1976d2' : undefined }}>
                {athlete.xConnected ? '↻ Reconnect X Account' : 'Connect X Account'}
              </a>
              <button
                style={{ color: '#c62828', fontSize: '0.8rem', background: 'none', border: '1px solid #c62828', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', padding: '0.25rem 0.65rem', opacity: athlete.xConnected ? 1 : 0.4 }}
                onClick={async () => {
                  if (!confirm('Disconnect X account? You can reconnect anytime.')) return
                  await fetch('/api/auth/x/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ athleteId: athlete.id }) })
                  window.location.reload()
                }}
              >
                Disconnect X
              </button>
            </div>
          </div>

          {/* Parent / Guardian Access */}
          <div className="dash-card" style={{ borderColor: '#7b1fa2', borderWidth: '1.5px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#7b1fa2' }}>Parent / Guardian Access</h3>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Add parents or guardians so they can log in and view the recruiting dashboard too.
            </p>

            {/* Primary account holder */}
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0 }}>Primary Account Holder</p>
                  <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>{parentAccessPrimary || 'Not set'}</p>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#e8f5e9', color: '#2e7d32', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>Owner</span>
              </div>
            </div>

            {/* Additional guardians list */}
            {parentAccessList.map((g) => (
              <div key={g.id} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.85rem', margin: 0 }}>
                      {g.name || g.email}
                      {g.relationship && <span style={{ color: '#999', fontWeight: 'normal' }}> — {g.relationship}</span>}
                    </p>
                    {g.name && <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>{g.email}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: g.status === 'active' ? '#e3f2fd' : '#fce4ec', color: g.status === 'active' ? '#1976d2' : '#c62828', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      {g.status === 'active' ? 'Active' : 'Revoked'}
                    </span>
                    {g.status === 'active' && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Remove access for ${g.email}?`)) return
                          const res = await fetch('/api/recruit/parent-access', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ accessId: g.id }),
                          })
                          if (res.ok) {
                            setParentAccessList(prev => prev.map(p => p.id === g.id ? { ...p, status: 'revoked' } : p))
                          }
                        }}
                        style={{ color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', fontWeight: 'bold' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add parent form */}
            {showAddParent ? (
              <div style={{ background: '#faf5ff', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem', border: '1px solid #e8d5f5' }}>
                <p style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.75rem', color: '#7b1fa2' }}>Add Parent / Guardian</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={newParentEmail}
                    onChange={(e) => setNewParentEmail(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit' }}
                  />
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit' }}
                  />
                  <select
                    value={newParentRelationship}
                    onChange={(e) => setNewParentRelationship(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit', background: 'white' }}
                  >
                    <option value="">Relationship (optional)</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Stepparent">Stepparent</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Coach">Coach</option>
                    <option value="Trainer">Trainer</option>
                    <option value="Other">Other</option>
                  </select>
                  {addParentError && (
                    <p style={{ color: '#c62828', fontSize: '0.8rem', margin: 0 }}>{addParentError}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      onClick={async () => {
                        if (!newParentEmail.includes('@')) {
                          setAddParentError('Please enter a valid email')
                          return
                        }
                        setAddingParent(true)
                        setAddParentError(null)
                        try {
                          const res = await fetch('/api/recruit/parent-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              athleteId: id,
                              email: newParentEmail,
                              name: newParentName || undefined,
                              relationship: newParentRelationship || undefined,
                            }),
                          })
                          const data = await res.json()
                          if (data.success) {
                            setParentAccessList(prev => [...prev, data.access])
                            setNewParentEmail('')
                            setNewParentName('')
                            setNewParentRelationship('')
                            setShowAddParent(false)
                          } else {
                            setAddParentError(data.error || 'Failed to add')
                          }
                        } catch {
                          setAddParentError('Failed to add parent')
                        } finally {
                          setAddingParent(false)
                        }
                      }}
                      disabled={addingParent}
                      style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px', background: addingParent ? '#ccc' : '#7b1fa2', color: 'white', border: 'none', cursor: addingParent ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
                    >
                      {addingParent ? 'Adding...' : 'Send Invite'}
                    </button>
                    <button
                      onClick={() => { setShowAddParent(false); setAddParentError(null) }}
                      style={{ padding: '0.5rem 1rem', borderRadius: '9999px', background: 'white', color: '#666', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddParent(true)}
                style={{ marginTop: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '9999px', background: '#7b1fa2', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                + Add Parent / Guardian
              </button>
            )}
          </div>

          {/* Coach Reply Forwarding */}
          <div className="dash-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Coach Reply Forwarding</h3>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
              When a coach replies to {athlete.firstName}&apos;s outreach email, we forward a copy here. Currently forwarding to: <strong>{athlete.parentEmail || 'not set'}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="email"
                id="parent-email-input"
                defaultValue={athlete.parentEmail}
                placeholder="Forwarding email address"
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.875rem', fontFamily: 'inherit' }}
              />
              <input
                type="text"
                id="parent-name-input"
                defaultValue={athlete.parentName}
                placeholder="Parent / guardian name (optional)"
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.875rem', fontFamily: 'inherit' }}
              />
              <button
                className="dash-btn"
                style={{ alignSelf: 'flex-start', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                onClick={async () => {
                  const email = (document.getElementById('parent-email-input') as HTMLInputElement).value.trim()
                  const name = (document.getElementById('parent-name-input') as HTMLInputElement).value.trim()
                  if (email && !email.includes('@')) { alert('Please enter a valid email'); return }
                  await Promise.all([
                    email !== undefined && fetch('/api/recruit/update-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ athleteId: id, field: 'parent_email', value: email }),
                    }),
                    name !== undefined && fetch('/api/recruit/update-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ athleteId: id, field: 'parent_name', value: name }),
                    }),
                  ])
                  alert('Forwarding email saved!')
                }}
              >
                Save
              </button>
            </div>
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

function MarchMadnessBlast({ athleteId }: { athleteId: string }) {
  const [preview, setPreview] = useState<{ eligibleToContact: number; uniqueSchools: number; alreadyContacted: number; blastStats: { sent: number; delivered: number; opened: number; replied: number } } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ emailsSent: number; dmQueued: number; emailsFailed: number; message?: string } | null>(null)
  const [batchSize, setBatchSize] = useState(50)

  const loadPreview = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recruit/march-madness-blast?athleteId=${athleteId}`)
      const data = await res.json()
      setPreview(data)
    } catch {}
    setLoading(false)
  }

  const sendBlast = async () => {
    if (!confirm(`Send March Madness congrats to ${batchSize === 999 ? (preview?.eligibleToContact ?? 'all') : batchSize} D1 coaches? This will send real emails.`)) return
    setSending(true)
    try {
      const res = await fetch('/api/recruit/march-madness-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, maxEmails: batchSize }),
      })
      const data = await res.json()
      setResult(data)
    } catch {}
    setSending(false)
  }

  const [blastStats, setBlastStats] = useState<{ sent: number; delivered: number; opened: number; replied: number } | null>(null)

  useEffect(() => {
    fetch(`/api/recruit/march-madness-blast?athleteId=${athleteId}`)
      .then(r => r.json())
      .then(d => { if (d.blastStats) setBlastStats(d.blastStats) })
      .catch(() => {})
  }, [athleteId])

  if (result) {
    const totalSent = (blastStats?.sent || 0) + (result.emailsSent || 0)
    return (
      <div>
        <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
          <p style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>
            {result.emailsSent > 0 ? `Blast sent!` : result.message || 'No emails sent'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { label: 'Emails Sent', value: result.emailsSent ?? 0 },
              { label: 'DMs Queued', value: result.dmQueued ?? 0 },
              { label: 'Failed', value: result.emailsFailed ?? 0 },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.5rem' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.25rem', margin: '0 0 0.125rem', color: s.label === 'Failed' && s.value > 0 ? '#c62828' : '#2e7d32' }}>{s.value}</p>
                <p style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        {totalSent > 0 && (
          <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#555' }}>
            <strong>All-time blast:</strong> {totalSent} sent &bull; {(blastStats?.delivered || 0)} delivered &bull; {(blastStats?.opened || 0)} opened &bull; {(blastStats?.replied || 0)} replied
          </div>
        )}
        <button onClick={() => { setResult(null); setPreview(null) }} style={{ fontSize: '0.75rem', color: '#e65100', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          Send another batch →
        </button>
      </div>
    )
  }

  const statsBar = blastStats && blastStats.sent > 0 ? (
    <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#555', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <span><strong>{blastStats.sent}</strong> sent</span>
      <span><strong>{blastStats.delivered}</strong> delivered</span>
      <span><strong>{blastStats.opened}</strong> opened</span>
      <span><strong>{blastStats.replied}</strong> replied</span>
    </div>
  ) : null

  if (!preview) {
    return (
      <div>
        {statsBar}
        <button onClick={loadPreview} disabled={loading} className="dash-btn" style={{ background: '#e65100', borderColor: '#e65100', fontSize: '0.875rem' }}>
          {loading ? 'Loading...' : 'Preview Blast'}
        </button>
      </div>
    )
  }

  return (
    <div>
      {statsBar}
      <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
        <p style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: '0 0 0.25rem' }}>
          {preview.eligibleToContact} coaches eligible across {preview.uniqueSchools} D1 programs
        </p>
        <p style={{ fontSize: '0.78rem', color: '#666', margin: 0 }}>
          {preview.alreadyContacted} already contacted. DMs queued for coaches with X handles.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          value={batchSize}
          onChange={e => setBatchSize(Number(e.target.value))}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.875rem', fontFamily: 'inherit' }}
        >
          <option value={25}>25 coaches</option>
          <option value={50}>50 coaches</option>
          <option value={100}>100 coaches</option>
          <option value={200}>200 coaches</option>
          <option value={999}>All ({preview.eligibleToContact})</option>
        </select>
        <button onClick={sendBlast} disabled={sending || preview.eligibleToContact === 0} className="dash-btn" style={{ background: '#e65100', borderColor: '#e65100', fontSize: '0.875rem' }}>
          {sending ? 'Sending...' : preview.eligibleToContact === 0 ? 'All sent!' : `Send to ${batchSize === 999 ? preview.eligibleToContact : batchSize} Coaches`}
        </button>
      </div>
    </div>
  )
}

function FullDbBlast({ athleteId }: { athleteId: string }) {
  const [preview, setPreview] = useState<{ eligibleToContact: number; alreadyContacted: number; byDivision: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ emailsSent: number; emailsFailed: number; message?: string } | null>(null)

  const loadPreview = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recruit/full-db-blast?athleteId=${athleteId}`)
      const data = await res.json()
      setPreview(data)
    } catch {}
    setLoading(false)
  }

  const sendBlast = async (forceResend = false) => {
    const count = forceResend ? (preview?.alreadyContacted ?? 0) + (preview?.eligibleToContact ?? 0) : (preview?.eligibleToContact ?? 0)
    if (!confirm(`${forceResend ? 'Resend updated template to ALL' : 'Send to'} ${count} coaches? ${forceResend ? 'This will re-email previously contacted coaches.' : 'Follow-ups will be handled automatically.'}`) ) return
    setSending(true)
    try {
      const res = await fetch('/api/recruit/full-db-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, forceResend }),
      })
      const data = await res.json()
      setResult(data)
    } catch {}
    setSending(false)
  }

  if (result) {
    return (
      <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '1rem' }}>
        <p style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '0.5rem' }}>
          {result.emailsSent > 0 ? 'Blast sent!' : result.message || 'Complete'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {[
            { label: 'Emails Sent', value: result.emailsSent ?? 0 },
            { label: 'Failed', value: result.emailsFailed ?? 0 },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.5rem' }}>
              <p style={{ fontWeight: 'bold', fontSize: '1.25rem', margin: '0 0 0.125rem', color: s.label === 'Failed' && s.value > 0 ? '#c62828' : '#1565c0' }}>{s.value}</p>
              <p style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#555', marginTop: '0.75rem', marginBottom: 0 }}>
          Follow-ups scheduled automatically via campaign cron (7-day intervals).
        </p>
      </div>
    )
  }

  if (!preview) {
    return (
      <button onClick={loadPreview} disabled={loading} className="dash-btn" style={{ background: '#1976d2', borderColor: '#1976d2', fontSize: '0.875rem' }}>
        {loading ? 'Loading...' : 'Preview Blast'}
      </button>
    )
  }

  return (
    <div>
      <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
        <p style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
          {preview.eligibleToContact} coaches eligible ({preview.alreadyContacted} already contacted)
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {Object.entries(preview.byDivision).sort().map(([div, count]) => (
            <span key={div} style={{ fontSize: '0.78rem', background: 'white', padding: '0.2rem 0.6rem', borderRadius: '9999px', color: '#1976d2', fontWeight: 'bold' }}>
              {div}: {count}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => sendBlast(false)}
          disabled={sending || preview.eligibleToContact === 0}
          className="dash-btn"
          style={{ background: '#1976d2', borderColor: '#1976d2', fontSize: '0.875rem' }}
        >
          {sending ? 'Sending...' : preview.eligibleToContact === 0 ? 'All sent!' : `Send to ${preview.eligibleToContact} New Coaches`}
        </button>
        <button
          onClick={() => sendBlast(true)}
          disabled={sending}
          className="dash-btn"
          style={{ background: '#e65100', borderColor: '#e65100', fontSize: '0.875rem' }}
        >
          {sending ? 'Sending...' : '↺ Resend to All'}
        </button>
      </div>
    </div>
  )
}

function FollowupClickersBlast({ athleteId }: { athleteId: string }) {
  const [preview, setPreview] = useState<{ totalClickers: number; alreadySent: number; eligibleToContact: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ emailsSent: number; emailsFailed: number } | null>(null)

  const loadPreview = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recruit/followup-clickers-blast?athleteId=${athleteId}`)
      const data = await res.json()
      setPreview(data)
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    if (!confirm(`Send follow-up to ${preview?.eligibleToContact} coaches who clicked? This sends real emails.`)) return
    setSending(true)
    try {
      const res = await fetch('/api/recruit/followup-clickers-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      })
      const data = await res.json()
      setResult({ emailsSent: data.emailsSent, emailsFailed: data.emailsFailed })
      setPreview(null)
    } catch {
      alert('Send failed — check console')
    } finally {
      setSending(false)
    }
  }

  if (result) {
    return (
      <div style={{ background: '#f3e5f5', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#4a148c' }}>
        ✓ Follow-up sent to <strong>{result.emailsSent}</strong> coaches.
        {result.emailsFailed > 0 && <span style={{ color: '#c62828' }}> {result.emailsFailed} failed.</span>}
      </div>
    )
  }

  if (!preview) {
    return (
      <button onClick={loadPreview} disabled={loading} className="dash-btn" style={{ background: '#7b1fa2', borderColor: '#7b1fa2', fontSize: '0.875rem' }}>
        {loading ? 'Loading...' : 'Preview Clickers'}
      </button>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Clickers', value: preview.totalClickers },
          { label: 'Already Sent', value: preview.alreadySent },
          { label: 'Ready to Send', value: preview.eligibleToContact },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', background: '#f3e5f5', borderRadius: '8px', padding: '0.6rem 1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7b1fa2' }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={send}
        disabled={sending || preview.eligibleToContact === 0}
        className="dash-btn"
        style={{ background: '#7b1fa2', borderColor: '#7b1fa2', fontSize: '0.875rem' }}
      >
        {sending ? 'Sending...' : preview.eligibleToContact === 0 ? 'All sent!' : `Send to ${preview.eligibleToContact} Coaches`}
      </button>
    </div>
  )
}
