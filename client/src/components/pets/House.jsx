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

// roof speckles and body flower dots, as [dx, dy from ground, fill]
const ROOF_DOTS = [[-12, 66, '#FFFFFF'], [-4, 72, '#FF9EBB'], [5, 67, '#FFFFFF'], [13, 64, '#FF9EBB'], [-1, 63, '#FFFFFF'], [-17, 62, '#FF9EBB']]
const BODY_DOTS = [[-11, 54, '#FF9EBB'], [11, 52, '#A8D8B9'], [-9, 36, '#A8D8B9'], [12, 37, '#FF9EBB']]

// the hanging house is drawn 15% larger than its sketch, scaled about the twine's knot on the branch, so it
// doesn't look small next to the other houses while the branch (and so the pin) stays at the same height
const BIRD_SCALE = 1.15
const KNOT = 99

// a birdhouse hanging on twine from a branch of a short tree (design/birds/birdhouse-reference.jpeg):
// sun bead, scalloped lilac cone roof, round cream body with an entry hole and perch, mint base disc.
// Drawn around (0, 0); strokes inside the scaled house are divided by the scale to stay 2px like the other houses.
// The branch top over x is the peak, 110 above the ground.
function Birdhouse({ x, y }) {
  const sw = { ...SW, strokeWidth: 2 / BIRD_SCALE }
  const thin = 1.5 / BIRD_SCALE
  let scallops = ''
  for (let i = 0; i < 4; i++) scallops += 'q-6.5 6 -13 0'
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M37 -92 L-27 -103 Q-33 -106 -28 -110 L37 -103 Z" fill="#B98552" {...SW} />
      <path d="M29 0 Q33 -3 33 -14 V-108 Q39 -115 45 -108 V-14 Q45 -3 49 0 Z" fill="#B98552" {...SW} />
      <path d="M39 -30v12M38 -70v10" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
      <g transform={`translate(0 ${-KNOT}) scale(${BIRD_SCALE}) translate(0 ${KNOT})`}>
        <path d="M0 -99V-84" stroke="#C9A66B" strokeWidth={2 / BIRD_SCALE} strokeLinecap="round" />
        <rect x="-18" y="-66" width="36" height="40" rx="14" fill="#FFF6E3" {...sw} />
        {BODY_DOTS.map(([dx, dy, fill]) => <circle key={`${dx},${dy}`} cx={dx} cy={-dy} r="2" fill={fill} />)}
        <circle cx="0" cy="-48" r="6" fill={INK} />
        <rect x="-5" y="-39" width="10" height="3" rx="1.5" fill="#B98552" stroke={INK} strokeWidth={thin} />
        <ellipse cx="0" cy="-25" rx="24" ry="4" fill="#A8D8B9" {...sw} />
        <path d={`M-26 -61 L-3 -80 Q0 -82 3 -80 L26 -61 ${scallops} Z`} fill="#B8A6E0" {...sw} />
        {ROOF_DOTS.map(([dx, dy, fill]) => <circle key={`${dx},${dy}`} cx={dx} cy={-dy} r="1.6" fill={fill} />)}
        <circle cx="0" cy="-84" r="4" fill="#FFD873" {...sw} />
      </g>
    </g>
  )
}

const SHAPES = { dog: DogHouse, cat: CatTower, bird: Birdhouse, hutch: Hutch }

// Ground shadow + house, standing on ground line y and centred on x. The legend draws them without the shadow.
export default function House({ type, x, y, shadow = true }) {
  const Shape = SHAPES[type] ?? Hutch
  return (
    <g>
      {/* the birdhouse hangs, so its shadow falls under the house and the trunk */}
      {shadow && <ellipse cx={type === 'bird' ? x + 24 : x} cy={y + 2} rx={type === 'bird' ? 38 : 48} ry="7" fill={INK} opacity=".14" />}
      <Shape x={x} y={y} />
    </g>
  )
}
