import PetFace from './PetFace.jsx'
import { INK, STATUS_COLOR } from '../../utils/pets.js'

// Map pin: ring centred on (x, cy) with its pointer 33 units below.
export default function Pin({ pet, x, cy }) {
  const ring = STATUS_COLOR[pet.status]
  return (
    <g className="pin">
      <path
        d={`M${x - 10} ${cy + 18} L${x} ${cy + 33} L${x + 10} ${cy + 18} Z`}
        fill={ring}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx={x} cy={cy} r="25" fill={ring} stroke={INK} strokeWidth="2" />
      <PetFace pet={pet} size={40} x={x - 20} y={cy - 20} />
      <circle cx={x} cy={cy} r="20" fill="none" stroke={INK} strokeWidth="1.5" />
    </g>
  )
}
