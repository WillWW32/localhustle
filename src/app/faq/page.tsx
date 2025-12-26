'use client'

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white text-black font-mono py-8 px-4 sm:px-8">
      {/* Slogan + Triangle */}
      <p className="text-2xl sm:text-3xl text-center mb-4">
        Community Driven Support for Student Athletes
      </p>
      <div className="text-5xl sm:text-6xl text-center mb-12">▼</div>

      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-16">
        Frequently Asked Questions
      </h1>

      <div className="max-w-4xl mx-auto space-y-12 text-lg sm:text-xl">
        {/* Compliance & Safety */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Is LocalHustle NIL compliant for high school athletes?
          </h2>
          <p>
            Yes — 100% compliant.  
            No pay-for-play — athletes earn only after completing gigs.  
            Parent approval required for under 18.  
            We follow all state NIL rules and high school association guidelines.
          </p>
        </div>

        {/* Parent Approval */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Do parents have to approve every payout?
          </h2>
          <p>
            Yes for under 18 — safety first.  
            Parent approves clip → payout auto.  
            For 18+ athletes — direct to debit card (no parent step).
          </p>
        </div>

        {/* Video Proof & Moderation */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Who reviews the video proof if there's a dispute?
          </h2>
          <p>
            Parent/business approves — they funded it, they decide.  
            No central moderation needed — keeps it simple and fast.  
            If issue — contact support.
          </p>
        </div>

        {/* Parent-to-Friend Invite Success */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            How many parents actually invite a teammate after the first payout?
          </h2>
          <p>
            Early beta: 60–70% do it the same day.  
            They just saw it work — magic moment.  
            "My kid earned $50 — want to do it for yours?"
          </p>
        </div>

        {/* Monetization Clarity */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            How does LocalHustle make money?
          </h2>
          <p>
            Business pays $115 for $100 gig — we take 15%.  
            Athlete gets full advertised amount.  Fee covers all transaction fees, platform fees and bonuses for challenges and platform incentives.
            Transparent — shown on gig creation.
          </p>
        </div>

        {/* Long-Term Motivation */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            What keeps kids active after qualifying for brand deals?
          </h2>
          <p>
            Real money + fun challenges.  
            Squad bonuses, booster events, ongoing local gigs.  
            Plus — bigger gigs from favorite businesses.
          </p>
        </div>

        {/* Booster Donation Perks */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Do businesses get anything for booster donations?
          </h2>
          <p>
            Yes — thank-you clips from team, social shoutouts.  
            Not required — but most love the goodwill.
          </p>
        </div>

        {/* Equity for Lower-Income */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            What if parent can't front the first $50?
          </h2>
          <p>
            Kid pitches real business (local pizza, gym).  
            Or — community/business seeds first gig.  
            Goal: no kid left out.
          </p>
        </div>

        {/* Burnout Risk */}
        <div className="p-8 bg-gray-100 border-4 border-black">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Does this cause burnout?
          </h2>
          <p>
            No — challenges are fun, kid-chosen.  
            No quotas.  
            Parents set reasonable goals.  
            It's earned reward — not pressure.
          </p>
        </div>
      </div>
    </div>
  )
}