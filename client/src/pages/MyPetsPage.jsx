import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetCard from '../components/pets/PetCard.jsx'
import ListingFoot from '../components/shelter/ListingFoot.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { useAdminTask } from '../context/AdminContext.jsx'
import { messagesTaskLabel } from '../utils/messages.js'
import { useReceivedApplications } from '../hooks/useReceivedApplications.js'
import { getMyAnimals, toListing } from '../api/animals.js'
import { LISTING_STATUSES, LISTING_STATUS_LABEL } from '../utils/listing.js'
import { inboxTaskLabel } from '../utils/applications.js'
import { firstName } from '../utils/auth.js'
import { profileTask, verifyLinkLabel } from '../utils/shelters.js'
import './MyPetsPage.css'

const FILTERS = ['all', ...LISTING_STATUSES]
const FILTER_LABEL = { all: 'All', ...LISTING_STATUS_LABEL }
const TYPE_WORD = { adoption: 'Adopt', foster: 'Foster', both: 'Adopt or foster' }

// The shelter's own listings, every status, newest first. status: 'loading' | 'ready' | 'error'
function useMyListings() {
  const [load, setLoad] = useState({ status: 'loading', animals: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    getMyAnimals({ signal: ctrl.signal })
      .then((animals) => setLoad({ status: 'ready', animals }))
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error', animals: [] })
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = () => {
    setLoad({ status: 'loading', animals: [] })
    setAttempt((n) => n + 1)
  }
  const drop = (id) => setLoad((l) => ({ ...l, animals: l.animals.filter((a) => a._id !== id) }))
  return { ...load, retry, drop }
}

function emptyText(filter) {
  if (filter === 'all') return 'No pets listed yet. Add one to put it on the neighborhood map.'
  return `No ${FILTER_LABEL[filter].toLowerCase()} pets.`
}

function MyPets() {
  const { user, logout, refreshUser } = useAuth()
  const { count: unread } = useUnread()
  const navigate = useNavigate()
  const checkInsTask = useCheckInsTask(navigate)
  const adminTask = useAdminTask(navigate)
  const location = useLocation()
  const listings = useMyListings()
  const received = useReceivedApplications()
  const [filter, setFilter] = useState('all')
  // "Saved Kiwi." / "Removed Mochi.": from the form (router state) or from a removal here
  const [done, setDone] = useState(() => (location.state?.saved ? `Saved ${location.state.saved}.` : ''))

  // clear the router state so a refresh doesn't say "Saved" again
  const savedState = location.state?.saved
  useEffect(() => {
    if (savedState) navigate(location.pathname, { replace: true, state: null })
  }, [savedState, location.pathname, navigate])

  // the login copy of the user may be old: ask the server if an admin has verified the shelter since
  useEffect(() => {
    const ctrl = new AbortController()
    refreshUser({ signal: ctrl.signal })
    return () => ctrl.abort()
  }, [refreshUser])

  const notVerified = user.role === 'shelter' && !user.isVerified
  const counts = { all: listings.animals.length }
  for (const s of LISTING_STATUSES) counts[s] = listings.animals.filter((a) => a.status === s).length
  const shown = filter === 'all' ? listings.animals : listings.animals.filter((a) => a.status === filter)
  const pendingTotal = received.status === 'ready' ? received.applications.filter((a) => a.status === 'pending').length : null
  const appsFor = (id) => ({ status: received.status, list: received.applications.filter((a) => a.animal?._id === id) })

  const edit = (id) => navigate(`/shelter/animals/${encodeURIComponent(id)}/edit`)
  const removed = (animal) => {
    listings.drop(animal._id)
    setDone(`Removed ${animal.name}.`)
  }

  return (
    <div className="desk mypets-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <div className="mypets-stack">
        {notVerified && (
          <p className="mypets-note sun">
            Your shelter needs admin verification before you can list animals.{' '}
            <Link to="/shelter/verification">{verifyLinkLabel(user)}</Link>
          </p>
        )}
        {done && (
          <p className="mypets-note mint" role="status">{done}</p>
        )}

        <Window title="MY_PETS/" barColor="sun" className="mypets" aria-label="My pets">
          <div className="mypets-tools">
            <Button variant="primary" className="add-pet" disabled={notVerified} onClick={() => navigate('/shelter/animals/new')}>
              Add a pet
            </Button>
            {listings.status === 'ready' && (
              <div className="chips" role="group" aria-label="Filter by status">
                {FILTERS.map((f) => (
                  <Chip key={f} pressed={filter === f} onClick={() => setFilter(f)}>
                    {`${FILTER_LABEL[f]} (${counts[f]})`}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {listings.status !== 'ready' ? (
            <div className="mypets-wait">
              {listings.status === 'loading' && <LoadingWindow label="Fetching your pets" />}
              {listings.status === 'error' && (
                <ErrorDialog message="COULDN'T LOAD YOUR PETS." okLabel="Retry" onOk={listings.retry} />
              )}
            </div>
          ) : shown.length === 0 ? (
            <p className="mypets-empty">{emptyText(filter)}</p>
          ) : (
            <div className="mypets-list">
              {shown.map((a) => {
                const pet = toListing(a)
                return (
                  <PetCard
                    key={a._id}
                    pet={pet}
                    detail={[TYPE_WORD[a.listingType], pet.area].filter(Boolean).join(' · ')}
                    foot={<ListingFoot animal={a} apps={appsFor(a._id)} onEdit={edit} onRemoved={removed} />}
                  />
                )
              })}
            </div>
          )}
        </Window>
      </div>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt') },
          { id: 'mypets', label: 'My pets' },
          { id: 'inbox', label: inboxTaskLabel(pendingTotal), onClick: () => navigate('/shelter/applications') },
          profileTask(user, navigate),
          adminTask,
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />
    </div>
  )
}

// /shelter/animals (behind RequireAuth): MY_PETS/, shelters and admins. Adopters go to the neighborhood.
export default function MyPetsPage() {
  const { user } = useAuth()
  if (user.role === 'adopter') return <Navigate to="/adopt" replace />
  return <MyPets />
}
