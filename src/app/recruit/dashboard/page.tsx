'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Athlete {
  id: string
  firstName: string
  lastName: string
  sport: string
  position: string
  highSchool: string
  gradYear: string
  campaignStatus: 'active' | 'paused' | 'pending'
  responseCount: number
  slug: string
}

export default function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAthletes = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in to view your dashboard')
          setIsLoading(false)
          return
        }

        // Fetch athletes where parent_email matches logged-in user
        const { data: athleteRows, error: athleteErr } = await supabase
          .from('athletes')
          .select('*')
          .eq('parent_email', user.email)
          .order('created_at', { ascending: false })

        if (athleteErr) throw athleteErr
        if (!athleteRows || athleteRows.length === 0) {
          setAthletes([])
          setIsLoading(false)
          return
        }

        // Fetch campaigns for these athletes
        const athleteIds = athleteRows.map(a => a.id)
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, athlete_id, status')
          .in('athlete_id', athleteIds)

        // Fetch response counts
        const { data: responses } = await supabase
          .from('responses')
          .select('athlete_id')
          .in('athlete_id', athleteIds)

        const campaignMap = new Map<string, string>()
        campaigns?.forEach(c => campaignMap.set(c.athlete_id, c.status))

        const responseCountMap = new Map<string, number>()
        responses?.forEach(r => {
          responseCountMap.set(r.athlete_id, (responseCountMap.get(r.athlete_id) || 0) + 1)
        })

        const mapped: Athlete[] = athleteRows.map(a => ({
          id: a.id,
          firstName: a.first_name,
          lastName: a.last_name,
          sport: a.sport || '',
          position: a.position || '',
          highSchool: a.high_school || '',
          gradYear: a.grad_year || '',
          campaignStatus: (campaignMap.get(a.id) as Athlete['campaignStatus']) || 'pending',
          responseCount: responseCountMap.get(a.id) || 0,
          slug: a.slug || '',
        }))

        setAthletes(mapped)
      } catch (err) {
        console.error('Failed to load athletes:', err)
        setError('Failed to load athletes')
      } finally {
        setIsLoading(false)
      }
    }
    loadAthletes()
  }, [])

  const getStatusBadge = (status: string) => {
    if (status === 'active') return 'dash-badge-green'
    if (status === 'paused') return 'dash-badge-yellow'
    return 'dash-badge'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { active: 'Active', paused: 'Paused', pending: 'Pending' }
    return labels[status] || ''
  }

  return (
    <div className="dashboard-container" style={{ padding: '0 1rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 0', borderBottom: '3px solid black', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Recruitment Dashboard</h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>Manage your athlete recruitment campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="dash-card" style={{ textAlign: 'center' }}>
          <p className="dash-stat-value">{athletes.length}</p>
          <p className="dash-stat-label">Athletes</p>
        </div>
        <div className="dash-card" style={{ textAlign: 'center' }}>
          <p className="dash-stat-value">{athletes.filter((a) => a.campaignStatus === 'active').length}</p>
          <p className="dash-stat-label">Active</p>
        </div>
        <div className="dash-card" style={{ textAlign: 'center' }}>
          <p className="dash-stat-value">{athletes.reduce((sum, a) => sum + a.responseCount, 0)}</p>
          <p className="dash-stat-label">Responses</p>
        </div>
      </div>

      {/* Heading with Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Your Athletes</h2>
        <Link href="/recruit/signup" className="dash-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          + Add Athlete
        </Link>
      </div>

      {/* Athletes List */}
      {isLoading ? (
        <div className="dash-empty">Loading athletes...</div>
      ) : error ? (
        <div className="dash-empty" style={{ color: 'red' }}>{error}</div>
      ) : athletes.length === 0 ? (
        <div className="dash-empty">
          <p style={{ marginBottom: '1rem' }}>No athletes yet. Get started by adding your first athlete.</p>
          <Link href="/recruit/signup" className="dash-btn">Add Your First Athlete</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {athletes.map((athlete) => (
            <Link
              key={athlete.id}
              href={`/recruit/dashboard/athletes/${athlete.id}`}
              className="dash-card"
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                    {athlete.firstName} {athlete.lastName}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    {athlete.sport} &bull; {athlete.position}
                  </p>
                  <p style={{ color: '#999', fontSize: '0.75rem', marginBottom: 0 }}>
                    {athlete.highSchool} &bull; Class of {athlete.gradYear}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={getStatusBadge(athlete.campaignStatus)}>
                    {getStatusLabel(athlete.campaignStatus)}
                  </span>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'green', marginTop: '0.5rem', marginBottom: 0 }}>
                    {athlete.responseCount}
                  </p>
                  <p style={{ fontSize: '0.625rem', color: '#999', marginBottom: 0 }}>responses</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
