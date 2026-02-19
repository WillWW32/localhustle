'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface ScoutingReport {
  overall_score: number
  division_projection: string
  division_confidence: number
  stars: number | null
  attributes: Record<string, { score: number; note: string }>
  summary: string
  strengths: string[]
  development_areas: string[]
  coaching_notes: string
  comparable_programs: string[]
}

interface CoachLetter {
  id: string
  coach_name: string
  school: string
  letter_text: string
  created_at: string
}

export default function ScoutingReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<ScoutingReport | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [letters, setLetters] = useState<CoachLetter[]>([])
  const [showLetterForm, setShowLetterForm] = useState(false)
  const [letterForm, setLetterForm] = useState({ coachName: '', school: '', letterText: '' })
  const [savingLetter, setSavingLetter] = useState(false)

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/recruit/scouting-report?athleteId=${id}`)
      const data = await res.json()
      if (data.report) {
        setReport(data.report)
        setGeneratedAt(data.generatedAt)
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLetters = async () => {
    try {
      const res = await fetch(`/api/recruit/coach-letters?athleteId=${id}`)
      const data = await res.json()
      if (Array.isArray(data)) setLetters(data)
    } catch (err) {
      console.error('Failed to fetch letters:', err)
    }
  }

  useEffect(() => {
    fetchReport()
    fetchLetters()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const generateReport = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/recruit/scouting-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: id }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setReport(data.report)
        setGeneratedAt(data.generatedAt)
      }
    } catch (err) {
      setError('Failed to generate report')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const saveLetter = async () => {
    if (!letterForm.coachName || !letterForm.letterText) return
    setSavingLetter(true)
    try {
      const res = await fetch('/api/recruit/coach-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: id, ...letterForm }),
      })
      if (res.ok) {
        setLetterForm({ coachName: '', school: '', letterText: '' })
        setShowLetterForm(false)
        fetchLetters()
      }
    } catch (err) {
      console.error('Failed to save letter:', err)
    } finally {
      setSavingLetter(false)
    }
  }

  const deleteLetter = async (letterId: string) => {
    if (!confirm('Delete this letter?')) return
    try {
      await fetch(`/api/recruit/coach-letters?id=${letterId}`, { method: 'DELETE' })
      fetchLetters()
    } catch (err) {
      console.error('Failed to delete letter:', err)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return '#b45309'
    return 'red'
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

  if (loading) return <div className="dash-empty">Loading scouting report...</div>

  return (
    <div className="dashboard-container" style={{ padding: '0 1rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 0', borderBottom: '3px solid black', marginBottom: '1.5rem' }}>
        <Link href={`/recruit/dashboard/athletes/${id}`} style={{ color: '#666', fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Athlete
        </Link>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
          AI Scouting Report
        </h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
          {generatedAt ? `Generated ${new Date(generatedAt).toLocaleDateString()}` : 'Not yet generated'}
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', border: '3px solid red', background: '#fff5f5', color: 'red', marginBottom: '1rem', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      {!report ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>No Scouting Report Yet</h2>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Generate an AI-powered scouting report based on the athlete profile data.
          </p>
          <button onClick={generateReport} disabled={generating} className="dash-btn" style={{ padding: '0.75rem 2rem' }}>
            {generating ? 'Generating Report...' : 'Generate Scouting Report'}
          </button>
          {generating && (
            <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '1rem' }}>This may take 10-20 seconds...</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Division Projection */}
          <div className="dash-card" style={{ borderColor: 'green', borderWidth: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 'bold', color: 'green', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Division Projection</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {getDivisionLabel(report.division_projection)}
                  {report.stars && (
                    <span style={{ color: '#b45309', marginLeft: '0.5rem' }}>
                      {'★'.repeat(report.stars)}{'☆'.repeat(5 - report.stars)}
                    </span>
                  )}
                </p>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>
                  Confidence: {Math.round(report.division_confidence * 100)}%
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: getScoreColor(report.overall_score), marginBottom: 0 }}>
                  {report.overall_score}
                </p>
                <p style={{ color: '#999', fontSize: '0.625rem', textTransform: 'uppercase' }}>Overall</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="dash-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Summary</h3>
            <p style={{ color: '#333', lineHeight: 1.6 }}>{report.summary}</p>
          </div>

          {/* Attribute Scores */}
          <div className="dash-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Attribute Scores</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(report.attributes).map(([key, attr]) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{key}</span>
                    <span style={{ fontWeight: 'bold', color: getScoreColor(attr.score) }}>{attr.score}</span>
                  </div>
                  <div style={{ height: '8px', background: '#eee', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${attr.score}%`, background: getScoreColor(attr.score), transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>{attr.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Development */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="dash-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'green' }}>Strengths</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {report.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'green', fontWeight: 'bold', flexShrink: 0 }}>+</span>
                    <span style={{ fontSize: '0.875rem' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dash-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#b45309' }}>Development Areas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {report.development_areas.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#b45309', fontWeight: 'bold', flexShrink: 0 }}>-</span>
                    <span style={{ fontSize: '0.875rem' }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparable Programs */}
          {report.comparable_programs && report.comparable_programs.length > 0 && (
            <div className="dash-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Comparable Programs</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {report.comparable_programs.map((p, i) => (
                  <span key={i} className="dash-badge" style={{ padding: '0.5rem 0.75rem' }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Coaching Notes */}
          <div className="dash-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Coaching Notes</h3>
            <p style={{ color: '#333', lineHeight: 1.6, fontSize: '0.875rem' }}>{report.coaching_notes}</p>
          </div>

          {/* Regenerate */}
          <div style={{ textAlign: 'center' }}>
            <button onClick={generateReport} disabled={generating} className="dash-btn-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.875rem' }}>
              {generating ? 'Regenerating...' : 'Regenerate Report'}
            </button>
          </div>
        </div>
      )}

      {/* Coach Letters Section */}
      <div style={{ marginTop: '2rem' }}>
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 0 }}>Coach Letters / Recommendations</h3>
            <button
              onClick={() => setShowLetterForm(!showLetterForm)}
              className="dash-btn"
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
            >
              + Add Letter
            </button>
          </div>

          {showLetterForm && (
            <div style={{ border: '2px solid #eee', padding: '1rem', marginBottom: '1rem' }}>
              <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#999', display: 'block', marginBottom: '0.25rem' }}>Coach Name *</label>
                  <input
                    type="text"
                    value={letterForm.coachName}
                    onChange={e => setLetterForm(p => ({ ...p, coachName: e.target.value }))}
                    className="dash-input"
                    placeholder="Coach Smith"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#999', display: 'block', marginBottom: '0.25rem' }}>School</label>
                  <input
                    type="text"
                    value={letterForm.school}
                    onChange={e => setLetterForm(p => ({ ...p, school: e.target.value }))}
                    className="dash-input"
                    placeholder="Big Sky High School"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#999', display: 'block', marginBottom: '0.25rem' }}>Letter Text *</label>
                <textarea
                  value={letterForm.letterText}
                  onChange={e => setLetterForm(p => ({ ...p, letterText: e.target.value }))}
                  className="dash-textarea"
                  rows={6}
                  placeholder="Paste or type the coach's letter here..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button onClick={() => setShowLetterForm(false)} className="dash-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Cancel</button>
                <button onClick={saveLetter} disabled={savingLetter || !letterForm.coachName || !letterForm.letterText} className="dash-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                  {savingLetter ? 'Saving...' : 'Save Letter'}
                </button>
              </div>
            </div>
          )}

          {letters.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>
              No coach letters yet. Add recommendations from high school or club coaches.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {letters.map(letter => (
                <div key={letter.id} style={{ border: '2px solid #eee', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.125rem' }}>{letter.coach_name}</p>
                      {letter.school && <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: 0 }}>{letter.school}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#999', fontSize: '0.75rem' }}>{new Date(letter.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => deleteLetter(letter.id)}
                        style={{ color: 'red', fontWeight: 'bold', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p style={{ color: '#333', fontSize: '0.875rem', whiteSpace: 'pre-wrap', marginBottom: 0 }}>{letter.letter_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
