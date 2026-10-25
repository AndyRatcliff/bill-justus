import AdminPanel from '@/components/AdminPanel'

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <main className="page page-narrow">
      <header className="page-header">
        <h1>Staff confirm</h1>
        <p className="lede">
          Industry veterans and staff confirm performers with the shared admin
          key. Confirmed acts appear on the public leaderboard separately from
          proposals.
        </p>
      </header>
      <AdminPanel />
    </main>
  )
}
