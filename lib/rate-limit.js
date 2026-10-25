/** Simple in-memory IP rate limiter (single-process MVP). */
const buckets = new Map()

export function rateLimit(key, { limit = 20, windowMs = 60 * 60 * 1000 } = {}) {
  const now = Date.now()
  let entry = buckets.get(key)
  if (!entry || now - entry.startedAt > windowMs) {
    entry = { startedAt: now, count: 0 }
    buckets.set(key, entry)
  }
  entry.count += 1
  if (entry.count > limit) {
    return { ok: false, remaining: 0 }
  }
  return { ok: true, remaining: limit - entry.count }
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
