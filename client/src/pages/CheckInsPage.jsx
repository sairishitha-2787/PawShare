import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import Timeline from '../components/checkins/Timeline.jsx'
import HealthLog from '../components/checkins/HealthLog.jsx'
import CheckInForm from '../components/checkins/CheckInForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckIns, useCheckInsTask } from '../context/CheckInsContext.jsx'
import { getMyCheckIns } from '../api/checkins.js'
import { applicationPet, getMyApplications } from '../api/applications.js'
import { groupByApplication, isDue } from '../utils/checkins.js'
import { messagesTaskLabel } from '../utils/messages.js'
import { formatShort } from '../utils/dates.js'
import { firstName } from '../utils/auth.js'
import './CheckInsPage.css'

// One diary section per approved application (newest first), with its check-ins.
// status: 'loading' | 'ready' | 'error'. retry() shows LOADING again; refresh() refetches quietly.
function useDiary() {
  const [load, setLoad] = useState({ status: 'loading', pets: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    const options = { signal: ctrl.signal }
    Promise.all([getMyApplications({ status: 'approved' }, options), getMyCheckIns(undefined, options)])
      .then(([applications, checkIns]) => {
        const groups = new Map(groupByApplication(checkIns).map((g) => [g.applicationId, g]))
        const pets = applications.map((application) => ({
          application,
          scheduled: groups.get(application._id)?.scheduled || [],
          log: groups.get(application._id)?.log || [],
        }))
        setLoad({ status: 'ready', pets })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoad((l) => (l.status === 'ready' ? l : { status: 'error', pets: [] }))
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading', pets: [] })
    setAttempt((n) => n + 1)
  }, [])
  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...load, retry, refresh }
}

// "Adopted from Stray Hearts Trust on 22 Aug" / "Fostered from ..."
function fromLine(application) {
  const verb = application.type === 'foster' ? 'Fostered' : 'Adopted'
  const shelter = application.shelter?.name || 'the shelter'
  return application.decidedAt ? `${verb} from ${shelter} on ${formatShort(application.decidedAt)}` : `${verb} from ${shelter}`
}

// One pet: face, name, where from; the timeline; the buttons; HEALTH.LOG.
function PetSection({ entry, saved, onFill }) {
  const { application, scheduled, log } = entry
  const pet = applicationPet(application)
  const next = scheduled.find((c) => c.status === 'pending' && isDue(c))
  const headingId = `diary-${application._id}-name`

  // the "Fill in" button is usually gone after a save, so focus goes to the note instead
  const noteRef = useRef(null)
  useEffect(() => {
    if (saved) noteRef.current?.focus()
  }, [saved])

  return (
    <section className="diary-pet" id={`diary-${application._id}`} aria-labelledby={headingId}>
      <div className="diary-head">
        <PetFace pet={pet} size={64} />
        <div>
          <h2 id={headingId}>{pet.name}</h2>
          <p>{fromLine(application)}</p>
        </div>
      </div>

      <Timeline checkIns={scheduled} />

      {saved && <p ref={noteRef} className="diary-saved" role="status" tabIndex={-1}>Check-in saved. Thank you!</p>}

      <div className="diary-actions">
        {next && (
          <Button variant="primary" onClick={() => onFill(entry, next)}>{`Fill in ${next.label} check-in`}</Button>
        )}
        <Button onClick={() => onFill(entry, null)}>Log an update</Button>
      </div>

      <HealthLog entries={log} petName={pet.name} />
    </section>
  )
}

function Diary() {
  const { user, logout } = useAuth()
  const { count: unread } = useUnread()
  const { refresh: refreshCount } = useCheckIns()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const { status, pets, retry, refresh } = useDiary()
  const checkInsTask = useCheckInsTask(navigate, { current: true })
  // { entry, checkIn } while CHECKUP.EXE is open; checkIn null = an ad-hoc update
  const [filling, setFilling] = useState(null)
  const [savedFor, setSavedFor] = useState(null) // application id with the "saved" note

  // /checkins#diary-<applicationId> (from "Open pet diary") scrolls to that pet once it's loaded
  const scrolled = useRef(false)
  useEffect(() => {
    if (status !== 'ready' || scrolled.current || !hash) return
    scrolled.current = true
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [status, hash])

  const onSaved = (applicationId) => {
    setSavedFor(applicationId)
    setFilling(null)
    refresh()
    refreshCount()
  }

  return (
    <div className="desk diary-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <Window title="PET_DIARY.EXE" barColor="mint" className="diary" aria-label="Pet diary">
        <div className={status === 'ready' ? 'diary-main' : 'diary-main waiting'}>
          {status === 'loading' && <LoadingWindow label="Opening your pet diary" />}
          {status === 'error' && <ErrorDialog message="COULDN'T LOAD YOUR PET DIARY." okLabel="Retry" onOk={retry} />}
          {status === 'ready' &&
            (pets.length === 0 ? (
              <div className="diary-empty">
                <p>No pets to check in on yet.</p>
                <Link className="btn primary" to="/adopt">Browse the neighborhood</Link>
              </div>
            ) : (
              pets.map((entry) => (
                <PetSection
                  key={entry.application._id}
                  entry={entry}
                  saved={savedFor === entry.application._id}
                  onFill={(e, checkIn) => {
                    setSavedFor(null)
                    setFilling({ entry: e, checkIn })
                  }}
                />
              ))
            ))}
        </div>
      </Window>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt'), hideOnSmall: true },
          { id: 'apps', label: 'Applications', onClick: () => navigate('/applications'), hideOnSmall: true },
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />

      {filling && (
        <CheckInForm
          pet={applicationPet(filling.entry.application)}
          checkIn={filling.checkIn}
          onClose={() => setFilling(null)}
          onSaved={() => onSaved(filling.entry.application._id)}
        />
      )}
    </div>
  )
}

// /checkins (behind RequireAuth): PET_DIARY.EXE, adopters only. Shelters get their check-ins view instead.
export default function CheckInsPage() {
  const { user } = useAuth()
  if (user.role !== 'adopter') return <Navigate to="/shelter/checkins" replace />
  return <Diary />
}
