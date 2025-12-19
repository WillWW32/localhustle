import { supabase } from './supabaseClient'

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

// Spiced up magic link send with custom toast (call this instead of direct signInWithOtp)
export const sendMagicLink = async (email: string, role?: 'athlete' | 'business') => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { role },
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) {
    alert('Oops! Something went wrong. Try again?')
    return
  }

  // Spiced up notification
  alert(`
🎉 Magic link sent!

Check your email for the login link.

It’ll take you straight to your dashboard.

No passwords, no hassle — just hustle.

See you inside! 🚀
  `.trim())
}