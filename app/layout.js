import { Outfit, Syne } from 'next/font/google'
import Nav from '@/components/Nav'
import WeLogo from '@/components/WeLogo'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'JUST US — Global Concert for World Peace',
    template: '%s · ORB',
  },
  description:
    'JUST US: New Year’s Eve global concerts and downloadable WebXR musician orbs. Propose artists, vote, and follow confirmed performers.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable}`}>
      <body
        style={{
          ['--font-body']: 'var(--font-outfit), sans-serif',
          ['--font-display']: 'var(--font-syne), sans-serif',
        }}
      >
        <div className="starfield" aria-hidden="true" />
        <Nav />
        {children}
        <footer className="footer">
          <a
            className="powered-by"
            href="https://orb.me/we/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by <WeLogo />
          </a>
        </footer>
      </body>
    </html>
  )
}
