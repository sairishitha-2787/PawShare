import HouseMarker from '../pets/HouseMarker.jsx'
import { INK, SPECIES_LABEL, houseTypeFor } from '../../utils/pets.js'

const HOUSE_NAME = { dog: 'doghouse', cat: 'cat tower', bird: 'birdhouse', hutch: 'hutch' }

// ON_THE_MAP: the pet's house and pin exactly as HouseMarker draws them on the neighborhood, on a patch of grass.
// Ground line at y=170; the tallest house (cat tower) puts the pin's top at y=5.
export default function PetPreview({ pet }) {
  const where = pet.status === 'urgent' ? 'pink ring, urgent foster' : 'mint ring, available'
  return (
    <figure className="preview">
      <svg viewBox="0 0 200 205" role="img" aria-label={`Map preview: ${pet.name} in a ${HOUSE_NAME[houseTypeFor(pet.species)]}, ${where}`}>
        <rect width="200" height="205" fill="#E3F4F6" />
        <path d="M0 150 Q100 132 200 150 V205 H0Z" fill="#A8D8B9" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <HouseMarker pet={pet} x={100} y={170} interactive={false} />
      </svg>
      <figcaption>
        {`${SPECIES_LABEL[pet.species]} · ${HOUSE_NAME[houseTypeFor(pet.species)]} · ${where}`}
      </figcaption>
    </figure>
  )
}
