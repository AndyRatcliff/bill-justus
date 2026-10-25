/** Prefer website, then Spotify, then Instagram from the performer form. */
export function pickSocialUrl(links) {
  if (!links) return null
  let data = links
  if (typeof links === 'string') {
    try {
      data = JSON.parse(links)
    } catch {
      return null
    }
  }
  const candidates = [data.website, data.spotify, data.instagram].filter(Boolean)
  for (const raw of candidates) {
    const value = String(raw).trim()
    if (!value) continue
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    if (value.startsWith('@')) {
      return `https://instagram.com/${encodeURIComponent(value.slice(1))}`
    }
    if (value.includes('instagram.com') || value.includes('spotify.com')) {
      return value.startsWith('http') ? value : `https://${value}`
    }
    return `https://${value}`
  }
  return null
}
