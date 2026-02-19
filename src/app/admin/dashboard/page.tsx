'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MasterAdminDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  // Priority 4 Metrics (Big)
  const [newBusinessOnboards, setNewBusinessOnboards] = useState({ today: 0, week: 0, month: 0 })
  const [businessWalletDeposits, setBusinessWalletDeposits] = useState({ today: 0, week: 0, month: 0 })
  const [newAthletes, setNewAthletes] = useState({ today: 0, week: 0, month: 0 })
  const [mostActiveAthletes, setMostActiveAthletes] = useState<any[]>([])

  // Next 6 Metrics (Medium)
  const [gigCompletionRate, setGigCompletionRate] = useState(0)
  const [payoutVolume, setPayoutVolume] = useState({ total: 0, avg: 0 })
  const [retentionRate, setRetentionRate] = useState(0)
  const [churnRate, setChurnRate] = useState(0)
  const [timeToFirstGig, setTimeToFirstGig] = useState(0)
  const [referralRate, setReferralRate] = useState(0)

  // Graphs
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])
  const [revenueGrowthData, setRevenueGrowthData] = useState<any[]>([])

  // Totals
  const [totalAthletes, setTotalAthletes] = useState(0)
  const [totalBusinesses, setTotalBusinesses] = useState(0)
  const [totalWalletBalance, setTotalWalletBalance] = useState(0)

  // Text Injection
  const [globalText, setGlobalText] = useState('')
  const [textTarget, setTextTarget] = useState('landing_headline')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === 'jesse@entreartists.com') {
        setIsAuthorized(true)
        fetchAllMetrics()
      } else {
        router.replace('/')
      }
      setLoading(false)
    }

    checkAuth()

    const subscription = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => fetchAllMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clips' }, () => fetchAllMetrics())
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [router])

  const fetchAllMetrics = async () => {
    try {
      // Fetch all in parallel for performance
      const [
        businessCounts,
        athleteCounts,
        topAthletes,
        completionRate,
        payoutStats,
        retentionData,
        firstGigTime,
        referralData,
        walletData,
        userGrowth,
        revGrowth,
        totals,
      ] = await Promise.all([
        getCount('businesses', 'created_at'),
        getCount('profiles', 'created_at'),
        getTop('profiles', 'gig_count', 10),
        calculateCompletionRate(),
        getPayoutStats(),
        calculateRetention(),
        calculateFirstGigTime(),
        calculateReferralRate(),
        getWalletDeposits(),
        getTimeSeries('profiles', 'created_at', 30),
        getApprovedClipTimeSeries(30),
        getTotals(),
      ])

      setNewBusinessOnboards(businessCounts)
      setNewAthletes(athleteCounts)
      setMostActiveAthletes(topAthletes)
      setBusinessWalletDeposits(walletData)
      setGigCompletionRate(completionRate)
      setPayoutVolume(payoutStats)
      setRetentionRate(retentionData)
      setChurnRate(Math.max(0, 100 - retentionData))
      setTimeToFirstGig(firstGigTime)
      setReferralRate(referralData)
      setUserGrowthData(userGrowth)
      setRevenueGrowthData(revGrowth)
      setTotalAthletes(totals.athletes)
      setTotalBusinesses(totals.businesses)
      setTotalWalletBalance(totals.walletBalance)
    } catch (err) {
      console.error('Error fetching metrics:', err)
    }
  }

  // --- Helper functions ---

  const getCount = async (table: string, dateField: string) => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [todayRes, weekRes, monthRes] = await Promise.all([
      supabase.from(table).select('*', { count: 'exact', head: true }).gte(dateField, today),
      supabase.from(table).select('*', { count: 'exact', head: true }).gte(dateField, weekAgo),
      supabase.from(table).select('*', { count: 'exact', head: true }).gte(dateField, monthAgo),
    ])

    return {
      today: todayRes.count || 0,
      week: weekRes.count || 0,
      month: monthRes.count || 0,
    }
  }

  const getWalletDeposits = async () => {
    // Sum wallet_balance across all businesses as a proxy for deposits
    const { data: businesses } = await supabase.from('businesses').select('wallet_balance, created_at')
    if (!businesses) return { today: 0, week: 0, month: 0 }

    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const sumByDate = (after: string) =>
      businesses
        .filter(b => b.created_at >= after)
        .reduce((sum, b) => sum + (b.wallet_balance || 0), 0)

    const total = businesses.reduce((sum, b) => sum + (b.wallet_balance || 0), 0)

    return {
      today: sumByDate(today),
      week: sumByDate(weekAgo),
      month: total, // total across all businesses
    }
  }

  const getTop = async (table: string, orderField: string, limit: number) => {
    const { data } = await supabase
      .from(table)
      .select('id, full_name, email, gig_count, total_earnings, school')
      .order(orderField, { ascending: false })
      .limit(limit)
    return data || []
  }

  const calculateCompletionRate = async () => {
    const [totalRes, approvedRes] = await Promise.all([
      supabase.from('clips').select('*', { count: 'exact', head: true }),
      supabase.from('clips').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    ])
    const total = totalRes.count || 0
    const approved = approvedRes.count || 0
    return total > 0 ? (approved / total) * 100 : 0
  }

  const getPayoutStats = async () => {
    const { data } = await supabase
      .from('clips')
      .select('offer_id, offers(amount)')
      .eq('status', 'approved')

    if (!data || data.length === 0) return { total: 0, avg: 0 }

    const total = data.reduce((sum: number, clip: any) => {
      const amount = clip.offers?.amount || 0
      return sum + amount
    }, 0)

    return { total, avg: Math.round(total / data.length) }
  }

  const calculateRetention = async () => {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [totalRes, activeRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', monthAgo),
    ])
    const total = totalRes.count || 0
    const active = activeRes.count || 0
    return total > 0 ? (active / total) * 100 : 0
  }

  const calculateFirstGigTime = async () => {
    // Get athletes who have completed at least 1 gig
    const { data: athletes } = await supabase
      .from('profiles')
      .select('id, created_at')
      .gt('gig_count', 0)
      .limit(50)

    if (!athletes || athletes.length === 0) return 0

    // For each athlete, find their first approved clip
    const times: number[] = []
    for (const athlete of athletes) {
      const { data: firstClip } = await supabase
        .from('clips')
        .select('created_at')
        .eq('athlete_id', athlete.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (firstClip) {
        const signupDate = new Date(athlete.created_at).getTime()
        const gigDate = new Date(firstClip.created_at).getTime()
        const daysDiff = (gigDate - signupDate) / (1000 * 60 * 60 * 24)
        if (daysDiff >= 0) times.push(daysDiff)
      }
    }

    if (times.length === 0) return 0
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  const calculateReferralRate = async () => {
    const [referredRes, totalRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    const referred = referredRes.count || 0
    const total = totalRes.count || 0
    return total > 0 ? referred / total : 0
  }

  const getTimeSeries = async (table: string, dateField: string, days: number) => {
    // Batch: fetch all records from the last N days, then bucket client-side
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase
      .from(table)
      .select(dateField)
      .gte(dateField, startDate)
      .order(dateField, { ascending: true })

    // Bucket into days
    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      buckets[d.toISOString().split('T')[0]] = 0
    }
    data?.forEach((row: any) => {
      const day = row[dateField]?.split('T')[0]
      if (day && buckets[day] !== undefined) buckets[day]++
    })

    return Object.entries(buckets).map(([date, value]) => ({
      date: date.slice(5), // MM-DD
      value,
    }))
  }

  const getApprovedClipTimeSeries = async (days: number) => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase
      .from('clips')
      .select('created_at, offers(amount)')
      .eq('status', 'approved')
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })

    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      buckets[d.toISOString().split('T')[0]] = 0
    }
    data?.forEach((clip: any) => {
      const day = clip.created_at?.split('T')[0]
      if (day && buckets[day] !== undefined) {
        buckets[day] += clip.offers?.amount || 0
      }
    })

    return Object.entries(buckets).map(([date, value]) => ({
      date: date.slice(5),
      value,
    }))
  }

  const getTotals = async () => {
    const [athleteRes, businessRes, walletRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('wallet_balance'),
    ])

    const walletBalance = walletRes.data?.reduce((sum, b) => sum + (b.wallet_balance || 0), 0) || 0

    return {
      athletes: athleteRes.count || 0,
      businesses: businessRes.count || 0,
      walletBalance,
    }
  }

  const handleTextChange = async () => {
    if (!globalText.trim()) return
    // Store in a site_config table if it exists, otherwise upsert
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: textTarget, value: globalText }, { onConflict: 'key' })

    if (error) {
      // Table may not exist yet — inform admin
      alert(`Config table not found. Create a "site_config" table with columns: key (text, primary), value (text). Then this will work.\n\nFor now: ${textTarget} = "${globalText}"`)
    } else {
      alert(`Updated: ${textTarget} = "${globalText}"`)
      setGlobalText('')
    }
  }

  if (loading) return <div className="dash-empty" style={{ padding: '4rem 1rem', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>Loading Admin...</div>
  if (!isAuthorized) return null

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'Courier New, monospace', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>Admin Dashboard</h1>

      {/* Totals row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4ade80' }}>{totalAthletes}</div>
          <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Total Athletes</div>
        </div>
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4ade80' }}>{totalBusinesses}</div>
          <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Total Businesses</div>
        </div>
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4ade80' }}>${totalWalletBalance.toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Total in Wallets</div>
        </div>
      </div>

      {/* Priority 4 Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'New Business Onboards', data: newBusinessOnboards, color: '#4ade80' },
          { label: 'Wallet Deposits ($)', data: businessWalletDeposits, color: '#4ade80', prefix: '$' },
          { label: 'New Athletes', data: newAthletes, color: '#4ade80' },
        ].map(({ label, data, color, prefix }) => (
          <div key={label} style={{ background: '#111', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{prefix || ''}{data.today}</div>
            <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem' }}>
              Week: {prefix || ''}{data.week} / Month: {prefix || ''}{data.month}
            </div>
          </div>
        ))}
        <div style={{ background: '#111', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Top Athlete</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4ade80' }}>{mostActiveAthletes[0]?.gig_count || 0} gigs</div>
          <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem' }}>
            {mostActiveAthletes[0]?.full_name || 'N/A'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#111', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>New Users (30 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
              <YAxis stroke="#555" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: '0.75rem' }} />
              <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#111', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Approved Payouts $ (30 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
              <YAxis stroke="#555" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: '0.75rem' }} />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Athletes bar chart */}
      <div style={{ background: '#111', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Top 10 Athletes by Gig Count</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mostActiveAthletes.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="full_name" stroke="#555" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
            <YAxis stroke="#555" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: '0.75rem' }} />
            <Bar dataKey="gig_count" fill="#4ade80" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 6 Medium Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Gig Completion', value: `${gigCompletionRate.toFixed(1)}%`, color: '#4ade80' },
          { label: 'Payout Volume', value: `$${payoutVolume.total.toLocaleString()}`, color: '#4ade80' },
          { label: 'Avg Payout', value: `$${payoutVolume.avg}`, color: '#4ade80' },
          { label: 'Retention (30d)', value: `${retentionRate.toFixed(1)}%`, color: '#4ade80' },
          { label: 'Churn (30d)', value: `${churnRate.toFixed(1)}%`, color: '#f87171' },
          { label: 'Avg Time to 1st Gig', value: `${timeToFirstGig.toFixed(1)}d`, color: '#fbbf24' },
          { label: 'Referral Rate', value: `${(referralRate * 100).toFixed(1)}%`, color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Top Athletes list */}
      <div style={{ background: '#111', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Top Athletes Leaderboard</div>
        {mostActiveAthletes.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < mostActiveAthletes.length - 1 ? '1px solid #222' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#555', width: '1.5rem' }}>#{i + 1}</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{a.full_name || a.email}</div>
                <div style={{ fontSize: '0.65rem', color: '#666' }}>{a.school}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80' }}>{a.gig_count} gigs</div>
              <div style={{ fontSize: '0.65rem', color: '#666' }}>${a.total_earnings?.toFixed(0) || '0'} earned</div>
            </div>
          </div>
        ))}
      </div>

      {/* Config / Text Injection */}
      <div style={{ background: '#111', border: '1px solid #2d1a4e', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem', color: '#a78bfa' }}>Site Config</div>
        <select
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontFamily: 'Courier New, monospace', fontSize: '0.8rem' }}
          value={textTarget}
          onChange={(e) => setTextTarget(e.target.value)}
        >
          <option value="landing_headline">Landing Headline</option>
          <option value="landing_subhead">Landing Subhead</option>
          <option value="athlete_welcome">Athlete Welcome Message</option>
          <option value="business_welcome">Business Welcome Message</option>
          <option value="announcement">Global Announcement</option>
        </select>
        <input
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontFamily: 'Courier New, monospace', fontSize: '0.8rem', boxSizing: 'border-box' }}
          placeholder={`New value for ${textTarget}...`}
          value={globalText}
          onChange={(e) => setGlobalText(e.target.value)}
        />
        <button
          style={{ width: '100%', padding: '0.5rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          onClick={handleTextChange}
        >
          Save Config
        </button>
      </div>
    </div>
  )
}
