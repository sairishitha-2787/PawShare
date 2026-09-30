import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import SegToggle from '../components/ui/SegToggle.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Neighborhood from '../components/map/Neighborhood.jsx'
import Legend from '../components/map/Legend.jsx'
import PetCard from '../components/pets/PetCard.jsx'
import FavoritesPanel from '../components/pets/FavoritesPanel.jsx'
import ProfileWindow from '../components/pets/ProfileWindow.jsx'
import FindPetsWindow from '../components/search/FindPetsWindow.jsx'
import ActiveFilters from '../components/search/ActiveFilters.jsx'
import NearbyShelters from '../components/search/NearbyShelters.jsx'
import { NearMeToggle, NearRow } from '../components/search/NearMe.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { usePublishTaskCount } from '../context/TaskCountsContext.jsx'
import { useLoad } from '../hooks/useLoad.js'
import { useAnimalSearch } from '../hooks/useAnimalSearch.js'
import { useNearMe } from '../hooks/useNearMe.js'
import { SPECIES, emptyMessage, filterCount, parseFilters, toSearch } from '../utils/search.js'
import { DEFAULT_RADIUS, distanceKm, parseNear } from '../utils/geo.js'
import { mockPets } from '../data/mockPets.js'
import { getAnimal, getAnimals } from '../api/animals.js'
import './AdoptPage.css'

const VIEWS = [{ value: 'map', label: 'Map' }, { value: 'list', label: 'Full list' }]
// VITE_USE_MOCK=true skips the API and shows the sample pets
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Every available and pending pet, unfiltered, for FAVORITES/ and the taskbar's favorites count
// (a saved pet stays there whatever the search).
const loadAllPets = USE_MOCK ? async () => mockPets : (options) => getAnimals({}, options)

// The pet for a /adopt/:petId link, fetched with getAnimal (the list may not have it, or may not be loaded yet).
// null while loading, or if it doesn't exist or has been adopted.
function useProfilePet(petId) {
  const [fetched, setFetched] = useState(null)

  useEffect(() => {
    if (USE_MOCK || !petId) return
    const ctrl = new AbortController()
    getAnimal(petId, { signal: ctrl.signal })
      .then((pet) => setFetched(pet && { forId: petId, pet }))
      .catch(() => {
        // not found or server down: the list copy (if any) is still shown
      })
    return () => ctrl.abort()
  }, [petId])

  return fetched && fetched.forId === petId ? fetched.pet : null
}

