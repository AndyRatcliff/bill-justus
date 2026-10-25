import { getSql } from './db'
import { resolveLocation } from './geo'

export async function recordMarker({ kind, ip, country, artistId = null }) {
  const loc = await resolveLocation({ ip, country })
  if (!loc) return null

  const sql = getSql()
  const rows = await sql`
    INSERT INTO geo_markers (kind, lat, lon, country_code, artist_id)
    VALUES (
      ${kind},
      ${loc.lat},
      ${loc.lon},
      ${loc.countryCode || null},
      ${artistId}
    )
    RETURNING id, kind, lat, lon
  `
  return rows[0] || null
}

export async function listMarkers(limit = 400) {
  const sql = getSql()
  return sql`
    SELECT
      m.id,
      m.kind,
      m.lat,
      m.lon,
      m.country_code,
      m.artist_id,
      m.created_at,
      a.name AS artist_name,
      a.links AS artist_links
    FROM geo_markers m
    LEFT JOIN artists a ON a.id = m.artist_id
    ORDER BY m.created_at DESC
    LIMIT ${limit}
  `
}

