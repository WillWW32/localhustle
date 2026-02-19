import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side (bypasses RLS — use in API routes only)
// Lazy-initialized to avoid crashing client-side where SUPABASE_SERVICE_ROLE_KEY is unavailable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseAdmin: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: any = new Proxy({}, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    }
    return _supabaseAdmin[prop]
  }
})