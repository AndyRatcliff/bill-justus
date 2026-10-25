'use client'

import { useEffect, useState } from 'react'
import VoteButton from './VoteButton'
import { apiUrl } from '@/lib/base-path'

export default function PanelLeaderboard({ onHoverArtist }) {
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
        if (p.error || c.error) setError(p.error || c.error)
        else {
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

  function hover(id) {
    onHoverArtist?.(id || null)
  }

  return (
    <div className="panel-body">
      <p className="panel-lede">
        Votes inform the lineup. Industry veterans confirm performers.
      </p>
      {loading ? <p className="empty">Loading…</p> : null}
      {error ? <p className="form-status error">{error}</p> : null}

      <h3 className="panel-subhead">Confirmed</h3>
      {!loading && confirmed.length === 0 ? (
        <p className="empty">None yet.</p>
      ) : (
        <ul className="board-list compact">
          {confirmed.map((a) => (
            <li
              key={a.id}
              className="board-row"
              onMouseEnter={() => hover(a.id)}
              onMouseLeave={() => hover(null)}
            >
              <span className="rank">★</span>
              <div className="board-meta">
                <strong>{a.name}</strong>
                <span>{[a.country, a.genre].filter(Boolean).join(' · ') || '—'}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="panel-subhead">Proposals</h3>
      {!loading && proposed.length === 0 ? (
        <p className="empty">No proposals yet.</p>
      ) : (
        <ul className="board-list compact">
          {proposed.map((a, i) => (
            <li
              key={a.id}
              className="board-row"
              onMouseEnter={() => hover(a.id)}
              onMouseLeave={() => hover(null)}
            >
              <span className="rank">#{i + 1}</span>
              <div className="board-meta">
                <strong>{a.name}</strong>
                <span>
                  {[a.country, a.genre].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>
              <VoteButton artistId={a.id} initialVotes={a.votes} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
