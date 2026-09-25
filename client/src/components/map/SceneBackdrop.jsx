import { useId } from 'react'
import { INK } from '../../utils/pets.js'

// Everything drawScene() in the reference draws except the houses. Coordinates are for viewBox 0 0 1000 560.

const SW = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round' }
const PATH = 'M-20 540 C180 500 250 400 470 395 S780 380 1020 330'

function Sparkle({ x, y, s, c }) {
  const k = s * 0.28
  return (
    <path
      d={`M${x} ${y - s}L${x + k} ${y - k}L${x + s} ${y}L${x + k} ${y + k}L${x} ${y + s}L${x - k} ${y + k}L${x - s} ${y}L${x - k} ${y - k}Z`}
      fill={c}
    />
  )
}

function Cloud({ x, y, k }) {
  return (
    <g fill="#FFFFFF" opacity=".95">
      <ellipse cx={x} cy={y} rx={40 * k} ry={16 * k} />
      <circle cx={x - 14 * k} cy={y - 10 * k} r={16 * k} />
      <circle cx={x + 12 * k} cy={y - 14 * k} r={20 * k} />
    </g>
  )
}

function Tree({ x, y, k = 1 }) {
  return (
    <>
      <rect x={x - 4 * k} y={y - 22 * k} width={8 * k} height={22 * k} fill="#B98B5E" {...SW} />
      <circle cx={x} cy={y - 38 * k} r={22 * k} fill="#7FC79A" {...SW} />
      <circle cx={x - 7 * k} cy={y - 44 * k} r={5 * k} fill="#A8E0BA" />
    </>
  )
}

function Flowers({ x, y, c }) {
  return (
    <g>
      {[0, 14, 28].map((d, i) => (
        <g key={d}>
          <circle cx={x + d} cy={y + (i % 2) * 6} r="4" fill={c} stroke={INK} strokeWidth="1.2" />
          <circle cx={x + d} cy={y + (i % 2) * 6} r="1.4" fill="#FFD873" />
        </g>
      ))}
    </g>
  )
}

export default function SceneBackdrop() {
  const skyId = useId()
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFE3FF" />
          <stop offset=".55" stopColor="#E9E3FF" />
          <stop offset="1" stopColor="#FFE3EE" />
        </linearGradient>
      </defs>
      <rect width="1000" height="560" fill={`url(#${skyId})`} />

      <circle cx="905" cy="78" r="36" fill="#FFD873" stroke={INK} strokeWidth="2" />
      <path d="M891 76q4-5 8 0M911 76q4-5 8 0M897 88q8 6 16 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />

      <Cloud x={130} y={70} k={1} />
      <Cloud x={470} y={52} k={0.8} />
      <Cloud x={700} y={95} k={1.1} />
      <Cloud x={300} y={120} k={0.6} />

      <Sparkle x={230} y={40} s={9} c="#FFFFFF" />
      <Sparkle x={610} y={30} s={7} c="#FFD873" />
      <Sparkle x={820} y={150} s={8} c="#FFFFFF" />
      <Sparkle x={60} y={150} s={6} c="#FF9EBB" />

      <path d="M0 215 Q180 150 380 205 T760 180 T1000 195 V560 H0Z" fill="#CDEBC8" {...SW} />
      <path d="M0 290 Q260 235 520 285 T1000 275 V560 H0Z" fill="#A8D8B9" {...SW} />

      <path d={PATH} stroke="#F5E3C0" strokeWidth="34" fill="none" strokeLinecap="round" />
      <path d={PATH} stroke="#E6CC9C" strokeWidth="2" strokeDasharray="4 14" fill="none" />

      <ellipse cx="930" cy="520" rx="70" ry="26" fill="#9FD3F0" {...SW} />
      <path d="M905 515q10-6 20 0M935 525q10-6 20 0" stroke="#FFFFFF" strokeWidth="2" fill="none" />

      <Tree x={40} y={300} k={0.9} />
      <Tree x={370} y={230} k={0.7} />
      <Tree x={640} y={215} k={0.7} />
      <Tree x={960} y={300} k={0.9} />
      <Tree x={345} y={515} k={0.8} />
      <Tree x={650} y={540} k={0.7} />

      <Flowers x={60} y={420} c="#FF9EBB" />
      <Flowers x={600} y={380} c="#FFFFFF" />
      <Flowers x={900} y={410} c="#B8A6E0" />
      <Flowers x={400} y={450} c="#FFD873" />

      <g>
        <rect x="20" y="462" width="6" height="40" fill="#B98B5E" {...SW} />
        <rect x="-4" y="444" width="118" height="26" rx="6" fill="#FFFDF8" {...SW} />
        <text x="55" y="462" textAnchor="middle" fontFamily="Silkscreen, monospace" fontSize="11" fill={INK}>
          PAWSHARE LN
        </text>
      </g>
    </g>
  )
}
