import { useEffect, useState } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import SegToggle from '../components/ui/SegToggle.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import Neighborhood from '../components/map/Neighborhood.jsx'
import Legend from '../components/map/Legend.jsx'
import PetCard from '../components/pets/PetCard.jsx'
import FavoritesPanel from '../components/pets/FavoritesPanel.jsx'
import ProfileWindow from '../components/pets/ProfileWindow.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { firstName } from '../utils/auth.js'
import { applicationsTaskLabel } from '../utils/applications.js'
import { useMyApplications } from '../hooks/useMyApplications.js'
import { matchesFilter } from '../utils/pets.js'
import { mockPets } from '../data/mockPets.js'
import { getAnimal, getAnimals } from '../api/animals.js'
import './AdoptPage.css'

const SPECIES = [
  { value: 'all', label: 'All', word: 'PETS' },
  { value: 'dog', label: 'Dogs', word: 'DOGS' },
  { value: 'cat', label: 'Cats', word: 'CATS' },
  { value: 'small', label: 'Small pets', word: 'SMALL PETS' },
]
const VIEWS = [{ value: 'map', label: 'Map' }, { value: 'list', label: 'Full list' }]
// VITE_USE_MOCK=true skips the API and shows the sample pets
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const MOCK_LOAD = { status: 'ready', pets: mockPets }

// Loads the pets once; retry() tries again after a failure. status: 'loading' | 'ready' | 'error'
function usePets() {
  const [load, setLoad] = useState(USE_MOCK ? MOCK_LOAD : { status: 'loading', pets: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (USE_MOCK) return
    const ctrl = new AbortController()
    getAnimals({}, { signal: ctrl.signal })
      .then((pets) => setLoad({ status: 'ready', pets }))
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error', pets: [] })
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = () => {
    setLoad({ status: 'loading', pets: [] })
    setAttempt((n) => n + 1)
  }
  return { ...load, retry }
}

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
  const { status, pets, retry } = usePets()
  const [filter, setFilter] = useState({ species: 'all', urgent: false })
  const { favs } = useFavorites()
  const { user, loading: authLoading, logout } = useAuth()
  // adopters get an Applications task with their pending count
  const isAdopter = user?.role === 'adopter'
  const myApps = useMyApplications(isAdopter)
  const pendingCount = myApps.status === 'ready' ? myApps.applications.filter((a) => a.status === 'pending').length : null
  // the view lives in the URL hash (#list) so it survives a refresh
  const location = useLocation()
  const { hash } = location
  const navigate = useNavigate()
  const view = hash === '#list' ? 'list' : 'map'
  const setView = (v) => navigate({ hash: v === 'list' ? '#list' : '' }, { replace: true })

  const matches = (p) => matchesFilter(p, filter)
  const shown = pets.filter(matches)
  const noneWord = SPECIES.find((s) => s.value === filter.species).word

  // the open profile lives in the URL too: /adopt/:petId (keeps #list if it's there)
  const petId = useMatch('/adopt/:petId')?.params.petId
  const fetchedPet = useProfilePet(petId)
  const profilePet = pets.find((p) => p.id === petId) || fetchedPet
  const showPet = (id) => navigate({ pathname: `/adopt/${id}`, hash })
  const closePet = () => navigate({ pathname: '/adopt', hash }, { replace: true })
  // if the button that opened the profile is gone (unfavorited in the FAVORITES/ panel), focus the pet's house
  const houseFor = (id) => () => document.querySelector(`.house[data-pet-id="${CSS.escape(id)}"]`)

  return (
    <div className="desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
        <p>Mockup · Neighborhood view · sample pets from Bengaluru shelters</p>
      </header>

      <Window title={<>NEIGHBORHOOD.EXE — <span>{shown.length}</span> pets nearby</>} aria-label="Neighborhood">
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Species">
            {SPECIES.map((s) => (
              <Chip key={s.value} pressed={filter.species === s.value} onClick={() => setFilter((f) => ({ ...f, species: s.value }))}>
                {s.label}
              </Chip>
            ))}
          </div>
          <label className="urgent">
            <input
              type="checkbox"
              checked={filter.urgent}
              onChange={(e) => setFilter((f) => ({ ...f, urgent: e.target.checked }))}
            />
            Needs a foster urgently
          </label>
          <SegToggle options={VIEWS} value={view} onChange={setView} />
        </div>

        <div className="main" hidden={view !== 'map'}>
          <Neighborhood pets={pets} isDimmed={(p) => !matches(p)} onOpen={showPet}>
            <LoadStatus status={status} onRetry={retry} />
            {status === 'ready' && shown.length === 0 && (
              <ErrorDialog
                message={`NO ${noneWord} NEED AN URGENT FOSTER RIGHT NOW.`}
                onOk={() => setFilter((f) => ({ ...f, urgent: false }))}
              />
            )}
          </Neighborhood>
          <aside className="side">
            <Legend pets={shown} />
            <FavoritesPanel pets={pets} onOpen={showPet} />
          </aside>
        </div>

        <div className="list" hidden={view !== 'list'}>
          {status !== 'ready' ? (
            <div className="list-status"><LoadStatus status={status} onRetry={retry} /></div>
          ) : shown.length ? (
            shown.map((p) => <PetCard key={p.id} pet={p} onOpen={showPet} />)
          ) : (
            <Window as="div" title="ERROR" barColor="pink" dots={false} className="list-err">
              <div className="body">NO PETS MATCH THESE FILTERS.</div>
            </Window>
          )}
        </div>
      </Window>

      <Taskbar
        items={[
          { label: 'Neighborhood.exe' },
          { label: 'Key.txt', hideOnSmall: true },
          { id: 'fav', label: `Favorites (${pets.filter((p) => favs.has(p.id)).length})`, hideOnSmall: true },
          // nothing while a saved login is being checked, so "Log in" doesn't flash up
          ...(isAdopter ? [{ id: 'apps', label: applicationsTaskLabel(pendingCount), onClick: () => navigate('/applications') }] : []),
          ...(user
            ? [{ id: 'me', label: `${firstName(user.name)} · ${user.role}` }, { id: 'logout', label: 'Log out', onClick: logout }]
            : authLoading
              ? []
              : [{ id: 'login', label: 'Log in', onClick: () => navigate('/login', { state: { from: location } }) }]),
        ]}
      />

      {profilePet && <ProfileWindow key={profilePet.id} pet={profilePet} onClose={closePet} fallbackFocus={houseFor(profilePet.id)} />}
    </div>
  )
}

// LOADING... window while the pets load, the ERROR window with Retry if the server can't be reached
function LoadStatus({ status, onRetry }) {
  if (status === 'loading') return <LoadingWindow />
  if (status === 'error') return <ErrorDialog message="COULDN'T REACH THE SHELTER SERVER." okLabel="Retry" onOk={onRetry} />
  return null
}
