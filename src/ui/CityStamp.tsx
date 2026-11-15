import { useId } from 'react'
import { cx } from './cx'

type CityStampProps = {
  city: 'la' | 'ny'
  size?: number
  className?: string
}

// Perforated edge: small paper-colored bites around the rim
const bites = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2
  return { x: 50 + Math.cos(a) * 49, y: 50 + Math.sin(a) * 49 }
})

// A round city sticker (IA v2): LA is a blue-to-pink sunset with a palm, New
// York is yellow with a taxi checker band. Relay's city button, the Moving
// card and the Your move header use it. Colors come from the brand tokens.
export function CityStamp({ city, size = 56, className }: CityStampProps) {
  const id = useId()
  const clip = `${id}-clip`
  const sky = `${id}-sky`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cx('shrink-0 drop-shadow-md', className)} aria-label={city === 'la' ? 'Los Angeles' : 'New York'} role="img">
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="40" />
        </clipPath>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-baton-blue)" />
          <stop offset="0.7" stopColor="var(--color-baton-pink)" />
        </linearGradient>
      </defs>
      {/* Stamp paper with a perforated edge */}
      <circle cx="50" cy="50" r="49" fill="var(--color-baton-cream)" />
      {bites.map((bite, i) => (
        <circle key={i} cx={bite.x} cy={bite.y} r="2.6" fill="var(--color-baton-paper)" />
      ))}
      <g clipPath={`url(#${clip})`}>
        {city === 'la' ? (
          <>
            <rect width="100" height="100" fill={`url(#${sky})`} />
            <circle cx="50" cy="66" r="16" fill="var(--color-baton-yellow)" />
            <rect y="66" width="100" height="34" fill="var(--color-baton-navy)" />
            <rect y="66" width="100" height="2" fill="var(--color-baton-pink)" opacity="0.7" />
            {/* Palm: a leaning trunk and a fan of fronds */}
            <path d="M66 68 C66 55 64 42 61 32" stroke="var(--color-baton-navy)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <g fill="var(--color-baton-navy)">
              <path d="M61 32 C53 26 44 28 40 33 C47 30 54 31 61 32Z" />
              <path d="M61 32 C55 22 47 20 42 22 C49 23 55 27 61 32Z" />
              <path d="M61 32 C64 22 71 18 77 20 C70 22 65 26 61 32Z" />
              <path d="M61 32 C69 27 78 29 82 35 C75 32 68 31 61 32Z" />
              <path d="M61 32 C61 24 58 18 55 15 C58 21 59 26 61 32Z" />
            </g>
            <text x="50" y="86" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--color-baton-cream)" fontFamily="var(--font-display)">LA</text>
          </>
        ) : (
          <>
            <rect width="100" height="100" fill="var(--color-baton-yellow)" />
            {/* Taxi checker band */}
            {Array.from({ length: 14 }, (_, i) => (
              <g key={i}>
                <rect x={i * 7.5} y="56" width="7.5" height="7.5" fill={i % 2 ? 'var(--color-baton-cream)' : 'var(--color-baton-navy)'} />
                <rect x={i * 7.5} y="63.5" width="7.5" height="7.5" fill={i % 2 ? 'var(--color-baton-navy)' : 'var(--color-baton-cream)'} />
              </g>
            ))}
            <text x="50" y="47" textAnchor="middle" fontSize="26" fontWeight="600" fill="var(--color-baton-navy)" fontFamily="var(--font-display)">NY</text>
            <circle cx="50" cy="84" r="3" fill="var(--color-baton-navy)" />
          </>
        )}
      </g>
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-baton-cream)" strokeWidth="1.5" />
    </svg>
  )
}
