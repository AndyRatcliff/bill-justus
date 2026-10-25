'use client'

import { useState } from 'react'
import { apiUrl } from '@/lib/base-path'

export default function AdminPanel() {
  const [key, setKey] = useState('')
  const [artists, setArtists] = useState([])
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setError('')
    const res = await fetch(
      apiUrl(`/api/admin.php?key=${encodeURIComponent(key)}`),
    )
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Unauthorized')
      setLoaded(false)
      return
    }
    setArtists(data.artists)
    setLoaded(true)
  }

  async function act(id, action) {
    setBusyId(id)
    setError('')
    try {
      const res = await fetch(apiUrl('/api/admin.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, action, id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-panel">
      <label>
        Admin key
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
        />
      </label>
      <button type="button" className="btn btn-primary" onClick={load}>
        Unlock
      </button>
      {error ? <p className="form-status error">{error}</p> : null}

      {loaded ? (
        <ul className="board-list admin-list">
          {artists.map((a) => (
            <li key={a.id} className="board-row">
              <div className="board-meta">
                <strong>
                  {a.name}{' '}
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </strong>
                <span>
                  {a.votes} votes · {a.source}
                  {a.country ? ` · ${a.country}` : ''}
                  {a.email ? ` · ${a.email}` : ''}
                </span>
              </div>
              <div className="admin-actions">
                {a.status !== 'confirmed' ? (
                  <button
                    type="button"
                    className="btn btn-vote"
                    disabled={busyId === a.id}
                    onClick={() => act(a.id, 'confirm')}
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    disabled={busyId === a.id}
                    onClick={() => act(a.id, 'unconfirm')}
                  >
                    Unconfirm
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busyId === a.id}
                  onClick={() => act(a.id, 'hide')}
                >
                  Hide
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