export default function AdoptPage() {
  const all = useLoad(loadAllPets)
  const { favs } = useFavorites()
  // the view lives in the URL hash (#list) so it survives a refresh
  const location = useLocation()
  const { hash, search, pathname } = location
  const navigate = useNavigate()
  const view = hash === '#list' ? 'list' : 'map'
  const setView = (v) => navigate({ search, hash: v === 'list' ? '#list' : '' }, { replace: true })

  // the search lives in the query string (see utils/search.js), so it can be shared and survives a refresh
  const filters = useMemo(() => parseFilters(search), [search])
  const searchKey = toSearch(filters)
  const { status, pets, total, hasMore, loadingMore, loadMore, retry } = useAnimalSearch(searchKey)
  // the browser's location arrives later, so a change starts from the latest URL rather than this render's
  const latest = useRef({ filters, pathname, hash })
  useEffect(() => {
    latest.current = { filters, pathname, hash }
  })
  const setFilters = (change) => {
    const { filters: f, pathname: path, hash: h } = latest.current
    navigate({ pathname: path, search: toSearch({ ...f, ...change }), hash: h }, { replace: true })
  }
  const clearAll = () => navigate({ pathname, hash }, { replace: true })
  const [finding, setFinding] = useState(false)
  const nearMe = useNearMe((key) => setFilters({ near: parseNear(key) }))
  const { near } = filters

  // every pet loaded so far: the search results, then the rest (for FAVORITES/ and profiles)
  const known = useMemo(() => {
    const ids = new Set(pets.map((p) => p.id))
    return [...pets, ...(all.data || []).filter((p) => !ids.has(p.id))]
  }, [pets, all.data])
  usePublishTaskCount('favorites', known.filter((p) => favs.has(p.id)).length)

  // /adopt#favorites (the Start menu's and the desktop's FAVORITES): bring the FAVORITES/ window into view
  useEffect(() => {
    if (hash !== '#favorites') return
    const panel = document.getElementById('favorites')
    panel?.scrollIntoView({ block: 'center' })
    panel?.focus({ preventScroll: true })
  }, [hash])

  // the open profile lives in the URL too: /adopt/:petId (keeps the search and #list if they're there)
  const petId = useMatch('/adopt/:petId')?.params.petId
  const fetchedPet = useProfilePet(petId)
  const openPet = known.find((p) => p.id === petId) || fetchedPet
  // with Near me on, a pet that isn't in the results (a favorite further away) still gets its distance
  const profilePet =
    openPet && near && openPet.distanceKm == null && openPet.coords
      ? { ...openPet, distanceKm: distanceKm(near.coords, openPet.coords) }
      : openPet
  const showPet = (id) => navigate({ pathname: `/adopt/${id}`, search, hash })
  const closePet = () => navigate({ pathname: '/adopt', search, hash }, { replace: true })
  // if the button that opened the profile is gone (unfavorited in the FAVORITES/ panel), focus the pet's house
  const houseFor = (id) => () => document.querySelector(`.house[data-pet-id="${CSS.escape(id)}"]`)

  const moreCount = filterCount(filters)
  // shown in whichever view is on screen: LOADING, ERROR + Retry, or the no-results ERROR (OK clears the search)
  const searchStatus = (
    <SearchStatus
      status={status}
      empty={pets.length === 0}
      message={emptyMessage(filters)}
      onRetry={retry}
      onClear={searchKey ? clearAll : retry}
    />
  )

  return (
    <div className="desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
        <p>Neighborhood view · pets from Bengaluru shelters</p>
      </header>

      <Window
        title={
          status === 'ready'
            ? <>NEIGHBORHOOD.EXE — <span>{total}</span> {total === 1 ? 'pet' : 'pets'} found</>
            : 'NEIGHBORHOOD.EXE — searching'
        }
        aria-label="Neighborhood"
      >
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Species">
            {SPECIES.map((s) => (
              <Chip key={s.value} pressed={filters.species === s.value} onClick={() => setFilters({ species: s.value })}>
                {s.label}
              </Chip>
            ))}
          </div>
          <label className="urgent">
            <input type="checkbox" checked={filters.urgent} onChange={(e) => setFilters({ urgent: e.target.checked })} />
            Needs a foster urgently
          </label>
          <Button onClick={() => setFinding(true)} aria-haspopup="dialog">
            {moreCount ? `More filters (${moreCount})` : 'More filters'}
          </Button>
          <NearMeToggle near={near} nearMe={nearMe} onOff={() => setFilters({ near: null, radius: DEFAULT_RADIUS })} />
          <SegToggle options={VIEWS} value={view} onChange={setView} />
        </div>
        <NearRow near={near} radius={filters.radius} nearMe={nearMe} onRadius={(radius) => setFilters({ radius })} />
        <ActiveFilters filters={filters} onChange={setFilters} onClearAll={clearAll} />

        <div className="main" hidden={view !== 'map'}>
          {/* keyed by the search, so a new search starts on the first street */}
          <Neighborhood key={searchKey} pets={pets} total={total} onMore={loadMore} onOpen={showPet}>
            {view === 'map' && searchStatus}
          </Neighborhood>
          <aside className="side">
            <Legend pets={pets} />
            {near && <NearbyShelters pets={pets} radius={filters.radius} />}
            <FavoritesPanel pets={known} onOpen={showPet} />
          </aside>
        </div>

        <div className="list" hidden={view !== 'list'}>
          {status === 'ready' && pets.length ? (
            <>
              {pets.map((p) => <PetCard key={p.id} pet={p} onOpen={showPet} />)}
              {hasMore && (
                <div className="list-more">
                  <Button onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading...' : `Show more (${total - pets.length} more)`}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="list-status">{view === 'list' && searchStatus}</div>
          )}
        </div>
      </Window>


      {finding && (
        <FindPetsWindow
          filters={filters}
          onFind={(f) => {
            setFilters(f)
            setFinding(false)
          }}
          onClearAll={() => {
            clearAll()
            setFinding(false)
          }}
          onClose={() => setFinding(false)}
        />
      )}
      {profilePet && <ProfileWindow key={profilePet.id} pet={profilePet} onClose={closePet} fallbackFocus={houseFor(profilePet.id)} />}
    </div>
  )
}

// LOADING... while the pets load, ERROR + Retry if the server can't be reached, and the ERROR window when
// nothing matches (its OK clears the search)
function SearchStatus({ status, empty, message, onRetry, onClear }) {
  if (status === 'loading') return <LoadingWindow />
  if (status === 'error') return <ErrorDialog message="COULDN'T REACH THE SHELTER SERVER." okLabel="Retry" onOk={onRetry} />
  if (empty) return <ErrorDialog message={message} onOk={onClear} />
  return null
}
