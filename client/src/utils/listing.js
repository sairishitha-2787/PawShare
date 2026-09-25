// The shelter's listing form (ADD_PET.EXE / EDIT_<NAME>.EXE): its state, validation, and the API body.
// Values and limits follow server/models/Animal.js.

// Hamster is a form-only choice: the API has no hamster species, so it saves as "other" with "hamster" in the breed.
export const FORM_SPECIES = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'other', label: 'Other small pet' },
]
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unknown', label: 'Not sure' },
]
export const SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra large' },
]
export const LISTING_TYPES = [
  { value: 'adoption', label: 'Adopt' },
  { value: 'foster', label: 'Foster' },
]
// only offered when editing a listing that already takes both (so saving doesn't quietly change it)
export const BOTH_TYPE = { value: 'both', label: 'Either' }
export const AGE_UNITS = [
  { value: 'years', label: 'Years' },
  { value: 'months', label: 'Months' },
]
// temperament is free text on the server; these are just quick picks
export const TAG_SUGGESTIONS = [
  'playful', 'calm', 'gentle', 'shy at first', 'good with kids', 'good with cats', 'good with dogs',
  'house-trained', 'indoor only', 'talkative',
]

export const MAX = {
  name: 60, breed: 60, city: 100, description: 2000, ageMonths: 400,
  tags: 15, tag: 30, photos: 10, recordTitle: 100, vetName: 100, notes: 1000,
}

const HTTP_URL = /^https?:\/\/\S+$/i
export const isHttpUrl = (s) => HTTP_URL.test(s)

let nextKey = 0
const key = () => `r${++nextKey}`

// local date as YYYY-MM-DD, what <input type="date"> uses
export function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const emptyRecord = () => ({ key: key(), date: today(), title: '', vetName: '', notes: '' })

export function emptyForm(city = '') {
  return {
    name: '', species: '', breed: '', age: '', ageUnit: 'years', gender: '', size: '', listingType: 'adoption',
    city, tags: [], description: '', vaccinated: null, neutered: null, health: [], photos: [],
  }
}

// API animal → form state
export function formFromAnimal(a) {
  const hamster = a.species === 'other' && /hamster/i.test(a.breed || '')
  const inYears = a.ageMonths >= 12 && a.ageMonths % 12 === 0
  return {
    name: a.name,
    species: hamster ? 'hamster' : a.species,
    breed: a.breed === 'Mixed' ? '' : a.breed || '',
    age: String(inYears ? a.ageMonths / 12 : a.ageMonths),
    ageUnit: inYears ? 'years' : 'months',
    gender: a.gender,
    size: a.size,
    listingType: a.listingType,
    city: a.location?.city || '',
    tags: a.temperament || [],
    description: a.description || '',
    vaccinated: Boolean(a.vaccinated),
    neutered: Boolean(a.neutered),
    health: (a.healthRecords || []).map((r) => ({
      key: key(),
      date: r.date ? String(r.date).slice(0, 10) : '',
      title: r.title || '',
      vetName: r.vetName || '',
      notes: r.notes || '',
    })),
    photos: (a.photos || []).map(({ url, publicId }) => ({ url, ...(publicId && { publicId }) })),
  }
}

// the breed as it will be saved: "Mixed" when blank, and a hamster's always says hamster
export function savedBreed({ species, breed }) {
  const b = breed.trim()
  if (species === 'hamster') {
    if (!b) return 'Hamster'
    return /hamster/i.test(b) ? b : `${b} hamster`
  }
  return b || 'Mixed'
}

// "2" years → 24; null if it isn't a usable number
export function ageMonthsOf({ age, ageUnit }) {
  const n = Number(age)
  if (String(age).trim() === '' || !Number.isFinite(n) || n < 0) return null
  return Math.round(ageUnit === 'years' ? n * 12 : n)
}

