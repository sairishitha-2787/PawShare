import { DEFAULT_RADIUS, RADII, parseNear } from './geo.js'

// The Adopt page's search lives in the URL query string so it can be shared and survives a refresh:
//   ?species=cat&urgent=1&q=..&breed=..&age=baby,young&size=small&gender=female&temperament=playful,calm
//    &listing=foster&city=..&sort=youngest&near=indiranagar&radius=5
// Anything unknown or malformed is dropped when it's read.

// Toolbar chips. "small" = rabbits and everything the API calls "other" (guinea pigs, hamsters).
export const SPECIES = [
  { value: 'all', label: 'All', word: 'PETS' },
  { value: 'dog', label: 'Dogs', word: 'DOGS' },
  { value: 'cat', label: 'Cats', word: 'CATS' },
  { value: 'bird', label: 'Birds', word: 'BIRDS' },
  { value: 'small', label: 'Small pets', word: 'SMALL PETS' },
]
const API_SPECIES = { dog: 'dog', cat: 'cat', bird: 'bird', small: 'rabbit,other' }

// FIND_PETS.EXE options, server value → label
export const AGE_GROUPS = [
  { value: 'baby', label: 'Puppy/kitten' },
  { value: 'young', label: 'Young' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Senior' },
]
export const SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra large' },
]
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]
export const LISTINGS = [
  { value: 'adoption', label: 'Adopt' },
  { value: 'foster', label: 'Foster' },
  { value: '', label: 'Either' },
]
// '' is the default order: nearest first with a location, otherwise listing order (each pet keeps its house)
export const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'youngest', label: 'Youngest' },
  { value: 'eldest', label: 'Oldest' },
]
export const defaultSortLabel = (near) => (near ? 'Nearest' : 'Map order')

// Temperament tags are free text; these are the common ones. The API stores them lowercased and a pet
// must have every tag asked for.
export const TEMPERAMENTS = [
  'good with kids', 'good with cats', 'house-trained', 'leash-trained', 'indoor only', 'lap cat',
  'playful', 'calm', 'quiet', 'very gentle', 'shy at first', 'chatty',
]
export const tagLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1)

export const EMPTY_FILTERS = {
  species: 'all', urgent: false, q: '', breed: '', city: '',
  age: [], size: [], gender: [], temperament: [], listing: '', sort: '',
  near: null, radius: DEFAULT_RADIUS,
}

const list = (value, allowed) => {
  const values = (value || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)
  const kept = allowed ? values.filter((v) => allowed.some((o) => o.value === v)) : values
  return [...new Set(kept)]
}
const one = (value, allowed, fallback = '') => (allowed.some((o) => o.value === value) ? value : fallback)
const text = (value) => (value || '').trim().slice(0, 60)

// URL query string → filters
export function parseFilters(search) {
  const p = new URLSearchParams(search)
  const radius = Number(p.get('radius'))
  return {
    species: one(p.get('species'), SPECIES, 'all'),
    urgent: p.get('urgent') === '1',
    q: text(p.get('q')),
    breed: text(p.get('breed')),
    city: text(p.get('city')),
    age: list(p.get('age'), AGE_GROUPS),
    size: list(p.get('size'), SIZES),
    gender: list(p.get('gender'), GENDERS),
    temperament: list(p.get('temperament')).slice(0, 15),
    listing: one(p.get('listing'), LISTINGS),
    sort: one(p.get('sort'), SORTS),
    near: parseNear(p.get('near')),
    radius: RADII.includes(radius) ? radius : DEFAULT_RADIUS,
  }
}

