// Simple {{variable}} template engine for emails and DMs

/**
 * Convert plain-text email body to minimal HTML so Resend can inject
 * open-tracking pixel and click-tracking links.
 * Preserves whitespace/line breaks visually without changing the reading experience.
 */
export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Linkify bare URLs
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1a73e8">$1</a>')
  const lines = escaped.split('\n').map(l => l || '&nbsp;').join('<br>')
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222;max-width:600px;margin:0 auto;padding:20px">${lines}</body></html>`
}

interface TemplateContext {
  athlete_first: string
  athlete_last: string
  grad_year: string | number
  position: string
  height: string
  weight: string
  high_school: string
  city: string
  state: string
  ppg: string | number
  rpg: string | number
  spg: string | number
  mpg: string | number
  highlight_url: string
  x_profile_url: string
  athlete_email: string
  parent_name: string
  parent_email: string
  school: string
  coach_first?: string
  coach_last: string
  coach_title?: string
  // school_intel fields
  program_style?: string
  recent_record?: string
  roster_needs?: string
  conference?: string
  fun_fact?: string
  [key: string]: any
}

export function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key]?.toString() || match
  })
}

export function buildContext(athlete: any, coach: any, schoolIntel?: any): TemplateContext {
  const stats = athlete.stats || {}
  const intel = schoolIntel || {}
  return {
    athlete_first: athlete.first_name,
    athlete_last: athlete.last_name,
    grad_year: athlete.grad_year,
    position: athlete.position || '',
    height: athlete.height || '',
    weight: athlete.weight || '',
    high_school: athlete.high_school || '',
    city: athlete.city || '',
    state: athlete.state || '',
    ppg: stats.ppg || '',
    rpg: stats.rpg || '',
    spg: stats.spg || '',
    mpg: stats.mpg || '',
    three_pt_pct: stats.three_pt_pct || stats.threePct || '',
    fg_pct: stats.fg_pct || stats.two_pt_pct || stats.fgPct || '',
    highlight_url: athlete.highlight_url || '',
    x_profile_url: athlete.x_profile_url || '',
    athlete_email: athlete.email,
    parent_name: athlete.parent_name || '',
    parent_email: athlete.parent_email || '',
    school: coach.school || '',
    coach_first: coach.first_name || '',
    coach_last: coach.last_name || 'Coach',
    coach_title: coach.title || '',
    // school_intel fields
    program_style: intel.program_style || '',
    recent_record: intel.recent_record || '',
    roster_needs: intel.roster_needs || '',
    conference: intel.conference || '',
    fun_fact: intel.fun_fact || '',
  }
}
