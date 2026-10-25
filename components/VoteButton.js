'use client'

import { useState } from 'react'
import { apiUrl } from '@/lib/base-path'

export default function VoteButton({ artistId, initialVotes = 0 }) {
  const [votes, setVotes] = useState(initialVotes)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function vote() {
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch(apiUrl('/api/vote.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Vote failed')
        return
      }
      setVotes(data.votes)
      setMessage('Voted')
    } catch {
      setMessage('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="vote-control">
      <span className="vote-count">{votes}</span>
      <button type="button" className="btn btn-vote" onClick={vote} disabled={busy}>
        {busy ? '…' : 'Vote'}
      </button>
      {message ? <span className="vote-msg">{message}</span> : null}
    </div>
  )
}
