'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { createGlobe } from '@/lib/globe'

const Globe = forwardRef(function Globe({ markers = [] }, ref) {
  const canvasRef = useRef(null)
  const sectionRef = useRef(null)
  const apiRef = useRef(null)

  useImperativeHandle(ref, () => ({
    setHighlight(artistId) {
      apiRef.current?.setHighlight(artistId)
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    let globe
    try {
      globe = createGlobe(canvas, {
        markers,
        labelHost: sectionRef.current,
      })
      apiRef.current = globe
    } catch (err) {
      console.warn('Globe failed to start', err)
      return undefined
    }
    return () => {
      apiRef.current = null
      globe?.destroy()
    }
  }, [markers])

  return (
    <div className="globe-wrap">
      <section
        ref={sectionRef}
        className="globe-section"
        aria-label="Interactive globe"
      >
        <canvas id="globe-canvas" ref={canvasRef} />
      </section>
      <ul className="marker-legend" aria-label="Map legend">
        <li>
          <span className="swatch band" aria-hidden="true" /> Artists
        </li>
        <li>
          <span className="swatch proposer" aria-hidden="true" /> Proposers
        </li>
        <li>
          <span className="swatch voter" aria-hidden="true" /> Voters
        </li>
      </ul>
    </div>
  )
})

export default Globe
