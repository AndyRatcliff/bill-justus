'use client'

import { useEffect, useState } from 'react'
import VoteButton from './VoteButton'
import { apiUrl } from '@/lib/base-path'

export default function PanelRecommend({ onHoverArtist, onDone }) {
  const [proposed, setProposed] = useState([])
  const [status, setStatus] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  function reload() {
    fetch(apiUrl('/api/artists.php?status=proposed'))
      .then((r) => r.json())
      .then((data) => setProposed(data.artists || []))
      .catch(() => {})
  }

  useEffect(() => {
    reload()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setStatus({ type: '', text: '' })
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())
    try {
      const res = await fetch(apiUrl('/api/recommend.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', text: data.error || 'Failed' })
        return
      }
      setStatus({ type: 'ok', text: 'Recommendation added.' })
      e.currentTarget.reset()
      reload()
      onDone?.('leaderboard')
    } catch {
      setStatus({ type: 'error', text: 'Network error' })
    } finally {
      setBusy(false)
    }
  }

  function hover(id) {
    onHoverArtist?.(id || null)
  }

  return (
    <div className="panel-body">
      <form className="orb-form compact" onSubmit={onSubmit}>
        <label>
          Artist / act name *
          <input name="name" required minLength={2} maxLength={120} />
        </label>
        <label>
          Your name
          <input name="recommenderName" maxLength={80} />
        </label>
        <div className="form-row">
          <label>
            Country
            <input name="country" maxLength={80} />
          </label>
          <label>
            Genre
            <input name="genre" maxLength={80} />
          </label>
        </div>
        <label>
          Why them?
          <textarea name="note" rows={2} maxLength={500} />
        </label>
        <label>
          Link
          <input name="website" type="url" placeholder="https://" />
        </label>
        <input className="hp" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Sending…' : 'Submit recommendation'}
        </button>
        {status.text ? (
          <p className={`form-status ${status.type}`}>{status.text}</p>
        ) : null}
      </form>

      <h3 className="panel-subhead">Vote existing</h3>
      <ul className="board-list compact">
        {proposed.slice(0, 20).map((a, i) => (
          <li
            key={a.id}
            className="board-row"
            onMouseEnter={() => hover(a.id)}
            onMouseLeave={() => hover(null)}
          >
            <span className="rank">#{i + 1}</span>
            <div className="board-meta">
              <strong>{a.name}</strong>
              <span>{[a.country, a.genre].filter(Boolean).join(' · ') || '—'}</span>
            </div>
            <VoteButton artistId={a.id} initialVotes={a.votes} />
          </li>
        ))}
      </ul>
    </div>
  )
}
