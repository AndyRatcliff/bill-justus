'use client'

import { useEffect, useState } from 'react'
import RecommendForm from './RecommendForm'
import { apiUrl } from '@/lib/base-path'

export default function RecommendPageClient() {
  const [proposed, setProposed] = useState([])

  useEffect(() => {
    fetch(apiUrl('/api/artists.php?status=proposed'))
      .then((r) => r.json())
      .then((data) => setProposed(data.artists || []))
      .catch(() => {})
  }, [])

  return (
    <main className="page page-narrow">
      <header className="page-header">
        <h1>Recommend & vote</h1>
        <p className="lede">
          Put an artist forward, or back someone already on the board. Votes
          shape visibility; veterans lock the lineup.
        </p>
      </header>
      <RecommendForm proposed={proposed} />
    </main>
  )
}
