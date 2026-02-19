import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side (bypasses RLS — use in API routes only)
// Lazy-initialized to avoid crashing client-side where SUPABASE_SERVICE_ROLE_KEY is unavailable
let _supabaseAdmin: ReturnType<typeof createClient> | null = null
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    }
    return (_supabaseAdmin as Record<string, unknown>)[prop as string]
  }
})