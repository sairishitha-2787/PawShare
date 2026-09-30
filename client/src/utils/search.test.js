import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, activeFilters, apiQuery, emptyMessage, filterCount, matchesKeyword, parseFilters, toSearch } from './search.js'
import { matchesFilter } from './pets.js'

describe('parseFilters / toSearch', () => {
  it('reads nothing as the empty filters, and writes them back as ""', () => {
    expect(parseFilters('')).toEqual(EMPTY_FILTERS)
    expect(toSearch(EMPTY_FILTERS)).toBe('')
  })

  it('round-trips a full search in a stable order', () => {
    const search = '?species=cat&urgent=1&q=calm&age=baby,young&size=small&temperament=playful&listing=foster&city=Indiranagar&sort=youngest&near=indiranagar&radius=5'
    const f = parseFilters(search)
    expect(f).toMatchObject({ species: 'cat', urgent: true, q: 'calm', age: ['baby', 'young'], size: ['small'], listing: 'foster', sort: 'youngest', radius: 5 })
    expect(f.near.label).toBe('Indiranagar')
    // commas come back encoded (%2C); what matters is that it reads back the same, keys in a fixed order
    expect(parseFilters(toSearch(f))).toEqual(f)
    expect(decodeURIComponent(toSearch(f))).toBe(search)
  })

  it('drops unknown or malformed values', () => {
    const f = parseFilters('?species=dragon&age=baby,ancient,baby&size=huge&sort=random&radius=7&near=nowhere')
    expect(f).toMatchObject({ species: 'all', age: ['baby'], size: [], sort: '', radius: 25, near: null })
  })

  it('accepts a lng,lat location', () => {
    expect(parseFilters('?near=77.6,12.9').near.coords).toEqual([77.6, 12.9])
    expect(parseFilters('?near=500,12.9').near).toBeNull()
  })
})

describe('apiQuery', () => {
  it('asks for available and pending pets in listing order by default', () => {
    expect(apiQuery(EMPTY_FILTERS)).toMatchObject({ status: 'available,pending', sort: 'oldest', species: undefined, q: undefined })
  })

  it('turns "needs a foster urgently" into available foster listings', () => {
    expect(apiQuery({ ...EMPTY_FILTERS, urgent: true, listing: 'adoption' })).toMatchObject({ status: 'available', listingType: 'foster' })
  })

  it('sends small pets as rabbits and "other"', () => {
    expect(apiQuery({ ...EMPTY_FILTERS, species: 'small', age: ['adult', 'senior'] })).toMatchObject({ species: 'rabbit,other', ageGroup: 'adult,senior' })
  })
})

describe('active filter chips', () => {
  it('lists set filters as removable chips; the sort order is a chip but not a filter', () => {
    const f = { ...EMPTY_FILTERS, q: 'fetch', size: ['small', 'medium'], sort: 'newest' }
    const chips = activeFilters(f)
    expect(chips.map((c) => c.label)).toEqual(['Keyword: fetch', 'Size: Small', 'Size: Medium', 'Sort: Newest'])
    expect(filterCount(f)).toBe(3)
    expect(chips[1].without(f).size).toEqual(['medium'])
  })

  it('words the ERROR window for what was searched', () => {
    expect(emptyMessage(EMPTY_FILTERS)).toBe('NO PETS LISTED RIGHT NOW.')
    expect(emptyMessage({ ...EMPTY_FILTERS, species: 'cat', urgent: true })).toBe('NO CATS NEED AN URGENT FOSTER RIGHT NOW.')
    expect(emptyMessage({ ...EMPTY_FILTERS, q: 'zzzz' })).toBe('NO PETS MATCH THESE FILTERS.')
    expect(emptyMessage({ ...EMPTY_FILTERS, near: { key: 'hsr' }, radius: 5 })).toBe('NO PETS WITHIN 5 KM RIGHT NOW.')
  })
})

describe('matching on the client', () => {
  const pet = { name: 'Biscuit', breed: 'Golden Retriever', blurb: 'Loves a long walk.', species: 'dog', status: 'available' }

  it('matchesKeyword needs every word, in any case, in name, breed or description', () => {
    expect(matchesKeyword(pet, 'golden WALK')).toBe(true)
    expect(matchesKeyword(pet, 'biscuit cat')).toBe(false)
    expect(matchesKeyword(pet, '  ')).toBe(true)
  })

  it('matchesFilter handles species groups and urgent', () => {
    expect(matchesFilter(pet, { species: 'all', urgent: false })).toBe(true)
    expect(matchesFilter(pet, { species: 'dog', urgent: true })).toBe(false)
    expect(matchesFilter({ species: 'hamster', status: 'urgent' }, { species: 'small', urgent: true })).toBe(true)
    expect(matchesFilter({ species: 'bird', status: 'urgent' }, { species: 'small', urgent: false })).toBe(false)
  })
})
