import { describe, expect, it } from 'vitest'
import { formatAge, mapSpecies, toPet } from './animals.js'

// an animal as GET /api/animals sends it
const apiAnimal = (overrides = {}) => ({
  _id: '6ab8c6236c06531fbbea5a87',
  name: 'Biscuit',
  species: 'dog',
  breed: 'Golden Retriever',
  ageMonths: 24,
  gender: 'male',
  size: 'medium',
  status: 'available',
  listingType: 'adoption',
  vaccinated: true,
  temperament: ['loves fetch', 'good with kids'],
  description: 'Follows his nose everywhere.',
  photos: [{ url: 'https://example.com/biscuit.jpg' }],
  healthRecords: [{ title: 'Rabies shot', date: '2026-08-01' }],
  owner: { _id: 'shelter1', name: 'Happy Tails Shelter' },
  location: { city: 'Koramangala', coordinates: { type: 'Point', coordinates: [77.6245, 12.9352] } },
  createdAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
})

describe('toPet', () => {
  it('maps an API animal to the frontend pet shape', () => {
    const pet = toPet(apiAnimal())
    expect(pet).toMatchObject({
      id: '6ab8c6236c06531fbbea5a87',
      name: 'Biscuit',
      species: 'dog',
      status: 'available',
      listingType: 'adoption',
      age: '2 yrs',
      sex: 'Male',
      size: 'Medium',
      shelter: 'Happy Tails Shelter',
      shelterId: 'shelter1',
      area: 'Koramangala',
      vax: 'Up to date',
      tags: ['Loves fetch', 'Good with kids'],
      blurb: 'Follows his nose everywhere.',
      photoUrl: 'https://example.com/biscuit.jpg',
      health: [{ title: 'Rabies shot', date: '2026-08-01' }],
      coords: [77.6245, 12.9352],
    })
    expect(pet.colors).toEqual(expect.objectContaining({ fur: expect.any(String), dark: expect.any(String), bg: expect.any(String) }))
  })

  it('gives the same id the same colours every time', () => {
    expect(toPet(apiAnimal()).colors).toEqual(toPet(apiAnimal({ name: 'Renamed' })).colors)
  })

  it('shows available foster listings as urgent and pending as pending', () => {
    expect(toPet(apiAnimal({ listingType: 'foster' })).status).toBe('urgent')
    expect(toPet(apiAnimal({ listingType: 'both' })).status).toBe('available')
    expect(toPet(apiAnimal({ status: 'pending' })).status).toBe('pending')
  })

  it('leaves adopted and fostered animals off the map', () => {
    expect(toPet(apiAnimal({ status: 'adopted' }))).toBeNull()
    expect(toPet(apiAnimal({ status: 'fostered' }))).toBeNull()
  })

  it('falls back sensibly when fields are missing', () => {
    const pet = toPet(apiAnimal({ owner: undefined, location: undefined, temperament: undefined, photos: [], gender: 'unknown', listingType: undefined, vaccinated: false }))
    expect(pet).toMatchObject({ shelter: 'Unknown shelter', shelterId: null, area: '', tags: [], sex: 'Unknown', listingType: 'both', vax: 'Not yet', coords: null })
    expect(pet.photoUrl).toBeUndefined()
  })
})

describe('mapSpecies', () => {
  it('maps API species, with hamsters hidden in "other"', () => {
    expect(mapSpecies({ species: 'rabbit' })).toBe('bunny')
    expect(mapSpecies({ species: 'guinea pig' })).toBe('guinea')
    expect(mapSpecies({ species: 'other', breed: 'Syrian Hamster' })).toBe('hamster')
    expect(mapSpecies({ species: 'other', breed: 'Chinchilla' })).toBe('guinea')
    expect(mapSpecies({ species: 'other' })).toBe('guinea')
  })
})

describe('formatAge', () => {
  it('shows months under a year, then years to the nearest half', () => {
    expect(formatAge(1)).toBe('1 mo')
    expect(formatAge(8)).toBe('8 mos')
    expect(formatAge(12)).toBe('1 yr')
    expect(formatAge(18)).toBe('1.5 yrs')
    expect(formatAge(26)).toBe('2 yrs')
  })
})
