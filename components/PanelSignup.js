'use client'

import { useState } from 'react'
import { apiUrl } from '@/lib/base-path'

export default function PanelSignup({ onDone }) {
  const [status, setStatus] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setStatus({ type: '', text: '' })
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())
    try {
      const res = await fetch(apiUrl('/api/signup.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', text: data.error || 'Signup failed' })
        return
      }
      setStatus({
        type: 'ok',
        text: 'You are on the proposal board.',
      })
      e.currentTarget.reset()
      onDone?.('leaderboard')
    } catch {
      setStatus({ type: 'error', text: 'Network error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel-body">
      <p className="panel-lede">
        Nominate yourself for JUST US. Final acts are confirmed by industry
        veterans.
      </p>
      <form className="orb-form compact" onSubmit={onSubmit}>
        <label>
          Artist / act name *
          <input name="name" required minLength={2} maxLength={120} />
        </label>
        <label>
          Email (private)
          <input name="email" type="email" maxLength={200} />
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
          Bio
          <textarea name="bio" rows={3} maxLength={1000} />
        </label>
        <label>
          Website
          <input name="website" type="url" placeholder="https://" />
        </label>
        <label>
          Spotify
          <input name="spotify" type="url" placeholder="https://" />
        </label>
        <label>
          Instagram
          <input name="instagram" placeholder="@handle or URL" />
        </label>
        <input className="hp" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Submitting…' : 'Join the proposal board'}
        </button>
        {status.text ? (
          <p className={`form-status ${status.type}`}>{status.text}</p>
        ) : null}
      </form>
    </div>
  )
}
