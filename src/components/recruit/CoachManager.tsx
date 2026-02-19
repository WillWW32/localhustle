'use client'

import React, { useState, useEffect } from 'react'

interface Coach {
  id: string
  first_name: string
  last_name: string
  email: string
  school: string
  division?: string
  state?: string
  title?: string
  phone?: string
  created_at?: string
}

interface ScrapedCoach {
  firstName?: string
  lastName?: string
  fullName: string
  title: string
  email?: string
  phone?: string
}

interface ScrapeResult {
  success: boolean
  schoolName: string
  division: string | null
  state: string | null
  url: string
  coachCount: number
  coaches: ScrapedCoach[]
  error?: string
}

export default function CoachManager() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [divisionFilter, setDivisionFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [showScrapeForm, setShowScrapeForm] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', school: '', division: '', state: '', title: '', phone: '',
  })

  const [scrapeData, setScrapeData] = useState({ url: '', schoolName: '', division: 'D1', state: '' })
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [scrapeResults, setScrapeResults] = useState<ScrapeResult | null>(null)
  const [scrapedCoachesSelected, setScrapedCoachesSelected] = useState<Set<number>>(new Set())

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  useEffect(() => { fetchCoaches() }, [])

  const fetchCoaches = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (divisionFilter !== 'all') params.append('division', divisionFilter)
      if (stateFilter !== 'all') params.append('state', stateFilter)
      const response = await fetch(`/api/recruit/coaches?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch coaches')
      const data = await response.json()
      setCoaches(data.coaches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coaches')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/recruit/coaches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      })
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to add coach') }
      const data = await response.json()
      setCoaches([...coaches, data.coach])
      setFormData({ first_name: '', last_name: '', email: '', school: '', division: '', state: '', title: '', phone: '' })
      setShowAddForm(false)
      setSuccess(`Coach ${formData.first_name} ${formData.last_name} added!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add coach')
    } finally {
      setLoading(false)
    }
  }

  const handleScrapeSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setScrapeLoading(true)
    setError(null)
    setScrapeResults(null)
    try {
      const response = await fetch('/api/recruit/scrape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scrapeData),
      })
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to scrape school') }
      const data = await response.json()
      setScrapeResults(data)
      setScrapedCoachesSelected(new Set())
      setSuccess(`Found ${data.coachCount} coach(es) at ${scrapeData.schoolName}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape school')
    } finally {
      setScrapeLoading(false)
    }
  }

  const handleSaveScrapedCoaches = async () => {
    if (!scrapeResults || scrapedCoachesSelected.size === 0) { setError('Please select at least one coach'); return }
    setLoading(true)
    setError(null)
    try {
      const selected = Array.from(scrapedCoachesSelected).map(idx => scrapeResults.coaches[idx])
      let savedCount = 0
      for (const coach of selected) {
        try {
          const response = await fetch('/api/recruit/coaches', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: coach.firstName || '', last_name: coach.lastName || '', email: coach.email || '',
              school: scrapeResults.schoolName, division: scrapeResults.division, state: scrapeResults.state, title: coach.title, phone: coach.phone,
            }),
          })
          if (response.ok) { savedCount++; const data = await response.json(); setCoaches(prev => [...prev, data.coach]) }
        } catch (err) { console.error(`Failed to save ${coach.fullName}:`, err) }
      }
      setSuccess(`Saved ${savedCount} coach(es)`)
      setScrapeResults(null)
      setShowScrapeForm(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coaches')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCoach = async (coachId: string) => {
    if (!confirm('Delete this coach?')) return
    setError(null)
    try {
      const response = await fetch(`/api/recruit/coaches/${coachId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete coach')
      setCoaches(coaches.filter(c => c.id !== coachId))
      setSuccess('Coach deleted')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coach')
    }
  }

  const filteredCoaches = coaches.filter(coach => {
    if (divisionFilter !== 'all' && coach.division !== divisionFilter) return false
    if (stateFilter !== 'all' && coach.state !== stateFilter) return false
    const q = searchQuery.toLowerCase()
    if (q && !coach.first_name.toLowerCase().includes(q) && !coach.last_name.toLowerCase().includes(q) &&
        !coach.email.toLowerCase().includes(q) && !coach.school.toLowerCase().includes(q)) return false
    return true
  })

  const coachStats = {
    total: coaches.length,
    d1: coaches.filter(c => c.division === 'D1').length,
    d2: coaches.filter(c => c.division === 'D2').length,
    naia: coaches.filter(c => c.division === 'NAIA').length,
    juco: coaches.filter(c => c.division === 'JUCO').length,
  }

  const statesArr = Array.from(new Set(coaches.map(c => c.state).filter(Boolean))).sort()
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCoaches = filteredCoaches.slice(startIndex, startIndex + itemsPerPage)
  const totalPages = Math.ceil(filteredCoaches.length / itemsPerPage)

  const inputClass = 'dash-input'

  return (
    <div>
      {error && (
        <div style={{ padding: '0.75rem 1rem', border: '3px solid red', background: '#fff5f5', color: 'red', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>X</button>
        </div>
      )}
      {success && (
        <div style={{ padding: '0.75rem 1rem', border: '3px solid green', background: '#f0fff0', color: 'green', marginBottom: '1rem', fontWeight: 'bold' }}>
          {success}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Coach Manager</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setShowAddForm(true); setShowScrapeForm(false) }} className="dash-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            + Add Coach
          </button>
          <button onClick={() => { setShowScrapeForm(true); setShowAddForm(false) }} className="dash-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Scrape School
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2" style={{ marginBottom: '1rem' }}>
        {[
          { label: 'Total', value: coachStats.total },
          { label: 'D1', value: coachStats.d1 },
          { label: 'D2', value: coachStats.d2 },
          { label: 'NAIA', value: coachStats.naia },
          { label: 'JUCO', value: coachStats.juco },
        ].map((s, i) => (
          <div key={i} className="dash-card" style={{ textAlign: 'center', padding: '0.5rem' }}>
            <p style={{ fontSize: '0.625rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.125rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Coach Form */}
      {showAddForm && (
        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 0 }}>Add Coach Manually</h3>
            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>X</button>
          </div>
          <form onSubmit={handleAddCoach} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input type="text" placeholder="First Name" required value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className={inputClass} />
            <input type="text" placeholder="Last Name" required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className={inputClass} />
            <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
            <input type="text" placeholder="School" required value={formData.school} onChange={e => setFormData({ ...formData, school: e.target.value })} className={inputClass} />
            <select value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} className={inputClass}>
              <option value="">Division</option>
              <option value="D1">D1</option><option value="D2">D2</option><option value="D3">D3</option>
              <option value="NAIA">NAIA</option><option value="JUCO">JUCO</option>
            </select>
            <input type="text" placeholder="State" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className={inputClass} />
            <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputClass} />
            <input type="tel" placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
            <button type="submit" disabled={loading} className="dash-btn sm:col-span-4" style={{ marginTop: '0.25rem' }}>
              {loading ? 'Adding...' : '+ Add Coach'}
            </button>
          </form>
        </div>
      )}

      {/* Scrape Form */}
      {showScrapeForm && (
        <div className="dash-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 0 }}>Scrape School Athletics Page</h3>
            <button onClick={() => { setShowScrapeForm(false); setScrapeResults(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>X</button>
          </div>
          {!scrapeResults ? (
            <form onSubmit={handleScrapeSchool} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <input type="url" placeholder="Athletics URL" required value={scrapeData.url} onChange={e => setScrapeData({ ...scrapeData, url: e.target.value })} className={`${inputClass} sm:col-span-2`} />
              <input type="text" placeholder="School Name" required value={scrapeData.schoolName} onChange={e => setScrapeData({ ...scrapeData, schoolName: e.target.value })} className={inputClass} />
              <select value={scrapeData.division} onChange={e => setScrapeData({ ...scrapeData, division: e.target.value })} className={inputClass}>
                <option value="D1">D1</option><option value="D2">D2</option><option value="D3">D3</option>
                <option value="NAIA">NAIA</option><option value="JUCO">JUCO</option>
              </select>
              <button type="submit" disabled={scrapeLoading} className="dash-btn">
                {scrapeLoading ? 'Scraping...' : 'Scrape'}
              </button>
            </form>
          ) : (
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Found {scrapeResults.coachCount} Coach(es) at {scrapeResults.schoolName}</p>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                {scrapeResults.coaches.map((coach, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                    <input type="checkbox" checked={scrapedCoachesSelected.has(idx)}
                      onChange={e => { const s = new Set(scrapedCoachesSelected); e.target.checked ? s.add(idx) : s.delete(idx); setScrapedCoachesSelected(s) }} />
                    <div>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.125rem' }}>{coach.fullName}</p>
                      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{coach.title}</p>
                      {coach.email && <p style={{ color: '#999', fontSize: '0.75rem', marginBottom: 0 }}>{coach.email}</p>}
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSaveScrapedCoaches} disabled={loading || scrapedCoachesSelected.size === 0} className="dash-btn-green" style={{ flex: 1 }}>
                  {loading ? 'Saving...' : `Save ${scrapedCoachesSelected.size} Coach(es)`}
                </button>
                <button onClick={() => { setScrapeResults(null); setScrapeData({ url: '', schoolName: '', division: 'D1', state: '' }) }} className="dash-btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="dash-card" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <input type="text" placeholder="Search name, email, school..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          className={inputClass} style={{ flex: 1, minWidth: '200px' }} />
        <select value={divisionFilter} onChange={e => { setDivisionFilter(e.target.value); setCurrentPage(1) }} className={inputClass} style={{ width: 'auto' }}>
          <option value="all">All Divisions</option>
          <option value="D1">D1</option><option value="D2">D2</option><option value="D3">D3</option>
          <option value="NAIA">NAIA</option><option value="JUCO">JUCO</option>
        </select>
        <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setCurrentPage(1) }} className={inputClass} style={{ width: 'auto' }}>
          <option value="all">All States</option>
          {statesArr.map(state => (<option key={state} value={state}>{state}</option>))}
        </select>
      </div>

      {/* Table */}
      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="dash-empty">Loading coaches...</div>
        ) : paginatedCoaches.length === 0 ? (
          <div className="dash-empty">
            <p>No coaches found</p>
            <button onClick={() => setShowAddForm(true)} className="dash-btn" style={{ marginTop: '0.5rem' }}>Add your first coach</button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>School</th>
                    <th>Div</th>
                    <th>State</th>
                    <th>Title</th>
                    <th>Email</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCoaches.map(coach => (
                    <tr key={coach.id}>
                      <td style={{ fontWeight: 'bold' }}>{coach.first_name} {coach.last_name}</td>
                      <td>{coach.school}</td>
                      <td><span className="dash-badge">{coach.division || '-'}</span></td>
                      <td>{coach.state || '-'}</td>
                      <td style={{ fontSize: '0.75rem', color: '#666' }}>{coach.title || '-'}</td>
                      <td style={{ fontSize: '0.75rem', color: '#666' }}>{coach.email}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteCoach(coach.id)}
                          style={{ color: 'red', fontWeight: 'bold', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: '0.75rem 1rem', borderTop: '2px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCoaches.length)} of {filteredCoaches.length}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="dash-btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Prev</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="dash-btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
