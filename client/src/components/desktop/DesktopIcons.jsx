// Desktop icons: 48×48, 2.5px ink outlines, flat token fills (the same hand as PanelIcons, the houses and the faces).
const INK = { stroke: 'var(--ink)', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' }
const THIN = { ...INK, strokeWidth: 2 }

function Svg({ children }) {
  return (
    <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

function Paw({ x, y, fill = 'var(--pink)' }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="3" rx="4" ry="3.3" fill={fill} {...THIN} />
      <circle cx="-4.6" cy="-2.4" r="1.8" fill={fill} {...THIN} strokeWidth={1.6} />
      <circle cx="-1.5" cy="-5" r="1.8" fill={fill} {...THIN} strokeWidth={1.6} />
      <circle cx="1.9" cy="-5" r="1.8" fill={fill} {...THIN} strokeWidth={1.6} />
      <circle cx="4.9" cy="-2.4" r="1.8" fill={fill} {...THIN} strokeWidth={1.6} />
    </g>
  )
}

// ADOPT.EXE: a folded map with a path, a little doghouse and a pink pin
export function AdoptIcon() {
  return (
    <Svg>
      <path d="M5 12 L17 8 L31 12 L43 8 V37 L31 41 L17 37 L5 41 Z" fill="var(--mint-soft)" {...INK} />
      <path d="M17 8 V37 M31 12 V41" fill="none" {...THIN} />
      <path d="M8 34 Q14 28 21 31 T34 27" fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
      <path d="M22 24 V31 H30 V24" fill="var(--cream)" {...THIN} />
      <path d="M20 25 L26 19.5 L32 25" fill="#F4877F" {...THIN} />
      <path d="M36 25 C32 19 32 14 36 12 C40 14 40 19 36 25 Z" fill="var(--pink)" {...THIN} />
      <circle cx="36" cy="16.5" r="1.8" fill="var(--paper)" {...THIN} strokeWidth={1.4} />
    </Svg>
  )
}

// APPLICATIONS: a sun folder with a form sticking out
export function ApplicationsIcon() {
  return (
    <Svg>
      <rect x="12" y="6" width="24" height="26" rx="2" fill="var(--paper)" {...INK} />
      <path d="M17 13 H31 M17 18 H31 M17 23 H26" fill="none" {...THIN} />
      <path d="M5 17 H18 L21 20 H43 V40 Q43 42 41 42 H7 Q5 42 5 40 Z" fill="var(--sun)" {...INK} />
      <path d="M5 24 H43" fill="none" {...THIN} />
    </Svg>
  )
}

// PET_DIARY: a spiral notebook with a paw on the cover
export function DiaryIcon() {
  return (
    <Svg>
      <rect x="10" y="6" width="30" height="37" rx="3" fill="var(--mint)" {...INK} />
      <path d="M16 6 V43" fill="none" {...THIN} />
      <path d="M7 12 H13 M7 20 H13 M7 28 H13 M7 36 H13" fill="none" {...INK} />
      <rect x="21" y="11" width="14" height="6" rx="1.5" fill="var(--paper)" {...THIN} />
      <Paw x={28} y={30} fill="var(--pink-soft)" />
    </Svg>
  )
}

// MESSENGER: two speech bubbles
export function MessengerIcon() {
  return (
    <Svg>
      <path d="M7 7 H29 Q32 7 32 10 V23 Q32 26 29 26 H15 L9 31 L10 26 H7 Q4 26 4 23 V10 Q4 7 7 7 Z" fill="var(--lav)" {...INK} />
      <path d="M19 20 H41 Q44 20 44 23 V35 Q44 38 41 38 H38 L39 43 L33 38 H19 Q16 38 16 35 V23 Q16 20 19 20 Z" fill="var(--pink-soft)" {...INK} />
      <circle cx="24" cy="29" r="1.7" fill="var(--ink)" />
      <circle cx="30" cy="29" r="1.7" fill="var(--ink)" />
      <circle cx="36" cy="29" r="1.7" fill="var(--ink)" />
    </Svg>
  )
}

// FAVORITES: a pink folder with a heart
export function FavoritesIcon() {
  return (
    <Svg>
      <path d="M5 12 H18 L21 15 H43 V39 Q43 41 41 41 H7 Q5 41 5 39 Z" fill="var(--pink-soft)" {...INK} />
      <path d="M5 19 H43" fill="none" {...THIN} />
      <path d="M24 37 C15 31 13 27 15 24 C17 21 21 21 24 25 C27 21 31 21 33 24 C35 27 33 31 24 37 Z" fill="var(--pink)" {...INK} />
    </Svg>
  )
}

// MY_PETS: a doghouse with a paw over the door and a food bowl
export function MyPetsIcon() {
  return (
    <Svg>
      <path d="M9 22 V41 H35 V22" fill="var(--cream)" {...INK} />
      <path d="M4 25 L22 8 L40 25 L36.5 28 L22 15 L7.5 28 Z" fill="#F4877F" {...INK} />
      <path d="M16 41 V34 Q16 29 22 29 Q28 29 28 34 V41" fill="var(--ink-soft)" {...THIN} />
      <g transform="translate(22 21.5) scale(.62)">
        <Paw x={0} y={0} />
      </g>
      <path d="M32 37 H45 Q45 43 38.5 43 Q32 43 32 37 Z" fill="var(--lav)" {...THIN} />
    </Svg>
  )
}

// INBOX: an in-tray with a letter
export function InboxIcon() {
  return (
    <Svg>
      <rect x="11" y="6" width="26" height="20" rx="2" fill="var(--paper)" {...INK} />
      <path d="M11 8 L24 18 L37 8" fill="none" {...THIN} />
      <path d="M4 26 H15 L18 31 H30 L33 26 H44 V39 Q44 42 41 42 H7 Q4 42 4 39 Z" fill="var(--lav)" {...INK} />
    </Svg>
  )
}

// CHECKINS: a calendar page with a tick
export function CheckInsIcon() {
  return (
    <Svg>
      <rect x="6" y="9" width="36" height="33" rx="4" fill="var(--paper)" {...INK} />
      <path d="M6 13 Q6 9 10 9 H38 Q42 9 42 13 V18 H6 Z" fill="var(--sun)" {...INK} />
      <path d="M15 5 V12 M33 5 V12" fill="none" {...INK} />
      <circle cx="24" cy="30" r="8" fill="var(--mint)" {...INK} />
      <path d="M20 30 L23 33 L28.5 27" fill="none" {...INK} />
    </Svg>
  )
}

// MY_PROFILE: an ID card with a face and two lines
export function ProfileIcon() {
  return (
    <Svg>
      <rect x="4" y="10" width="40" height="29" rx="4" fill="var(--lav-soft)" {...INK} />
      <circle cx="16" cy="22" r="5" fill="var(--sun)" {...INK} />
      <path d="M8 34 Q8 28 16 28 Q24 28 24 34" fill="var(--pink)" {...INK} />
      <path d="M28 20 H39 M28 26 H36 M28 32 H38" fill="none" {...THIN} />
    </Svg>
  )
}

// CONTROL_PANEL: a little window with three sliders
export function ControlPanelIcon() {
  return (
    <Svg>
      <rect x="5" y="7" width="38" height="34" rx="4" fill="var(--paper)" {...INK} />
      <path d="M5 11 Q5 7 9 7 H39 Q43 7 43 11 V15 H5 Z" fill="var(--lav)" {...INK} />
      <path d="M12 22 H36 M12 29 H36 M12 36 H36" fill="none" {...THIN} />
      <rect x="15" y="19" width="6" height="6" rx="1.5" fill="var(--pink)" {...THIN} />
      <rect x="27" y="26" width="6" height="6" rx="1.5" fill="var(--mint)" {...THIN} />
      <rect x="19" y="33" width="6" height="6" rx="1.5" fill="var(--sun)" {...THIN} />
    </Svg>
  )
}

// LOG_IN: a key
export function LogInIcon() {
  return (
    <Svg>
      <circle cx="15" cy="24" r="9" fill="var(--sun)" {...INK} />
      <circle cx="13" cy="24" r="3" fill="var(--paper)" {...THIN} />
      <path d="M24 21 H43 V27 H39 V32 H34 V27 H24 Z" fill="var(--sun)" {...INK} />
    </Svg>
  )
}

// SIGN_UP: a blank form with a pencil
export function SignUpIcon() {
  return (
    <Svg>
      <rect x="7" y="5" width="28" height="37" rx="3" fill="var(--paper)" {...INK} />
      <path d="M13 13 H29 M13 19 H29 M13 25 H22" fill="none" {...THIN} />
      <path d="M37 18 L43 24 L27 40 L20 42 L22 35 Z" fill="var(--pink)" {...INK} />
      <path d="M33 22 L39 28" fill="none" {...THIN} />
    </Svg>
  )
}
