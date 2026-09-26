import { useCallback, useEffect, useId, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import Pill from '../components/ui/Pill.jsx'
import Modal from '../components/ui/Modal.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import HealthLog from '../components/checkins/HealthLog.jsx'
import MessageButton from '../components/messages/MessageButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { useAdminTask } from '../context/AdminContext.jsx'
import { getReceivedCheckIns } from '../api/checkins.js'
import { petLook } from '../api/animals.js'
import { CONDITION_COLOR, CONDITION_LABEL, groupByApplication, stopState, summarize } from '../utils/checkins.js'
import { messagesTaskLabel } from '../utils/messages.js'
import { formatShort } from '../utils/dates.js'
import { firstName } from '../utils/auth.js'
import { profileTask } from '../utils/shelters.js'
import './ShelterCheckInsPage.css'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'soon', label: 'Due this week' },
  { value: 'ok', label: 'Up to date' },
]

// One row per adoption/foster, most urgent first. status: 'loading' | 'ready' | 'error'
function useAdoptions() {
  const [load, setLoad] = useState({ status: 'loading', rows: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    getReceivedCheckIns(undefined, { signal: ctrl.signal })
      .then((checkIns) => {
        const order = { overdue: 0, soon: 1, ok: 2 }
        const rows = groupByApplication(checkIns)
          .map((g) => ({ ...g, ...summarize(g) }))
          .sort((a, b) => order[a.standing] - order[b.standing] || (a.animal?.name || '').localeCompare(b.animal?.name || ''))
        setLoad({ status: 'ready', rows })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error', rows: [] })
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading', rows: [] })
    setAttempt((n) => n + 1)
  }, [])
  return { ...load, retry }
}

// the animal as PetFace draws it (a deleted animal gets a stand-in)
const rowPet = (row) =>
  row.animal?._id ? petLook(row.animal) : petLook({ _id: row.applicationId, name: 'Unknown pet', species: 'other' })
const adopterName = (row) => row.adopter?.name || 'Unknown adopter'

function nextText(row) {
  if (!row.next) return 'All check-ins done'
  const { state, text } = stopState(row.next)
  return state === 'overdue' ? `${row.next.label}: ${text}` : `Next: ${row.next.label}, ${text.charAt(0).toLowerCase()}${text.slice(1)}`
}

function Row({ row, onOpen }) {
  const pet = rowPet(row)
  const update = row.last?.healthUpdate
  return (
    <li>
      <button type="button" className="ci-row" onClick={() => onOpen(row.applicationId)}>
        <PetFace pet={pet} size={40} />
        <span className="ci-main">
          <span className="ci-pet">{pet.name}</span>
          <span className="ci-adopter">{`with ${adopterName(row)}`}</span>
          <span className="ci-meta">
            {row.last ? (
              <span className="ci-last">
                {`Last update ${formatShort(row.last.completedAt)}`}
                <Pill label={CONDITION_LABEL[update.condition] || update.condition} color={CONDITION_COLOR[update.condition]} />
              </span>
            ) : (
              <span>No updates yet</span>
            )}
            <span>{nextText(row)}</span>
          </span>
        </span>
        {row.standing === 'overdue' && <Pill label="Overdue" color="var(--pink)" />}
      </button>
    </li>
  )
}

// <PET>.LOG: one adoption's HEALTH.LOG, read-only, and a way to message the adopter.
function LogWindow({ row, onClose }) {
  const titleId = useId()
  const pet = rowPet(row)
  return (
    <Modal open onClose={onClose} labelledBy={titleId}>
      <Window as="div" title={`${pet.name.toUpperCase()}.LOG`} barColor="sun" onClose={onClose} closeLabel="Close health log">
        <div className="ci-detail">
          <div className="ci-detail-head">
            <PetFace pet={pet} size={56} />
            <div>
              <h2 id={titleId}>{pet.name}</h2>
              <p>{`With ${adopterName(row)} · ${nextText(row)}`}</p>
            </div>
          </div>
          {row.adopter?._id && (
            <MessageButton variant="primary" to={{ recipientId: row.adopter._id, ...(row.animal?._id && { animalId: row.animal._id }) }}>
              {`Message ${firstName(adopterName(row))}`}
            </MessageButton>
          )}
          <HealthLog entries={row.log} petName={pet.name} />
        </div>
      </Window>
    </Modal>
  )
}

function ShelterCheckIns() {
  const { user, logout } = useAuth()
  const { count: unread } = useUnread()
  const navigate = useNavigate()
  const { status, rows, retry } = useAdoptions()
  const checkInsTask = useCheckInsTask(navigate, { current: true })
  const adminTask = useAdminTask(navigate)
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  const counts = { all: rows.length, overdue: 0, soon: 0, ok: 0 }
  for (const r of rows) counts[r.standing] += 1
  const shown = filter === 'all' ? rows : rows.filter((r) => r.standing === filter)
  const open = openId ? rows.find((r) => r.applicationId === openId) : null

  return (
    <div className="desk ci-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <Window title="CHECKINS.EXE" barColor="sun" className="ci-win" aria-label="Check-ins from adopters">
        {status === 'ready' && rows.length > 0 && (
          <div className="ci-chips" role="group" aria-label="Filter by check-in status">
            {FILTERS.map((f) => (
              <Chip key={f.value} pressed={filter === f.value} onClick={() => setFilter(f.value)}>
                {`${f.label} (${counts[f.value]})`}
              </Chip>
            ))}
          </div>
        )}

        <div className={status === 'ready' ? 'ci-list' : 'ci-list waiting'}>
          {status === 'loading' && <LoadingWindow label="Opening check-ins" />}
          {status === 'error' && <ErrorDialog message="COULDN'T LOAD CHECK-INS." okLabel="Retry" onOk={retry} />}
          {status === 'ready' &&
            (rows.length === 0 ? (
              <p className="ci-empty">No adopted pets yet.</p>
            ) : shown.length === 0 ? (
              <p className="ci-empty">{`No pets are ${FILTERS.find((f) => f.value === filter).label.toLowerCase()}.`}</p>
            ) : (
              <ul className="ci-rows" aria-label="Adopted and fostered pets">
                {shown.map((r) => <Row key={r.applicationId} row={r} onOpen={setOpenId} />)}
              </ul>
            ))}
        </div>
      </Window>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt'), hideOnSmall: true },
          { id: 'mypets', label: 'My pets', onClick: () => navigate('/shelter/animals'), hideOnSmall: true },
          { id: 'inbox', label: 'Inbox', onClick: () => navigate('/shelter/applications'), hideOnSmall: true },
          profileTask(user, navigate),
          adminTask,
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />

      {open && <LogWindow key={open.applicationId} row={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}

// /shelter/checkins (behind RequireAuth): CHECKINS.EXE, shelters and admins. Adopters get their pet diary.
export default function ShelterCheckInsPage() {
  const { user } = useAuth()
  if (user.role === 'adopter') return <Navigate to="/checkins" replace />
  return <ShelterCheckIns />
}
