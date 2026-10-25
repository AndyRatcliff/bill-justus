const LOGO_SRC = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/just-us-logo-v2.png`

export default function Logo({ compact = false }) {
  return (
    <h1 className={compact ? 'logo logo-compact' : 'logo'} aria-label="JUST US">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="logo-img"
        src={LOGO_SRC}
        alt="JUST US"
        width={524}
        height={131}
        decoding="async"
      />
    </h1>
  )
}
