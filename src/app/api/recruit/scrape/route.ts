import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface ScrapedCoach {
  firstName?: string
  lastName?: string
  fullName: string
  title: string
  email?: string
  phone?: string
}

const titleKeywords = [
  'Head Coach', 'Assistant Coach', 'Associate Coach', 'Player Development Coach',
  'Shooting Coach', 'Recruiting Coordinator', 'Director of Basketball Operations',
  'Director of Scouting', 'Director of Recruiting', 'Coach', 'Offensive Coordinator',
  'Defensive Coordinator', 'Development Coach', 'Skill Development Coach', 'Coordinator',
]

function extractNames(text: string): string[] {
  const namePattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g
  const matches = text.match(namePattern) || []
  return matches
    .filter(name => name.length > 2 && !titleKeywords.some(kw => name.toLowerCase().includes(kw.toLowerCase())))
    .slice(0, 1)
}

function extractTitles(text: string): string[] {
  const titles: string[] = []
  for (const keyword of titleKeywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      titles.push(keyword)
    }
  }
  return titles
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : undefined
}

function extractPhone(text: string): string | undefined {
  const match = text.match(/(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/)
  return match ? match[0] : undefined
}

function parseCoaches(html: string): ScrapedCoach[] {
  const $ = cheerio.load(html)
  const coaches: ScrapedCoach[] = []

  const staffSelectors = [
    '[data-role="coach"]', '.staff-member', '.coach-profile', '.coach-item',
    '[class*="coach"]', '[class*="staff"]', 'tr:has(td)',
  ]

  for (const selector of staffSelectors) {
    $(selector).each((_, element) => {
      const text = $(element).text()
      const names = extractNames(text)
      const titles = extractTitles(text)
      const email = extractEmail(text)
      const phone = extractPhone(text)

      if ((names.length > 0 || email) && titles.length > 0) {
        for (const title of titles) {
          const coach: ScrapedCoach = {
            fullName: names.length > 0 ? names[0] : email || 'Unknown',
            title, email, phone,
          }
          if (names.length > 0) {
            const parts = names[0].split(' ')
            if (parts.length >= 2) {
              coach.firstName = parts[0]
              coach.lastName = parts.slice(1).join(' ')
            } else if (parts.length === 1) {
              coach.lastName = parts[0]
            }
          }
          coaches.push(coach)
        }
      }
    })
    if (coaches.length > 0) break
  }

  if (coaches.length === 0) {
    const lines = $('body').text().split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      const titles = extractTitles(trimmed)
      if (titles.length > 0) {
        const names = extractNames(trimmed)
        const email = extractEmail(trimmed)
        const phone = extractPhone(trimmed)
        if (names.length > 0 || email) {
          const coach: ScrapedCoach = {
            fullName: names.length > 0 ? names[0] : email || 'Unknown',
            title: titles[0], email, phone,
          }
          if (names.length > 0) {
            const parts = names[0].split(' ')
            if (parts.length >= 2) { coach.firstName = parts[0]; coach.lastName = parts.slice(1).join(' ') }
            else if (parts.length === 1) { coach.lastName = parts[0] }
          }
          coaches.push(coach)
        }
      }
    }
  }

  const seen = new Set<string>()
  return coaches.filter(coach => {
    const key = `${coach.fullName}|${coach.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    return await response.text()
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, schoolName, division, state } = body

    if (!url || !schoolName) {
      return NextResponse.json({ error: 'url and schoolName are required' }, { status: 400 })
    }

    let urlToScrape: string
    try { urlToScrape = new URL(url).toString() }
    catch { return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 }) }

    const html = await fetchWithTimeout(urlToScrape, 10000)
    const coaches = parseCoaches(html)

    return NextResponse.json({
      success: true, schoolName, division: division || null,
      state: state || null, url: urlToScrape, coachCount: coaches.length, coaches,
    })
  } catch (err: any) {
    let errorMessage = 'Internal server error'
    let statusCode = 500
    if (err instanceof Error) {
      if (err.name === 'AbortError') { errorMessage = 'Request timeout'; statusCode = 408 }
      else { errorMessage = err.message; statusCode = 400 }
    }
    return NextResponse.json({ error: errorMessage, success: false }, { status: statusCode })
  }
}
