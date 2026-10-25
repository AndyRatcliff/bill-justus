'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import VoteButton from './VoteButton'
import { apiUrl } from '@/lib/base-path'

export default function LeaderboardClient() {
  const [proposed, setProposed] = useState([])
  const [confirmed, setConfirmed] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [p, c] = await Promise.all([
          fetch(apiUrl('/api/artists.php?status=proposed')).then((r) => r.json()),
          fetch(apiUrl('/api/artists.php?status=confirmed')).then((r) => r.json()),
        ])
        if (cancelled) return
        if (p.error || c.error) {
          setError(p.error || c.error)
        } else {
          setProposed(p.artists || [])
          setConfirmed(c.artists || [])
        }
      } catch {
        if (!cancelled) setError('Could not load the leaderboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page page-narrow">
      <header className="page-header">
        <h1>Leaderboard</h1>
        <p className="lede">
          Community proposals ranked by votes. Confirmed performers are selected
          by industry veterans — not by the vote tally alone.
        </p>
        <p className="note">
          <Link href="/recommend">Recommend or vote</Link>
          {' · '}
          <Link href="/artists/signup">Artist sign up</Link>
        </p>
      </header>

      {loading ? <p className="empty">Loading…</p> : null}
      {error ? <p className="form-status error">{error}</p> : null}

      <section className="board-section">
        <h2>Confirmed for JUST US</h2>
        {!loading && confirmed.length === 0 ? (
          <p className="empty">No confirmed performers yet.</p>
        ) : (
          <ul className="board-list">
            {confirmed.map((a) => (
              <li key={a.id} className="board-row">
                <span className="rank">★</span>
                <div className="board-meta">
                  <strong>{a.name}</strong>
                  <span>
                    {[a.country, a.genre].filter(Boolean).join(' · ') ||
                      'Confirmed act'}
                  </span>
                </div>
                <span className="badge badge-confirmed">Confirmed</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="board-section">
        <h2>Community proposals</h2>
        {!loading && proposed.length === 0 ? (
          <p className="empty">
            No proposals yet.{' '}
            <Link href="/recommend">Recommend the first artist</Link>.
          </p>
        ) : (
          <ul className="board-list">
            {proposed.map((a, i) => (
              <li key={a.id} className="board-row">
                <span className="rank">#{i + 1}</span>
                <div className="board-meta">
                  <strong>{a.name}</strong>
                  <span>
                    {[a.country, a.genre].filter(Boolean).join(' · ') || '—'}
                    {a.source === 'self' ? ' · self-nominated' : ''}
                  </span>
                </div>
                <VoteButton artistId={a.id} initialVotes={a.votes} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
