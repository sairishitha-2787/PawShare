import { describe, expect, it } from 'vitest'
import { mixHouses, streetOf, streetWithMatch } from './streets.js'
import { houseTypeFor, matchesFilter } from './pets.js'
import { mockPets } from '../data/mockPets.js'

const birds = (p) => matchesFilter(p, { species: 'bird', urgent: false })

describe('streetWithMatch', () => {
  it('jumps to the first street with a match when the current one has none', () => {
    // 13 mock pets in listing order: the 9 from the reference on street 1, the 4 birds on street 2
    expect(streetWithMatch(mockPets, birds, 0, 9)).toBe(1)
  })

  it('stays on the current street when something there matches', () => {
    const dogs = (p) => matchesFilter(p, { species: 'dog', urgent: false })
    expect(streetWithMatch(mockPets, dogs, 0, 9)).toBe(0)
    expect(streetWithMatch(mockPets, birds, 1, 9)).toBe(1)
  })

  it('finds Sunny for Birds + urgent', () => {
    const urgentBirds = (p) => matchesFilter(p, { species: 'bird', urgent: true })
    const street = streetWithMatch(mockPets, urgentBirds, 0, 9)
    expect(street).toBe(1)
    expect(mockPets.slice(9, 18).filter(urgentBirds).map((p) => p.name)).toEqual(['Sunny'])
  })

  it('stays put when nothing matches on any street', () => {
    expect(streetWithMatch(mockPets, () => false, 1, 9)).toBe(1)
  })
})

const ids = (pets) => pets.map((p) => p.id)
const ofType = (pets, type) => pets.filter((p) => houseTypeFor(p.species) === type)
const pet = (id, species) => ({ id, species })

describe('mixHouses', () => {
  it('deals the house types round-robin: dog, cat, bird, hutch', () => {
    expect(ids(mixHouses(mockPets))).toEqual([
      'biscuit', 'mochi', 'mango', 'clover',
      'pepper', 'luna', 'kiwi', 'tofu',
      'rocky', 'sushi', 'pearl', 'peanut',
      'sunny',
    ])
  })

  it('puts every house type on street 1 of the 13 mock pets (3 dogs, 2 cats, 2 birds, 2 hutches)', () => {
    const street1 = mixHouses(mockPets).slice(0, 9)
    expect(['dog', 'cat', 'bird', 'hutch'].map((t) => ofType(street1, t).length)).toEqual([3, 2, 2, 2])
  })

  it("keeps each type's own order and every pet exactly once", () => {
    const mixed = mixHouses(mockPets)
    expect([...ids(mixed)].sort()).toEqual([...ids(mockPets)].sort())
    for (const t of ['dog', 'cat', 'bird', 'hutch']) expect(ids(ofType(mixed, t))).toEqual(ids(ofType(mockPets, t)))
  })

  it('skips a type that has run out, and leaves a single type in order', () => {
    const pets = [pet('d1', 'dog'), pet('d2', 'dog'), pet('d3', 'dog'), pet('g1', 'guinea'), pet('h1', 'hamster')]
    expect(ids(mixHouses(pets))).toEqual(['d1', 'g1', 'd2', 'h1', 'd3'])
    expect(ids(mixHouses(pets.slice(0, 3)))).toEqual(['d1', 'd2', 'd3'])
    expect(mixHouses([])).toEqual([])
  })

  it('mixes within blocks, so loading more pets never reshuffles the ones already placed', () => {
    const first = [pet('d1', 'dog'), pet('d2', 'dog'), pet('d3', 'dog'), pet('d4', 'dog')]
    const more = [pet('b1', 'bird'), pet('c1', 'cat')]
    expect(ids(mixHouses(first, 4))).toEqual(['d1', 'd2', 'd3', 'd4'])
    expect(ids(mixHouses([...first, ...more], 4))).toEqual(['d1', 'd2', 'd3', 'd4', 'c1', 'b1'])
  })

  it('leaves the list it was given in listing order', () => {
    const copy = [...mockPets]
    mixHouses(mockPets)
    expect(mockPets).toEqual(copy)
  })
})

describe('streetOf', () => {
  it("finds a pet's street in the mixed order", () => {
    const mixed = mixHouses(mockPets)
    expect(streetOf(mixed, 'kiwi', 9)).toBe(0)
    expect(streetOf(mixed, 'sunny', 9)).toBe(1)
    expect(streetOf(mixed, 'nobody', 9)).toBe(-1)
  })

  it('keeps Birds on street 1 once the streets are mixed', () => {
    expect(streetWithMatch(mixHouses(mockPets), birds, 0, 9)).toBe(0)
  })
})
