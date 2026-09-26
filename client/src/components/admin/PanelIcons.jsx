// CONTROL_PANEL.EXE icons: 48×48, 2.5px ink outlines, flat token fills (same hand as the houses and faces).
const INK = { stroke: 'var(--ink)', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' }

function Svg({ children }) {
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

// A shelter house with a mint rosette and a tick
export function VerifyIcon() {
  return (
    <Svg>
      <path d="M11 20 V39 H33 V20" fill="var(--cream)" {...INK} />
      <path d="M6 23 L22 8 L38 23 L35 26 L22 14 L9 26 Z" fill="var(--lav)" {...INK} />
      <rect x="17" y="27" width="9" height="12" rx="2" fill="var(--pink-soft)" {...INK} />
      <path d="M31 41 L29 47 L33 45 L36 47 L35 41" fill="var(--pink)" {...INK} />
      <circle cx="34" cy="34" r="9" fill="var(--mint)" {...INK} />
      <path d="M29.5 34 L33 37.5 L39 30.5" fill="none" {...INK} strokeWidth={3} />
    </Svg>
  )
}

// A speech bubble with a pixel-ish star
export function ReviewsIcon() {
  return (
    <Svg>
      <path
        d="M8 8 H40 Q43 8 43 11 V31 Q43 34 40 34 H22 L13 42 L15 34 H8 Q5 34 5 31 V11 Q5 8 8 8 Z"
        fill="var(--pink-soft)"
        {...INK}
      />
      <path
        d="M24 11.5 L27 17.8 L33.8 18.6 L28.8 23.2 L30.1 30 L24 26.6 L17.9 30 L19.2 23.2 L14.2 18.6 L21 17.8 Z"
        fill="var(--sun)"
        {...INK}
      />
    </Svg>
  )
}

// A clipboard with a paw print and two lines
export function ListingsIcon() {
  return (
    <Svg>
      <rect x="9" y="7" width="30" height="37" rx="4" fill="var(--mint-soft)" {...INK} />
      <rect x="17" y="4" width="14" height="7" rx="2" fill="var(--sun)" {...INK} />
      <ellipse cx="24" cy="23.5" rx="5" ry="4.2" fill="var(--pink)" {...INK} />
      <circle cx="17.5" cy="17.5" r="2.4" fill="var(--pink)" {...INK} strokeWidth={2} />
      <circle cx="22" cy="14.5" r="2.4" fill="var(--pink)" {...INK} strokeWidth={2} />
      <circle cx="26.5" cy="14.5" r="2.4" fill="var(--pink)" {...INK} strokeWidth={2} />
      <circle cx="31" cy="17.5" r="2.4" fill="var(--pink)" {...INK} strokeWidth={2} />
      <path d="M15 33 H33 M15 38.5 H27" fill="none" {...INK} />
    </Svg>
  )
}
