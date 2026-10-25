import { createHash, randomUUID } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'orb_voter'

function hashVoter(raw) {
  const secret = process.env.VOTE_COOKIE_SECRET || 'dev-secret'
  return createHash('sha256').update(`${raw}:${secret}`).digest('hex')
}

export async function getOrCreateVoterKey() {
  const jar = await cookies()
  let id = jar.get(COOKIE_NAME)?.value
  let created = false
  if (!id) {
    id = randomUUID()
    created = true
  }
  return { voterKey: hashVoter(id), cookieValue: id, created }
}

export function setVoterCookie(response, cookieValue) {
  response.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
