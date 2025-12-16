export default function Privacy() {
  return (
    <div className="container py-32 font-mono text-center">
      <h1 className="text-5xl mb-12 font-bold">Privacy Policy</h1>

      <div className="max-w-3xl mx-auto text-left space-y-8 text-lg">
        <p>Last updated: December 2025</p>

        <p>LocalHustle ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>

        <h2 className="text-3xl mb-4 font-bold">Information We Collect</h2>
        <p>We collect:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Email address (for login and communication)</li>
          <li>Profile information (school, sport, parent email if minor)</li>
          <li>Video clips uploaded for gigs (private, not public)</li>
          <li>Payment information (handled by Stripe — we do not store card details)</li>
        </ul>

        <h2 className="text-3xl mb-4 font-bold">How We Use Information</h2>
        <p>To:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>Enable login and account management</li>
          <li>Facilitate gigs and payouts</li>
          <li>Send parent approvals and notifications</li>
          <li>Improve the platform</li>
        </ul>

        <h2 className="text-3xl mb-4 font-bold">Data Protection</h2>
        <p>We use Supabase and Stripe — both industry-leading secure providers. Videos are private — only visible to the business and you.</p>

        <h2 className="text-3xl mb-4 font-bold">Your Rights</h2>
        <p>You can request deletion of your data at any time by emailing support@localhustle.org.</p>

        <p className="mt-12">
          Questions? Email <a href="mailto:support@localhustle.org" className="underline">support@localhustle.org</a>
        </p>
      </div>
    </div>
  )
}