// field → message. Health record fields are keyed "health.<key>.<field>".
export function validateListing(form) {
  const errors = {}
  const name = form.name.trim()
  if (!name) errors.name = 'Give the pet a name.'
  else if (name.length > MAX.name) errors.name = `Keep it under ${MAX.name} characters.`
  if (!form.species) errors.species = 'Pick a species.'
  if (savedBreed(form).length > MAX.breed) errors.breed = `Keep it under ${MAX.breed} characters.`

  const months = ageMonthsOf(form)
  if (months === null) errors.age = 'Enter the age as a number.'
  else if (form.ageUnit === 'months' && !Number.isInteger(Number(form.age))) errors.age = 'Use whole months.'
  else if (months > MAX.ageMonths) errors.age = 'That’s older than PawShare allows (33 years).'

  if (!form.gender) errors.gender = 'Pick one.'
  if (!form.size) errors.size = 'Pick a size.'
  if (!form.listingType) errors.listingType = 'Pick adopt or foster.'
  const city = form.city.trim()
  if (!city) errors.city = 'Enter the city or area the pet is in.'
  else if (city.length > MAX.city) errors.city = `Keep it under ${MAX.city} characters.`

  if (form.tags.length > MAX.tags) errors.tags = `Up to ${MAX.tags} tags.`
  if (form.description.trim().length > MAX.description) errors.description = `Keep it under ${MAX.description} characters.`

  if (form.vaccinated === null) errors.vaccinated = 'Pick yes or no.'
  if (form.neutered === null) errors.neutered = 'Pick yes or no.'
  for (const r of form.health) {
    const title = r.title.trim()
    if (!title) errors[`health.${r.key}.title`] = 'What was it? (e.g. Vaccination)'
    else if (title.length > MAX.recordTitle) errors[`health.${r.key}.title`] = `Keep it under ${MAX.recordTitle} characters.`
    if (r.vetName.trim().length > MAX.vetName) errors[`health.${r.key}.vetName`] = `Keep it under ${MAX.vetName} characters.`
    if (r.notes.trim().length > MAX.notes) errors[`health.${r.key}.notes`] = `Keep it under ${MAX.notes} characters.`
  }

  if (form.photos.length > MAX.photos) errors.photos = `Up to ${MAX.photos} photos.`
  return errors
}

// Form → POST/PUT body. location: the listing's current location (edit) or the shelter's (new), so the
// coordinates survive; the city always comes from the form.
export function listingBody(form, location = {}) {
  const coords = location.coordinates?.coordinates?.length === 2 ? location.coordinates : undefined
  return {
    name: form.name.trim(),
    species: form.species === 'hamster' ? 'other' : form.species,
    breed: savedBreed(form),
    ageMonths: ageMonthsOf(form),
    gender: form.gender,
    size: form.size,
    listingType: form.listingType,
    location: {
      ...(location.state && { state: location.state }),
      ...(location.country && { country: location.country }),
      ...(coords && { coordinates: coords }),
      city: form.city.trim(),
    },
    temperament: form.tags,
    description: form.description.trim(),
    vaccinated: form.vaccinated,
    neutered: form.neutered,
    healthRecords: form.health.map((r) => ({
      title: r.title.trim(),
      ...(r.date && { date: r.date }),
      ...(r.vetName.trim() && { vetName: r.vetName.trim() }),
      ...(r.notes.trim() && { notes: r.notes.trim() }),
    })),
    photos: form.photos,
  }
}

// "Mochi" → "EDIT_MOCHI.EXE"
export const editTitle = (name) => `EDIT_${name.trim().toUpperCase().replace(/\s+/g, '_')}.EXE`

// Listing statuses (the API's own), in chip order, and their pill colors
export const LISTING_STATUSES = ['available', 'pending', 'adopted', 'fostered']
export const LISTING_STATUS_LABEL = { available: 'Available', pending: 'Pending', adopted: 'Adopted', fostered: 'Fostered' }
export const LISTING_STATUS_COLOR = { available: '#A8D8B9', pending: '#FFD873', adopted: '#B8A6E0', fostered: '#E7DEFA' }
