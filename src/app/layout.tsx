import './globals.css'
import { supabase } from '@/lib/supabaseClient'
import { getSession } from '@/lib/auth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="en">
      <body>
        {session ? (
          children
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-center">
              Please <a href="/" className="text-blue-600 underline">log in</a> to continue.
            </p>
          </div>
        )}
      </body>
    </html>
  )
}