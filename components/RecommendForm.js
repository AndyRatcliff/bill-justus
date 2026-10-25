'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VoteButton from './VoteButton'
import { apiUrl } from '@/lib/base-path'

export default function RecommendForm({ proposed = [] }) {
  const router = useRouter()
  const [status, setStatus] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

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
      setStatus({ type: 'ok', text: 'Recommendation added to the leaderboard.' })
      e.currentTarget.reset()
      setTimeout(() => router.push('/leaderboard'), 1000)
    } catch {
      setStatus({ type: 'error', text: 'Network error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="recommend-layout">
      <section>
        <h2>Recommend a new artist</h2>
        <p className="lede">
          Suggest someone for JUST US. Votes guide attention; industry veterans
          confirm the final lineup.
        </p>
        <form className="orb-form" onSubmit={onSubmit}>
          <label>
            Artist / act name *
            <input name="name" required minLength={2} maxLength={120} />
          </label>
          <label>
            Your name (optional)
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
            <textarea name="note" rows={3} maxLength={500} />
          </label>
          <label>
            Link
            <input name="website" type="url" placeholder="https://" />
          </label>
          <input
            className="hp"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Sending…' : 'Submit recommendation'}
          </button>
          {status.text ? (
            <p className={`form-status ${status.type}`}>{status.text}</p>
          ) : null}
        </form>
      </section>

      <section>
        <h2>Vote for an existing proposal</h2>
        <p className="lede">One vote per artist from your browser.</p>
        {proposed.length === 0 ? (
          <p className="empty">No proposals yet — be the first to recommend someone.</p>
        ) : (
          <ul className="board-list">
            {proposed.slice(0, 25).map((a, i) => (
              <li key={a.id} className="board-row">
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
      </section>
    </div>
  )
}
