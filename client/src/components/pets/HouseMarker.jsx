import House from './House.jsx'
import Pin from './Pin.jsx'
import { INK, SPECIES_LABEL, STATUS_LABEL, houseTypeFor, peakY } from '../../utils/pets.js'
import './HouseMarker.css'

// House + name plate + pin for one pet, standing on ground line y. Port of houseSVG() in the reference.
// interactive={false} draws it as a picture only (the listing form's preview): no button, no focus.
export default function HouseMarker({ pet, x, y, onOpen, dimmed = false, interactive = true }) {
  const type = houseTypeFor(pet.species)
  const cy = peakY(type, y) - 34
  const className = ['house', pet.status === 'urgent' && 'urgent-pin', dimmed && 'off'].filter(Boolean).join(' ')

  const drawing = (
    <>
      <House type={type} x={x} y={y} />
      <rect className="plate" x={x - 34} y={y + 7} width="68" height="18" rx="9" fill="#FFFDF8" stroke={INK} strokeWidth="2" />
      <text x={x} y={y + 20} textAnchor="middle" fontFamily="Silkscreen, monospace" fontSize="11" fill={INK}>
        {pet.name.toUpperCase()}
      </text>
      <Pin pet={pet} x={x} cy={cy} />
    </>
  )
  if (!interactive) return <g className={className}>{drawing}</g>

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen?.(pet.id)
    }
  }

  return (
    <g
      className={className}
      data-pet-id={pet.id}
      role="button"
      tabIndex={dimmed ? -1 : 0}
      aria-disabled={dimmed || undefined}
      aria-label={`${pet.name}, ${SPECIES_LABEL[pet.species]}, ${STATUS_LABEL[pet.status]}. Open profile`}
      onClick={() => onOpen?.(pet.id)}
      onKeyDown={handleKeyDown}
    >
      {drawing}
    </g>
  )
}
