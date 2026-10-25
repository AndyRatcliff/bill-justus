/** Approximate country centroids for fallback when IP geo fails (e.g. localhost). */
const COUNTRY_CENTROIDS = {
  nigeria: [9.08, 8.68],
  japan: [36.2, 138.25],
  mexico: [23.63, -102.55],
  ireland: [53.14, -7.69],
  ghana: [7.95, -1.02],
  sweden: [60.13, 18.64],
  'united states': [39.83, -98.58],
  usa: [39.83, -98.58],
  uk: [54.0, -2.0],
  'united kingdom': [54.0, -2.0],
  france: [46.23, 2.21],
  germany: [51.17, 10.45],
  brazil: [-14.24, -51.93],
  india: [20.59, 78.96],
  australia: [-25.27, 133.78],
  canada: [56.13, -106.35],
  'south africa': [-30.56, 22.94],
  kenya: [-0.02, 37.91],
  spain: [40.46, -3.75],
  italy: [41.87, 12.57],
  netherlands: [52.13, 5.29],
  poland: [51.92, 19.15],
  argentina: [-38.42, -63.62],
  chile: [-35.68, -71.54],
  colombia: [4.57, -74.3],
  egypt: [26.82, 30.8],
  morocco: [31.79, -7.09],
  turkey: [38.96, 35.24],
  'south korea': [35.91, 127.77],
  korea: [35.91, 127.77],
  china: [35.86, 104.2],
  indonesia: [-0.79, 113.92],
  philippines: [12.88, 121.77],
  portugal: [39.4, -8.22],
  norway: [60.47, 8.47],
  denmark: [56.26, 9.5],
  finland: [61.92, 25.75],
  belgium: [50.5, 4.47],
  austria: [47.52, 14.55],
  switzerland: [46.82, 8.23],
  'new zealand': [-40.9, 174.89],
  jamaica: [18.11, -77.3],
  senegal: [14.5, -14.45],
}

function isPrivateIp(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') return true
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true
  return false
}

function jitter(lat, lon, amount = 1.2) {
  return {
    lat: lat + (Math.random() - 0.5) * amount,
    lon: lon + (Math.random() - 0.5) * amount,
  }
}

export function centroidForCountry(country) {
  if (!country) return null
  const key = String(country).trim().toLowerCase()
  const pair = COUNTRY_CENTROIDS[key]
  if (!pair) return null
  const j = jitter(pair[0], pair[1], 2.5)
  return { lat: j.lat, lon: j.lon, countryCode: key.slice(0, 2).toUpperCase() }
}

/** Resolve approx lat/lon from IP. Never stores the raw IP. */
export async function geoFromIp(ip) {
  if (isPrivateIp(ip)) return null
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,lat,lon,countryCode`
    const res = await fetch(url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(2500) })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success' || typeof data.lat !== 'number') return null
    const j = jitter(data.lat, data.lon, 0.8)
    return {
      lat: j.lat,
      lon: j.lon,
      countryCode: data.countryCode || null,
    }
  } catch {
    return null
  }
}

export async function resolveLocation({ ip, country }) {
  const fromIp = await geoFromIp(ip)
  if (fromIp) return fromIp
  return centroidForCountry(country)
}
