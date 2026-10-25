/**
 * API paths:
 * - Local next dev: same-origin /api/*.php (proxied to live host)
 * - Deployed: NEXT_PUBLIC_API_BASE + path, or {BASE_PATH}/api/*.php
 */
export function apiUrl(path) {
  const clean = path.startsWith('/') ? path : `/${path}`
  const isLocal =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)

  if (isLocal) return clean

  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '')
  if (apiBase) return `${apiBase}${clean}`

  const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
  return `${base}${clean}`
}
