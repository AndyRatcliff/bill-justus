import { getSql } from './db'

export async function listArtists(status) {
  const sql = getSql()
  if (status === 'confirmed') {
    return sql`
      SELECT a.id, a.name, a.country, a.genre, a.bio, a.links, a.source, a.status,
             a.created_at, a.confirmed_at,
             COALESCE(COUNT(v.id), 0)::int AS votes
      FROM artists a
      LEFT JOIN votes v ON v.artist_id = a.id
      WHERE a.status = 'confirmed'
      GROUP BY a.id
      ORDER BY a.confirmed_at DESC NULLS LAST, a.name ASC
    `
  }

  return sql`
    SELECT a.id, a.name, a.country, a.genre, a.bio, a.links, a.source, a.status,
           a.created_at, a.confirmed_at,
           COALESCE(COUNT(v.id), 0)::int AS votes
    FROM artists a
    LEFT JOIN votes v ON v.artist_id = a.id
    WHERE a.status = 'proposed'
    GROUP BY a.id
    ORDER BY votes DESC, a.created_at ASC
  `
}

export async function listAllForAdmin() {
  const sql = getSql()
  return sql`
    SELECT a.id, a.name, a.country, a.genre, a.email, a.source, a.status,
           a.created_at, a.confirmed_at,
           COALESCE(COUNT(v.id), 0)::int AS votes
    FROM artists a
    LEFT JOIN votes v ON v.artist_id = a.id
    WHERE a.status != 'hidden'
    GROUP BY a.id
    ORDER BY a.status ASC, votes DESC, a.created_at ASC
  `
}
