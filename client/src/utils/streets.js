// The map's streets: pets fill them in order, perStreet (LOTS.length) at a time.
import { houseTypeFor } from './pets.js'

const HOUSE_ORDER = ['dog', 'cat', 'bird', 'hutch']
// the search loads 50 pets at a time; mixing within blocks of that size means loading more only
// fills the streets after the loaded pets and never reshuffles a street already on screen
export const MIX_BLOCK = 50

// The map's placement order: round-robin by house type (dog, cat, bird, hutch, dog, cat, ...), each type
// keeping its own order, so every street gets a mix. A type that runs out is skipped. Only for the map:
// the list view and the API keep listing order.
export function mixHouses(pets, block = MIX_BLOCK) {
  const out = []
  for (let start = 0; start < pets.length; start += block) {
    const queues = HOUSE_ORDER.map((type) => pets.slice(start, start + block).filter((p) => houseTypeFor(p.species) === type))
    for (let i = 0; out.length < Math.min(start + block, pets.length); i++) {
      for (const q of queues) if (i < q.length) out.push(q[i])
    }
  }
  return out
}

// The street a pet is on, or -1 when it isn't in pets.
export function streetOf(pets, id, perStreet) {
  const i = pets.findIndex((p) => p.id === id)
  return i === -1 ? -1 : Math.floor(i / perStreet)
}

// The street to show when the filter changes: the current one if any pet on it matches, else the first
// street with a match. With no match anywhere it stays put (the page shows the empty-results ERROR).
export function streetWithMatch(pets, matches, current, perStreet) {
  const onStreet = (s) => pets.slice(s * perStreet, (s + 1) * perStreet)
  if (onStreet(current).some(matches)) return current
  const first = pets.findIndex(matches)
  return first === -1 ? current : Math.floor(first / perStreet)
}
