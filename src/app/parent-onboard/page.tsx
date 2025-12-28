import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function ParentOnboard({ searchParams }: { searchParams: { kid_id?: string } }) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  let kidName = 'your kid'

  if (searchParams.kid_id) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', searchParams.kid_id)
      .single()

    if (data?.full_name) {
      kidName = data.full_name.split(' ')[0]
    }
  }

  // If already logged in, send to dashboard with kid context
  if (session) {
    redirect(`/dashboard?fund_kid=${searchParams.kid_id || ''}`)
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono py-20 px-6 text-center">
      <h1 className="text-4xl sm:text-6xl font-bold mb-12">
        Hey Parent of {kidName}!
      </h1>

      <p className="text-xl sm:text-3xl mb-16 max-w-4xl mx-auto">
        {kidName} wants you to be their first sponsor on LocalHustle.<br />
        It's easy — fund a challenge, they complete it, they earn real money instantly.
      </p>

      <div className="bg-green-100 p-12 border-4 border-green-600 mb-16 max-w-3xl mx-auto">
        <p className="text-2xl mb-8">
          You'll fund a simple challenge (like "80/100 free throws").<br />
          When {kidName} completes it → you approve → money goes straight to them.
        </p>
        <p className="text-xl">
          No obligation after — just help them get started.
        </p>
      </div>

      <form action="/auth/signin" method="POST">
        <input type="hidden" name="kid_id" value={searchParams.kid_id || ''} />
        <button
          type="submit"
          className="w-full max-w-md h-20 text-2xl bg-black text-white font-bold cursor-pointer border-none"
        >
          Yes — Sponsor {kidName} Now
        </button>
      </form>

      <p className="text-lg mt-12 text-gray-600">
        You'll get a magic link — click it to fund their first challenge.
      </p>
    </div>
  )
}