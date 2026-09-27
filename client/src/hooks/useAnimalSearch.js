import { useCallback, useEffect, useRef, useState } from 'react'
import { getNearbyAnimals, searchAnimals } from '../api/animals.js'
import { apiQuery, parseFilters } from '../utils/search.js'
import { distanceKm } from '../utils/geo.js'
import { matchesFilter } from '../utils/pets.js'
import { mockPets } from '../data/mockPets.js'

// VITE_USE_MOCK=true skips the API and shows the sample pets (species and urgent filters only)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const PAGE_SIZE = 50
const LOADING = { key: null, status: 'loading', pets: [], serverTotal: 0, dropped: 0, page: 0 }

// Nearby results are sorted here (the server always sends them nearest first); ties stay nearest first.
const COMPARE = {
  newest: (a, b) => new Date(b.listedAt) - new Date(a.listedAt),
  youngest: (a, b) => a.ageMonths - b.ageMonths,
  eldest: (a, b) => b.ageMonths - a.ageMonths,
}

// The nearby endpoint can't take q, so the keyword is matched here: every word in the name, breed or description.
function matchesKeyword(pet, q) {
  const text = `${pet.name} ${pet.breed} ${pet.blurb}`.toLowerCase()
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => text.includes(w))
}

// "Needs a foster urgently": the server's foster search includes "both" listings, whose pins say Available
const keepUrgent = (f, pets) => (f.urgent ? pets.filter((p) => p.status === 'urgent') : pets)

const withDistances = (f, pets) =>
  f.near ? pets.map((p) => (p.coords ? { ...p, distanceKm: distanceKm(f.near.coords, p.coords) } : p)) : pets

// First page of results for filters f → { pets, serverTotal, dropped }
async function loadFirst(f, signal) {
  if (USE_MOCK) {
    const pets = mockPets.filter((p) => matchesFilter(p, f))
    return { pets, serverTotal: pets.length, dropped: 0 }
  }
  if (f.near) {
    let pets = keepUrgent(f, await getNearbyAnimals(apiQuery(f), f.near.coords, f.radius, { signal }))
    if (f.q) pets = pets.filter((p) => matchesKeyword(p, f.q))
    if (f.sort) pets = [...pets].sort(COMPARE[f.sort])
    pets = withDistances(f, pets)
    return { pets, serverTotal: pets.length, dropped: 0 }
  }
  const { pets, total } = await searchAnimals(apiQuery(f), 1, { signal })
  const kept = keepUrgent(f, pets)
  return { pets: kept, serverTotal: total, dropped: pets.length - kept.length }
}

// The Adopt page's results for a search string (see utils/search.js), fetched 50 at a time.
// → { status: 'loading' | 'ready' | 'error', pets, total, hasMore, loadingMore, loadMore(), retry() }
// Near me results come in one go (the server's nearby search has no paging), with distanceKm on each pet.
export function useAnimalSearch(search) {
  const [state, setState] = useState(LOADING)
  const [attempt, setAttempt] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const moreRef = useRef(null)

  useEffect(() => {
    const ctrl = new AbortController()
    moreRef.current?.abort()
    moreRef.current = null
    loadFirst(parseFilters(search), ctrl.signal)
      .then((r) => setState({ key: search, status: 'ready', page: 1, ...r }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ ...LOADING, key: search, status: 'error' })
      })
    return () => ctrl.abort()
  }, [search, attempt])

  // until the new search's first page arrives, show LOADING rather than the old results
  const current = state.key === search ? state : LOADING
  const hasMore = current.status === 'ready' && !USE_MOCK && current.page * PAGE_SIZE < current.serverTotal
  const { page } = current

  const loadMore = useCallback(() => {
    if (!hasMore || moreRef.current) return
    const ctrl = new AbortController()
    moreRef.current = ctrl
    setLoadingMore(true)
    const f = parseFilters(search)
    searchAnimals(apiQuery(f), page + 1, { signal: ctrl.signal })
      .then(({ pets, total }) => {
        const kept = keepUrgent(f, pets)
        setState((s) => {
          if (s.key !== search) return s
          // a listing added between pages shifts the next page by one; skip pets already shown
          const seen = new Set(s.pets.map((p) => p.id))
          return {
            ...s,
            pets: [...s.pets, ...kept.filter((p) => !seen.has(p.id))],
            page: page + 1,
            serverTotal: total,
            dropped: s.dropped + pets.length - kept.length,
          }
        })
      })
      .catch(() => {
        // aborted, or the server is down: the pets so far stay and the next Next street / Show more tries again
      })
      .finally(() => {
        if (moreRef.current === ctrl) moreRef.current = null
        setLoadingMore(false)
      })
  }, [hasMore, search, page])

  const retry = useCallback(() => {
    setState(LOADING)
    setAttempt((n) => n + 1)
  }, [])

  return {
    status: current.status,
    pets: current.pets,
    total: current.serverTotal - current.dropped,
    hasMore,
    loadingMore,
    loadMore,
    retry,
  }
}
