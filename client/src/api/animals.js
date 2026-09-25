import { request } from './client.js'

// API species → our species. Anything not listed (bird, other) shows as a guinea pig in a hutch.
const SPECIES = { dog: 'dog', cat: 'cat', rabbit: 'bunny', 'guinea pig': 'guinea' }
const SIZE = { small: 'Small', medium: 'Medium', large: 'Large', xlarge: 'Extra large' }
const SEX = { male: 'Male', female: 'Female' }

// PetFace colours, picked by hashing the id so a pet always gets the same set (the mockPets colours).
const PALETTE = [
  { fur: '#E8B77A', dark: '#9A6A3C', bg: '#FFE8C7' },
  { fur: '#F4F1EC', dark: '#C9C1B5', bg: '#E7DEFA' },
  { fur: '#FFFFFF', dark: '#7B6F8F', bg: '#DDF2E4' },
  { fur: '#4A3F45', dark: '#2A2328', bg: '#FFE1EA' },
  { fur: '#B9B3C9', dark: '#8C84A3', bg: '#FFF3D6' },
  { fur: '#F2D089', dark: '#C99A45', bg: '#DDF2E4' },
  { fur: '#EFE4D3', dark: '#B79E7E', bg: '#FFE1EA' },
  { fur: '#F7E7CF', dark: '#D08A47', bg: '#E7DEFA' },
  { fur: '#F3DEC0', dark: '#A26A3B', bg: '#FFF3D6' },
]

// FNV-1a: small, stable string hash
function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// available foster listings are the "urgent" ones; adopted/fostered animals are off the map (null)
function statusFor({ status, listingType }) {
  if (status === 'available') return listingType === 'foster' ? 'urgent' : 'available'
  if (status === 'pending') return 'pending'
  return null
}

// 8 → "8 mos", 12 → "1 yr", 18 → "1.5 yrs" (years rounded to the nearest half)
export function formatAge(months) {
  if (months < 12) return `${months} ${months === 1 ? 'mo' : 'mos'}`
  const years = Math.round((months / 12) * 2) / 2
  return `${years} ${years === 1 ? 'yr' : 'yrs'}`
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Just enough of an API animal to draw its PetFace, whatever its status (an approved application's pet is
// adopted/fostered, which toPet leaves out). The same id always gets the same colours as on the map.
export function petLook(a) {
  return {
    id: a._id,
    name: a.name,
    species: SPECIES[a.species] || 'guinea',
    colors: PALETTE[hash(a._id) % PALETTE.length],
    photoUrl: a.photos?.[0]?.url,
  }
}

// API animal → our pet shape (see CLAUDE.md), or null if it shouldn't be shown.
export function toPet(a) {
  const status = statusFor(a)
  if (!status) return null
  return {
    ...petLook(a),
    status,
    // 'adoption' | 'foster' | 'both': which application types the shelter accepts
    listingType: a.listingType || 'both',
    age: formatAge(a.ageMonths),
    breed: a.breed,
    sex: SEX[a.gender] || 'Unknown',
    size: SIZE[a.size] || capitalize(a.size || ''),
    shelter: a.owner?.name || 'Unknown shelter',
    area: a.location?.city || '',
    vax: a.vaccinated ? 'Up to date' : 'Not yet',
    // the API stores temperament lowercased; show it in sentence case like the reference
    tags: (a.temperament || []).map(capitalize),
    blurb: a.description || '',
  }
}

// Available and pending animals, oldest listing first (the order the map fills its lots).
// filters: any GET /api/animals query param. Species/urgent filtering happens on the client.
export async function getAnimals(filters = {}, options) {
  const { animals } = await request('/animals', {
    query: { status: 'available,pending', sort: 'oldest', limit: 50, ...filters },
    ...options,
  })
  return animals.map(toPet).filter(Boolean)
}

// The logged-in shelter's own listings, whatever their status, newest first, as the API sends them.
export async function getMyAnimals(options) {
  const { animals } = await request('/animals/mine', options)
  return animals
}

// One animal as a pet, or null if it's adopted/fostered. Throws (status 404) if it doesn't exist.
export async function getAnimal(id, options) {
  const { animal } = await request(`/animals/${encodeURIComponent(id)}`, options)
  return toPet(animal)
}
