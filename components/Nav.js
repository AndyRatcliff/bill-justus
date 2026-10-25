'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'

export default function Nav() {
  const pathname = usePathname()
  const onHome = pathname === '/' || pathname === ''

  return (
    <header className="site-chrome">
      <nav className="site-nav-bar" aria-label="Primary">
        <a href="https://orb.me/" className="nav-brand">
          ORB
        </a>
        <ul>
          <li>
            <Link href="/" className={onHome ? 'active' : undefined}>
              Concert
            </Link>
          </li>
          <li>
            <Link href="/admin">Staff</Link>
          </li>
        </ul>
      </nav>

      {onHome ? (
        <div className="site-banner">
          <Logo compact />
          <p className="tagline">Global Concert for World Peace</p>
          <p className="hero-sub site-banner-sub">
            WebXR musician orbs · New Year’s Eve global concert · community
            proposals, veteran-confirmed lineup
          </p>
        </div>
      ) : null}
    </header>
  )
}
