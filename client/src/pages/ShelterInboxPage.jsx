import { useEffect, useRef, useState } from 'react'
import { Navigate, useMatch, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import Pill from '../components/ui/Pill.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import ReadingPane from '../components/inbox/ReadingPane.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { messagesTaskLabel } from '../utils/messages.js'
import { useReceivedApplications } from '../hooks/useReceivedApplications.js'
import { applicationPet } from '../api/applications.js'
import { getMyAnimals } from '../api/animals.js'
import { APP_STATUSES, APP_STATUS_COLOR, APP_STATUS_LABEL, applicantName, inboxTaskLabel, wantsTo } from '../utils/applications.js'
import { formatShort } from '../utils/dates.js'
import { firstName } from '../utils/auth.js'
import './ShelterInboxPage.css'

const FILTERS = [...APP_STATUSES, 'all']
const FILTER_LABEL = { all: 'All', ...APP_STATUS_LABEL }
// the panes stack below this width (ShelterInboxPage.css); picking a row then moves focus down to the pane
const STACKED = '(max-width: 859px)'

// The shelter's own listings (for the pet dropdown). If they don't load, the dropdown still lists every pet
// that has an application, so a failure here stays quiet.
function useOwnAnimals() {
  const [animals, setAnimals] = useState([])
  useEffect(() => {
    const ctrl = new AbortController()
    getMyAnimals({ signal: ctrl.signal })
      .then(setAnimals)
      .catch(() => {})
    return () => ctrl.abort()
  }, [])
  return animals
}

// One application in the list, like a message in a mail client. Pending ones are "unread" (bold name).
function MessageRow({ application, selected, onOpen }) {
  const pet = applicationPet(application)
  const { status } = application
  const cls = ['msg', status === 'pending' && 'unread', selected && 'selected'].filter(Boolean).join(' ')
  return (
    <li>
      <button
        type="button"
        className={cls}
        data-app-id={application._id}
        aria-current={selected || undefined}
        onClick={() => onOpen(application._id)}
      >
        <PetFace pet={pet} size={40} />
        <span className="msg-main">
          <span className="msg-from">{applicantName(application)}</span>
          <span className="msg-subject">{wantsTo(application.type, pet.name)}</span>
        </span>
        <span className="msg-side">
          <span className="msg-date">{formatShort(application.createdAt)}</span>
          <Pill label={APP_STATUS_LABEL[status]} color={APP_STATUS_COLOR[status]} />
        </span>
      </button>
    </li>
  )
}

// "No pending applications. New ones will show up here." and friends
function emptyText(filter, petName) {
  const forPet = petName ? ` for ${petName}` : ''
  if (filter === 'pending') return `No pending applications${forPet}. New ones will show up here.`
  if (filter === 'all') return `No applications${forPet} yet. New ones will show up here.`
  return `No ${FILTER_LABEL[filter].toLowerCase()} applications${forPet}.`
}

function Inbox() {
  const { user, logout } = useAuth()
  const { count: unread } = useUnread()
  const navigate = useNavigate()
  const { status, applications, retry, refresh, patch } = useReceivedApplications()
  const ownAnimals = useOwnAnimals()
  const [petId, setPetId] = useState('')

  // the selected application lives in the URL: /shelter/applications/:id
  const openId = useMatch('/shelter/applications/:id')?.params.id
  const open = status === 'ready' && openId ? applications.find((a) => a._id === openId) : null
  const missing = status === 'ready' && openId && !open

  // Pending is the default tab; a deep link opens on its own application's tab instead (once, when the list arrives)
  const [chosen, setChosen] = useState(null)
  if (chosen === null && status === 'ready') setChosen(open ? open.status : 'pending')
  const filter = chosen ?? 'pending'

  // dropdown: the shelter's listings plus any other pet with an application (an admin sees every shelter's)
  const pets = new Map(ownAnimals.map((a) => [a._id, a.name]))
  for (const a of applications) if (a.animal?._id) pets.set(a.animal._id, a.animal.name)
  const petOptions = [...pets].sort((a, b) => a[1].localeCompare(b[1]))
  const petName = pets.get(petId)

  const forPet = petId ? applications.filter((a) => a.animal?._id === petId) : applications
  const counts = { all: forPet.length }
  for (const s of APP_STATUSES) counts[s] = forPet.filter((a) => a.status === s).length
  const shown = filter === 'all' ? forPet : forPet.filter((a) => a.status === filter)
  const pendingTotal = status === 'ready' ? applications.filter((a) => a.status === 'pending').length : null

  // the other pending applications for the same pet, which approving this one rejects
  const othersPending = open?.animal?._id
    ? applications.filter((a) => a.animal?._id === open.animal._id && a.status === 'pending' && a._id !== open._id).length
    : 0

  // on a narrow screen the pane is below the list, so a picked row moves focus (and the view) down to it
  const headingRef = useRef(null)
  const focusPane = useRef(false)
  useEffect(() => {
    if (!focusPane.current || !open) return
    focusPane.current = false
    headingRef.current?.focus()
  }, [open])

  const openApp = (id) => {
    focusPane.current = window.matchMedia(STACKED).matches
    navigate(`/shelter/applications/${encodeURIComponent(id)}`)
  }
  const closeMissing = () => navigate('/shelter/applications', { replace: true })

  const notVerified = user.role === 'shelter' && !user.isVerified

  return (
    <div className="desk inbox-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <div className="inbox-stack">
        {notVerified && (
          <p className="inbox-note">
            Your shelter isn&apos;t verified yet. You can review applications, but new listings need admin approval.
          </p>
        )}

        <Window title="INBOX.EXE" barColor="mint" className="inbox" aria-label="Applications inbox">
          {status === 'ready' && (
            <div className="inbox-tools">
              <div className="inbox-chips" role="group" aria-label="Filter by status">
                {FILTERS.map((f) => (
                  <Chip key={f} pressed={filter === f} onClick={() => setChosen(f)}>
                    {`${FILTER_LABEL[f]} (${counts[f]})`}
                  </Chip>
                ))}
              </div>
              <label className="pet-pick">
                <span>Pet</span>
                <select value={petId} onChange={(e) => setPetId(e.target.value)}>
                  <option value="">All pets</option>
                  {petOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
            </div>
          )}

          {status !== 'ready' ? (
            <div className="inbox-wait">
              {status === 'loading' && <LoadingWindow label="Opening your inbox" />}
              {status === 'error' && (
                <ErrorDialog message="COULDN'T LOAD YOUR APPLICATIONS." okLabel="Retry" onOk={retry} />
              )}
            </div>
          ) : (
            <div className="inbox-panes">
              <div className="inbox-list">
                {shown.length === 0 ? (
                  <p className="inbox-empty">{emptyText(filter, petName)}</p>
                ) : (
                  <ul className="msgs" aria-label={`${FILTER_LABEL[filter]} applications`}>
                    {shown.map((a) => (
                      <MessageRow key={a._id} application={a} selected={a._id === openId} onOpen={openApp} />
                    ))}
                  </ul>
                )}
              </div>

              <div className={open || missing ? 'inbox-pane' : 'inbox-pane idle'}>
                {open ? (
                  <ReadingPane
                    key={open._id}
                    application={open}
                    othersPending={othersPending}
                    headingRef={headingRef}
                    onDecided={(updated) => {
                      // show the decision straight away, then fetch again (the pet's other applications changed too)
                      patch(updated._id, {
                        status: updated.status,
                        shelterNote: updated.shelterNote,
                        decidedAt: updated.decidedAt,
                      })
                      refresh()
                    }}
                    onFailed={refresh}
                  />
                ) : missing ? (
                  <div className="pane-missing">
                    <p>WE COULDN&apos;T FIND THAT APPLICATION.</p>
                    <Button onClick={closeMissing}>OK</Button>
                  </div>
                ) : (
                  <p className="pane-hint">Pick an application to read it.</p>
                )}
              </div>
            </div>
          )}
        </Window>
      </div>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt') },
          { id: 'mypets', label: 'My pets', onClick: () => navigate('/shelter/animals') },
          { id: 'inbox', label: inboxTaskLabel(pendingTotal) },
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />
    </div>
  )
}

// /shelter/applications and /shelter/applications/:id (behind RequireAuth): INBOX.EXE, shelters and admins.
// Adopters get their own applications instead.
export default function ShelterInboxPage() {
  const { user } = useAuth()
  if (user.role === 'adopter') return <Navigate to="/applications" replace />
  return <Inbox />
}
