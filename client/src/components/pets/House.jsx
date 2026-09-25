import { INK } from '../../utils/pets.js'

const SW = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round' }

function DogHouse({ x, y }) {
  return (
    <>
      <rect x={x - 35} y={y - 45} width="70" height="45" rx="3" fill="#FCE3B8" {...SW} />
      <path d={`M${x - 35} ${y - 22}h70`} stroke="#E2BE85" strokeWidth="2" />
      <path d={`M${x - 45} ${y - 41} L${x} ${y - 80} L${x + 45} ${y - 41} Z`} fill="#F4877F" {...SW} />
      <path d={`M${x - 13} ${y} V${y - 19} A13 13 0 0 1 ${x + 13} ${y - 19} V${y} Z`} fill={INK} />
    </>
  )
}

function CatTower({ x, y }) {
  return (
    <>
      <rect x={x - 28} y={y - 72} width="56" height="72" rx="3" fill="#E9E0FF" {...SW} />
      <path
        d={`M${x - 37} ${y - 68} L${x - 25} ${y - 106} L${x - 12} ${y - 88} L${x + 12} ${y - 88} L${x + 25} ${y - 106} L${x + 37} ${y - 68} Z`}
        fill="#8FB8F0"
        {...SW}
      />
      <circle cx={x} cy={y - 48} r="9" fill="#FFF7D6" {...SW} />
      <path d={`M${x - 9} ${y - 48}h18M${x} ${y - 57}v18`} stroke={INK} strokeWidth="1.5" />
      <path d={`M${x - 11} ${y} V${y - 12} A11 11 0 0 1 ${x + 11} ${y - 12} V${y} Z`} fill={INK} />
    </>
  )
}

function Hutch({ x, y }) {
  let mesh = ''
  for (let i = 1; i < 5; i++) mesh += `M${x - 36 + i * 8} ${y - 46}v28`
  return (
    <>
      <rect x={x - 37} y={y - 14} width="6" height="14" fill="#C9A06A" {...SW} />
      <rect x={x + 31} y={y - 14} width="6" height="14" fill="#C9A06A" {...SW} />
      <rect x={x - 42} y={y - 52} width="84" height="40" rx="3" fill="#FFF3D6" {...SW} />
      <rect x={x - 36} y={y - 46} width="42" height="28" fill="#FFFFFF" stroke={INK} strokeWidth="1.5" />
      <path d={`${mesh}M${x - 36} ${y - 32}h42`} stroke={INK} strokeWidth="1" opacity=".55" />
      <rect x={x + 12} y={y - 46} width="24" height="28" rx="2" fill="#F2D9A8" stroke={INK} strokeWidth="1.5" />
      <path d={`M${x - 50} ${y - 50} L${x - 30} ${y - 72} L${x + 30} ${y - 72} L${x + 50} ${y - 50} Z`} fill="#FFD873" {...SW} />
    </>
  )
}

// a birdhouse on a pole: round entrance hole with a perch under it, lilac roof peaking 100 above the ground
function Birdhouse({ x, y }) {
  return (
    <>
      <rect x={x - 14} y={y - 5} width="28" height="5" rx="2" fill="#C9A06A" {...SW} />
      <rect x={x - 4} y={y - 46} width="8" height="42" fill="#C9A06A" {...SW} />
      <rect x={x - 25} y={y - 82} width="50" height="40" rx="3" fill="#FFF3D6" {...SW} />
      <circle cx={x} cy={y - 66} r="8" fill={INK} />
      <rect x={x - 9} y={y - 54} width="18" height="4" rx="2" fill="#C9A06A" stroke={INK} strokeWidth="1.5" />
      <path d={`M${x - 34} ${y - 78} L${x} ${y - 100} L${x + 34} ${y - 78} Z`} fill="#B8A6E0" {...SW} />
    </>
  )
}

const SHAPES = { dog: DogHouse, cat: CatTower, bird: Birdhouse, hutch: Hutch }

// Ground shadow + house, standing on ground line y and centred on x. The legend draws them without the shadow.
export default function House({ type, x, y, shadow = true }) {
  const Shape = SHAPES[type] ?? Hutch
  return (
    <g>
      {shadow && <ellipse cx={x} cy={y + 2} rx="48" ry="7" fill={INK} opacity=".14" />}
      <Shape x={x} y={y} />
    </g>
  )
}
