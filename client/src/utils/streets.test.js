import { describe, expect, it } from 'vitest'
import { streetWithMatch } from './streets.js'
import { matchesFilter } from './pets.js'
import { mockPets } from '../data/mockPets.js'

const birds = (p) => matchesFilter(p, { species: 'bird', urgent: false })

describe('streetWithMatch', () => {
  it('jumps to the first street with a match when the current one has none', () => {
    // 13 mock pets: the 9 from the reference on street 1, the 4 birds on street 2
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
