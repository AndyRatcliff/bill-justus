'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Globe from './Globe'
import PanelLeaderboard from './PanelLeaderboard'
import PanelRecommend from './PanelRecommend'
import PanelSignup from './PanelSignup'
import { apiUrl } from '@/lib/base-path'

const TABS = [
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'recommend', label: 'Recommend / vote' },
  { id: 'signup', label: 'Artist signup' },
]

export default function HomeExperience() {
  const [tab, setTab] = useState('leaderboard')
  const [markers, setMarkers] = useState([])
  const globeRef = useRef(null)

  const reloadMarkers = useCallback(() => {
    fetch(apiUrl('/api/markers.php'))
      .then((r) => r.json())
      .then((data) => {
        const rows = data.markers || []
        setMarkers(
          rows.map((m) => ({
            id: m.id,
            kind: m.kind,
            lat: Number(m.lat),
            lon: Number(m.lon),
            artist_id: m.artist_id,
            artist_name: m.artist_name,
            artist_links: m.artist_links,
          })),
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    reloadMarkers()
  }, [reloadMarkers])

  function hoverArtist(id) {
    globeRef.current?.setHighlight(id)
  }

  function onPanelDone(nextTab) {
    reloadMarkers()
    if (nextTab) setTab(nextTab)
  }

  return (
    <div className="home-shell">
      <div className="home-stage">
        <div className="home-globe">
          <Globe ref={globeRef} markers={markers} />
          <p className="status home-status">
            artists + country conversations underway
          </p>
        </div>

        <aside className="side-panel" aria-label="Artist actions">
          <div className="side-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? 'active' : undefined}
                onClick={() => {
                  setTab(t.id)
                  hoverArtist(null)
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="side-panel-scroll" role="tabpanel">
            {tab === 'leaderboard' ? (
              <PanelLeaderboard onHoverArtist={hoverArtist} />
            ) : null}
            {tab === 'recommend' ? (
              <PanelRecommend
                onHoverArtist={hoverArtist}
                onDone={onPanelDone}
              />
            ) : null}
            {tab === 'signup' ? <PanelSignup onDone={onPanelDone} /> : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
