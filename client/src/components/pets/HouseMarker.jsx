import House, { peakY } from './House.jsx'
import Pin from './Pin.jsx'
import { INK, SPECIES_LABEL, STATUS_LABEL, houseTypeFor } from '../../utils/pets.js'
import './HouseMarker.css'

// House + name plate + pin for one pet, standing on ground line y. Port of houseSVG() in the reference.
export default function HouseMarker({ pet, x, y, onOpen, dimmed = false }) {
  const type = houseTypeFor(pet.species)
  const cy = peakY(type, y) - 34
  const className = ['house', pet.status === 'urgent' && 'urgent-pin', dimmed && 'off'].filter(Boolean).join(' ')

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen?.(pet.id)
    }
  }

  return (
    <g
      className={className}
      role="button"
      tabIndex={dimmed ? -1 : 0}
      aria-disabled={dimmed || undefined}
      aria-label={`${pet.name}, ${SPECIES_LABEL[pet.species]}, ${STATUS_LABEL[pet.status]}. Open profile`}
      onClick={() => onOpen?.(pet.id)}
      onKeyDown={handleKeyDown}
    >
      <House type={type} x={x} y={y} />
      <rect className="plate" x={x - 34} y={y + 7} width="68" height="18" rx="9" fill="#FFFDF8" stroke={INK} strokeWidth="2" />
      <text x={x} y={y + 20} textAnchor="middle" fontFamily="Silkscreen, monospace" fontSize="11" fill={INK}>
        {pet.name.toUpperCase()}
      </text>
      <Pin pet={pet} x={x} cy={cy} />
    </g>
  )
}
