'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MasterAdminDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  // Priority 4 Metrics (Big)
  const [newBusinessOnboards, setNewBusinessOnboards] = useState({ today: 0, week: 0, month: 0 })
  const [businessWalletDeposits, setBusinessWalletDeposits] = useState({ today: 0, week: 0, month: 0 })
  const [newAthletes, setNewAthletes] = useState({ today: 0, week: 0, month: 0 })
  const [mostActiveAthletes, setMostActiveAthletes] = useState([])

  // Next 6 Metrics (Medium)
  const [gigCompletionRate, setGigCompletionRate] = useState(0)
  const [payoutVolume, setPayoutVolume] = useState({ total: 0, avg: 0 })
  const [retentionRate, setRetentionRate] = useState(0)
  const [churnRate, setChurnRate] = useState(0)
  const [timeToFirstGig, setTimeToFirstGig] = useState(0)
  const [referralRate, setReferralRate] = useState(0)

  // Graphs
  const [userGrowthData, setUserGrowthData] = useState([])
  const [payoutGrowthData, setPayoutGrowthData] = useState([])

  // Text Injection
  const [globalText, setGlobalText] = useState('')

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

    // Realtime updates
    const subscription = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => fetchAllMetrics())
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [router])

  const fetchAllMetrics = async () => {
    // Priority 4 – Big Metrics
    const newBusiness = await getCount('businesses', 'created_at')
    const walletDeposits = await getSum('wallet_deposits', 'amount', 'created_at') // assume you have a deposits log table
    const newAthletes = await getCount('profiles', 'created_at')
    const mostActive = await getTop('profiles', 'gig_count', 10)

    setNewBusinessOnboards(newBusiness)
    setBusinessWalletDeposits(walletDeposits)
    setNewAthletes(newAthletes)
    setMostActiveAthletes(mostActive)

    // Next 6 – Medium Metrics
    const completionRate = await calculateCompletionRate()
    const payouts = await getPayoutStats()
    const retention = await calculateRetention()
    const churn = await calculateChurn()
    const firstGigTime = await calculateFirstGigTime()
    const referrals = await calculateReferralRate()

    setGigCompletionRate(completionRate)
    setPayoutVolume(payouts)
    setRetentionRate(retention)
    setChurnRate(churn)
    setTimeToFirstGig(firstGigTime)
    setReferralRate(referrals)

    // Graphs
    const userGrowth = await getTimeSeries('profiles', 'created_at', 30)
    const payoutGrowth = await getTimeSeries('payouts', 'approved_at', 30, 'amount')
    setUserGrowthData(userGrowth)
    setPayoutGrowthData(payoutGrowth)
  }

  // Helper functions (implement these based on your tables)
  const getCount = async (table, dateField) => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]

    const { count: todayCount } = await supabase.from(table).select('*', { count: 'exact' }).gte(dateField, today)
    const { count: weekCount } = await supabase.from(table).select('*', { count: 'exact' }).gte(dateField, weekAgo)
    const { count: monthCount } = await supabase.from(table).select('*', { count: 'exact' }).gte(dateField, monthAgo)

    return { today: todayCount || 0, week: weekCount || 0, month: monthCount || 0 }
  }

  // ... other helpers (getSum, getTop, calculateCompletionRate, etc.) can be added similarly

  if (loading) return <p className="text-center py-32 text-2xl">Loading Admin...</p>
  if (!isAuthorized) return null

  return (
    <div className="container py-8 font-mono bg-gray-950 text-white min-h-screen">
      <h1 className="text-5xl font-bold text-center mb-16">Master Admin Dashboard</h1>

      {/* Priority 4 – Large Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <Card className="bg-gray-900 border-2 border-green-600">
          <CardHeader>New Business Onboards</CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-400">{newBusinessOnboards.today}</p>
            <p className="text-sm text-gray-400">Today / Week / Month: {newBusinessOnboards.week} / {newBusinessOnboards.month}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-2 border-green-600">
          <CardHeader>Business Wallet Deposits</CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-400">${businessWalletDeposits.today}</p>
            <p className="text-sm text-gray-400">Today / Week / Month: ${businessWalletDeposits.week} / ${businessWalletDeposits.month}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-2 border-green-600">
          <CardHeader>New Athletes</CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-400">{newAthletes.today}</p>
            <p className="text-sm text-gray-400">Today / Week / Month: {newAthletes.week} / {newAthletes.month}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-2 border-green-600">
          <CardHeader>Most Active Athletes</CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-400">{mostActiveAthletes[0]?.gig_count || 0}</p>
            <p className="text-sm text-gray-400">Top Athlete Gigs: {mostActiveAthletes[0]?.full_name || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <Card className="bg-gray-900 border-2 border-green-600">
          <CardHeader>User Growth (30 days)</CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-2 border-green-600">
          <CardHeader>Top 10 Most Active Athletes</CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostActiveAthletes.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="full_name" stroke="#aaa" angle={-45} textAnchor="end" height={70} />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="gig_count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Next 6 Metrics – Smaller Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <Card className="bg-gray-800 border border-gray-600">
          <CardHeader>Gig Completion Rate</CardHeader>
          <CardContent className="text-4xl font-bold text-green-400">{gigCompletionRate.toFixed(1)}%</CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-600">
          <CardHeader>Payout Volume</CardHeader>
          <CardContent className="text-4xl font-bold text-green-400">${payoutVolume.total}</CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-600">
          <CardHeader>Retention Rate</CardHeader>
          <CardContent className="text-4xl font-bold text-green-400">{retentionRate.toFixed(1)}%</CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-600">
          <CardHeader>Churn Rate</CardHeader>
          <CardContent className="text-4xl font-bold text-red-400">{churnRate.toFixed(1)}%</CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-600">
          <CardHeader>Avg Time to First Gig</CardHeader>
          <CardContent className="text-4xl font-bold text-yellow-400">{timeToFirstGig.toFixed(1)} days</CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-600">
          <CardHeader>Referral Rate</CardHeader>
          <CardContent className="text-4xl font-bold text-purple-400">{referralRate.toFixed(2)}x</CardContent>
        </Card>
      </div>

      {/* Project Management – Text Injection */}
      <Card className="mb-16 bg-gray-900 border-2 border-purple-600">
        <CardHeader>Project Management – Text Changes</CardHeader>
        <CardContent>
          <Input
            placeholder="Enter new global text (e.g., landing headline)"
            value={globalText}
            onChange={(e) => setGlobalText(e.target.value)}
            className="mb-6 bg-gray-800 text-white border-gray-600"
          />
          <Button onClick={handleTextChange} className="bg-purple-600 text-white hover:bg-purple-700">
            Submit Change
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}