// filters → URL query string ('' when nothing is set), always in the same order so equal searches match
export function toSearch(f) {
  const p = new URLSearchParams()
  if (f.species !== 'all') p.set('species', f.species)
  if (f.urgent) p.set('urgent', '1')
  if (f.q) p.set('q', f.q)
  if (f.breed) p.set('breed', f.breed)
  if (f.age.length) p.set('age', f.age.join(','))
  if (f.size.length) p.set('size', f.size.join(','))
  if (f.gender.length) p.set('gender', f.gender.join(','))
  if (f.temperament.length) p.set('temperament', f.temperament.join(','))
  if (f.listing) p.set('listing', f.listing)
  if (f.city) p.set('city', f.city)
  if (f.sort) p.set('sort', f.sort)
  if (f.near) {
    p.set('near', f.near.key)
    if (f.radius !== DEFAULT_RADIUS) p.set('radius', String(f.radius))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

// filters → GET /animals (or /animals/nearby) query. Available and pending pets only, like the map always showed.
// "Needs a foster urgently" = available foster listings. The server's foster search also returns "both"
// listings; their pins say Available, so useAnimalSearch drops those again.
export function apiQuery(f) {
  return {
    status: f.urgent ? 'available' : 'available,pending',
    species: API_SPECIES[f.species],
    listingType: f.urgent ? 'foster' : f.listing || undefined,
    q: f.q || undefined,
    breed: f.breed || undefined,
    city: f.city || undefined,
    ageGroup: f.age.join(',') || undefined,
    size: f.size.join(',') || undefined,
    gender: f.gender.join(',') || undefined,
    temperament: f.temperament.join(',') || undefined,
    // listing order by default: that's the order the map fills its lots
    sort: f.sort || 'oldest',
  }
}

// The nearby endpoint can't take q, so useAnimalSearch matches the keyword itself: every word has to be
// somewhere in the name, breed or description (any case).
export function matchesKeyword(pet, q) {
  const text = `${pet.name} ${pet.breed} ${pet.blurb}`.toLowerCase()
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => text.includes(w))
}

const labelOf =(options, value) => options.find((o) => o.value === value)?.label ?? value

// The FIND_PETS.EXE filters that are set, as removable chips: [{ id, label, without(filters) }].
// Species, urgent and Near me have their own controls in the toolbar, so they aren't repeated here.
export function activeFilters(f) {
  const chips = []
  const textChip = (key, name) => {
    if (f[key]) chips.push({ id: key, label: `${name}: ${f[key]}`, without: (x) => ({ ...x, [key]: '' }) })
  }
  const listChips = (key, name, options) => {
    for (const v of f[key]) {
      chips.push({
        id: `${key}-${v}`,
        label: `${name}: ${options ? labelOf(options, v) : tagLabel(v)}`,
        without: (x) => ({ ...x, [key]: x[key].filter((y) => y !== v) }),
      })
    }
  }
  textChip('q', 'Keyword')
  textChip('breed', 'Breed')
  listChips('age', 'Age', AGE_GROUPS)
  listChips('size', 'Size', SIZES)
  listChips('gender', 'Gender', GENDERS)
  listChips('temperament', 'Temperament')
  if (f.listing) chips.push({ id: 'listing', label: `Listing: ${labelOf(LISTINGS, f.listing)}`, without: (x) => ({ ...x, listing: '' }) })
  textChip('city', 'City')
  if (f.sort) chips.push({ id: 'sort', label: `Sort: ${labelOf(SORTS, f.sort)}`, without: (x) => ({ ...x, sort: '' }) })
  return chips
}

// How many FIND_PETS.EXE filters are set (the sort order doesn't count)
export const filterCount = (f) => activeFilters(f).filter((c) => c.id !== 'sort').length

// The ERROR window's text when nothing matches.
export function emptyMessage(f) {
  const word = SPECIES.find((s) => s.value === f.species).word
  const within = f.near ? ` WITHIN ${f.radius} KM` : ''
  const others = filterCount(f) > 0
  if (f.urgent && !others) return `NO ${word}${within} NEED AN URGENT FOSTER RIGHT NOW.`
  if (f.species === 'all' && !f.urgent && !others) return f.near ? `NO PETS${within} RIGHT NOW.` : 'NO PETS LISTED RIGHT NOW.'
  return `NO ${word}${within} MATCH THESE FILTERS.`
}
