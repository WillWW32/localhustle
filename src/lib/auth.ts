import { supabase } from './supabaseClient'

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const signOut = async () => {
  await supabase.auth.signOut()
}