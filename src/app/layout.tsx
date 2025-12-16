import './globals.css'
import { supabase } from '@/lib/supabaseClient'
import { getSession } from '@/lib/auth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Only protect paths except root
  const pathname = (await import('next/headers')).headers().get('x-pathname') || ''

  if (session || pathname === '/') {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center">
        <p className="text-center">
          Please <a href="/" className="text-blue-600 underline">log in</a> to continue.
        </p>
      </body>
    </html>
  )
}