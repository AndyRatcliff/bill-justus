import SignupForm from '@/components/SignupForm'

export const metadata = { title: 'Artist sign up' }

export default function ArtistSignupPage() {
  return (
    <main className="page page-narrow">
      <header className="page-header">
        <h1>Artist sign up</h1>
        <p className="lede">
          Nominate yourself for JUST US and the ORB system. You will appear on
          the community proposal board. Final performers are confirmed by
          industry veterans.
        </p>
      </header>
      <SignupForm />
    </main>
  )
}
