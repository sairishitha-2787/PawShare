export const INK = '#3A3355'

export const STATUS_COLOR = { available: '#A8D8B9', urgent: '#FF9EBB', pending: '#FFD873' }
export const STATUS_LABEL = { available: 'Available', urgent: 'Urgent foster', pending: 'Adoption pending' }
export const SPECIES_LABEL = { dog: 'Dog', cat: 'Cat', bunny: 'Rabbit', guinea: 'Guinea pig', hamster: 'Hamster' }

// dog → doghouse, cat → cat tower, bunny/guinea/hamster → hutch
export function houseTypeFor(species) {
  if (species === 'dog') return 'dog'
  if (species === 'cat') return 'cat'
  return 'hutch'
}

// y of the roof peak for a house standing on ground line y
export function peakY(type, y) {
  if (type === 'dog') return y - 80
  if (type === 'cat') return y - 106
  return y - 72
}

const SMALL_PETS = ['bunny', 'guinea', 'hamster']

// Species filter: 'all' | 'dog' | 'cat' | 'small' (bunny, guinea, hamster). urgent keeps only urgent-foster pets.
export function matchesFilter(pet, { species, urgent }) {
  const sp = species === 'all' || (species === 'small' ? SMALL_PETS.includes(pet.species) : pet.species === species)
  return sp && (!urgent || pet.status === 'urgent')
}
