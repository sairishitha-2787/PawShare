import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import Pill from '../components/ui/Pill.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetCard from '../components/pets/PetCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { messagesTaskLabel } from '../utils/messages.js'
import { useReceivedApplications } from '../hooks/useReceivedApplications.js'
import { deleteAnimal, getMyAnimals, toListing } from '../api/animals.js'
import { LISTING_STATUSES, LISTING_STATUS_COLOR, LISTING_STATUS_LABEL } from '../utils/listing.js'
import { inboxTaskLabel } from '../utils/applications.js'
import { firstName } from '../utils/auth.js'
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

// Why this pet can't be removed, or null. The server deletes whatever it's asked to, so the check is here:
// pending applications need a decision first, and an approved one keeps the pet for the adopter's check-ins.
function removeBlock(name, apps) {
  if (apps.status !== 'ready') return null
  const pending = apps.list.filter((a) => a.status === 'pending').length
  if (pending) {
    return `${name} has ${pending} pending ${pending === 1 ? 'application' : 'applications'}. Approve or reject ${pending === 1 ? 'it' : 'them'} in the inbox first.`
  }
  if (apps.list.some((a) => a.status === 'approved')) {
    return `${name} has an approved application, so the listing stays for the adopter's check-ins and reviews.`
  }
  return null
}

// The card's footer: status pill + Edit / Remove, or the "Remove Mochi from PawShare?" confirm in its place.
function ListingFoot({ animal, apps, onEdit, onRemoved }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('idle') // 'idle' | 'confirm' | 'removing'
  const [error, setError] = useState('')
  const { name } = animal
  const blocked = removeBlock(name, apps)

  async function remove() {
    setStep('removing')
    setError('')
    try {
      await deleteAnimal(animal._id)
      onRemoved(animal)
    } catch (err) {
      setError(err.message)
      setStep('confirm')
    }
  }

  if (step === 'idle') {
    return (
      <div className="foot">
        <Pill label={LISTING_STATUS_LABEL[animal.status]} color={LISTING_STATUS_COLOR[animal.status]} />
        <span className="foot-btns">
          <Button onClick={() => onEdit(animal._id)} aria-label={`Edit ${name}`}>Edit</Button>
          <Button onClick={() => setStep('confirm')} aria-label={`Remove ${name}`}>Remove</Button>
        </span>
      </div>
    )
  }

  return (
    <div className="confirm" role="group" aria-label={`Remove ${name}`}>
      {blocked ? (
        <>
          <p>{blocked}</p>
          <span className="foot-btns">
            <Button onClick={() => setStep('idle')} autoFocus>Cancel</Button>
            <Button onClick={() => navigate('/shelter/applications')}>Open inbox</Button>
          </span>
        </>
      ) : (
        <>
          <p>{`Remove ${name} from PawShare?`}</p>
          {apps.status === 'loading' && <p className="confirm-small">Checking for applications...</p>}
          {error && <p className="confirm-err" role="alert">{error}</p>}
          <span className="foot-btns">
            <Button onClick={() => setStep('idle')} disabled={step === 'removing'} autoFocus>Cancel</Button>
            <Button variant="primary" onClick={remove} disabled={step === 'removing' || apps.status === 'loading'}>
              {step === 'removing' ? 'REMOVING...' : 'Yes, remove'}
            </Button>
          </span>
        </>
      )}
    </div>
  )
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
          <p className="mypets-note sun">Your shelter needs admin verification before you can list animals.</p>
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
