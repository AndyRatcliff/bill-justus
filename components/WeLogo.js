export default function WeLogo({ className = '' }) {
  return (
    <svg
      className={`we-logo ${className}`.trim()}
      viewBox="0 0 11 5"
      role="img"
      aria-label="WE"
    >
      {/* W — three stems + bottom joins */}
      <rect x="0" y="0" width="1" height="5" />
      <rect x="2" y="0" width="1" height="5" />
      <rect x="4" y="0" width="1" height="5" />
      <rect x="1" y="4" width="1" height="1" />
      <rect x="3" y="4" width="1" height="1" />
      {/* E — three horizontal bars */}
      <rect x="6" y="0" width="4" height="1" />
      <rect x="6" y="2" width="4" height="1" />
      <rect x="6" y="4" width="4" height="1" />
    </svg>
  )
}
