import { useId, useState } from 'react'
import { Link, Navigate, useMatch, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import Pill from '../components/ui/Pill.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import ApplicationDetail from '../components/apply/ApplicationDetail.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { messagesTaskLabel } from '../utils/messages.js'
import { useMyApplications } from '../hooks/useMyApplications.js'
import { applicationPet, canApplyAgain, isActive } from '../api/applications.js'
import { APP_STATUSES, APP_STATUS_COLOR, APP_STATUS_LABEL, TYPE_LABEL, applicationsTaskLabel } from '../utils/applications.js'
import { formatShort } from '../utils/dates.js'
import { firstName } from '../utils/auth.js'
import './ApplicationsPage.css'

const FILTERS = ['all', ...APP_STATUSES]
const FILTER_LABEL = { all: 'All', ...APP_STATUS_LABEL }

// One application, styled like a file in a folder. The whole row is a button that opens the detail.
function FileRow({ application, onOpen }) {
  const pet = applicationPet(application)
  const { status } = application
  return (
    <li>
      <button type="button" className="file" data-app-id={application._id} onClick={() => onOpen(application._id)}>
        <PetFace pet={pet} size={40} />
        <span className="file-main">
          <span className="file-name">{`${pet.name}.APP`}</span>
          <span className="file-meta">
            <span className="type-tag">{TYPE_LABEL[application.type]}</span>
            <span>{application.shelter?.name || 'Unknown shelter'}</span>
            <span>{`Sent ${formatShort(application.createdAt)}`}</span>
          </span>
        </span>
        <Pill label={APP_STATUS_LABEL[status]} color={APP_STATUS_COLOR[status]} />
      </button>
    </li>
  )
}

// /applications/:id for an id that isn't one of yours (or doesn't exist)
function Missing({ onClose }) {
  const msgId = useId()
  return (
    <Modal open onClose={onClose} labelledBy={msgId}>
      <Window as="div" title="ERROR" barColor="pink" onClose={onClose} closeLabel="Close">
        <div className="app-missing">
          <p id={msgId}>WE COULDN&apos;T FIND THAT APPLICATION.</p>
          <Button onClick={onClose}>OK</Button>
        </div>
      </Window>
    </Modal>
  )
}

function MyApplications() {
  const { user, logout } = useAuth()
  const { count: unread } = useUnread()
  const navigate = useNavigate()
  const { status, applications, retry, refresh, patch } = useMyApplications()
  const checkInsTask = useCheckInsTask(navigate)
  const [filter, setFilter] = useState('all')

  const counts = { all: applications.length }
  for (const s of APP_STATUSES) counts[s] = applications.filter((a) => a.status === s).length
  const shown = filter === 'all' ? applications : applications.filter((a) => a.status === filter)

  // the open application lives in the URL: /applications/:id
  const openId = useMatch('/applications/:id')?.params.id
  const open = status === 'ready' && openId ? applications.find((a) => a._id === openId) : null
  const missing = status === 'ready' && openId && !open
  const openApp = (id) => navigate(`/applications/${encodeURIComponent(id)}`)
  const close = () => navigate('/applications', { replace: true })
  // if its row is filtered out by close time, focus the first row (or the folder) instead
  const rowFor = (id) => () =>
    document.querySelector(`.file[data-app-id="${CSS.escape(id)}"]`) || document.querySelector('.file, .apps-chips .chip')

  // "Apply again" only if there isn't already a newer active application for the same pet
  const reapplyable = (app) =>
    canApplyAgain(app) && !applications.some((a) => a.animal?._id === app.animal?._id && isActive(a))

  return (
    <div className="desk apps-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <Window title="MY_APPLICATIONS/" barColor="pink" className="apps" aria-label="My applications">
        {status === 'ready' && applications.length > 0 && (
          <div className="apps-chips" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <Chip key={f} pressed={filter === f} onClick={() => setFilter(f)}>
                {`${FILTER_LABEL[f]} (${counts[f]})`}
              </Chip>
            ))}
          </div>
        )}

        <div className={status === 'ready' ? 'apps-main' : 'apps-main waiting'}>
          {status === 'loading' && <LoadingWindow label="Opening your applications" />}
          {status === 'error' && <ErrorDialog message="COULDN'T LOAD YOUR APPLICATIONS." okLabel="Retry" onOk={retry} />}
          {status === 'ready' &&
            (applications.length === 0 ? (
              <div className="apps-empty">
                <p>No applications yet.</p>
                <Link className="btn primary" to="/adopt">Browse the neighborhood</Link>
              </div>
            ) : shown.length === 0 ? (
              <p className="apps-none">{`No ${FILTER_LABEL[filter].toLowerCase()} applications.`}</p>
            ) : (
              <ul className="files" aria-label={`${FILTER_LABEL[filter]} applications`}>
                {shown.map((a) => <FileRow key={a._id} application={a} onOpen={openApp} />)}
              </ul>
            ))}
        </div>
      </Window>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt') },
          { id: 'apps', label: applicationsTaskLabel(status === 'ready' ? counts.pending : null) },
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />

      {open && (
        <ApplicationDetail
          key={open._id}
          application={open}
          canReapply={reapplyable(open)}
          onClose={close}
          onWithdrawn={(updated) => {
            // show it straight away, then fetch the list again (the pet's status may have changed too)
            patch(updated._id, { status: updated.status, decidedAt: updated.decidedAt })
            refresh()
          }}
          onWithdrawFailed={refresh}
          fallbackFocus={rowFor(open._id)}
        />
      )}
      {missing && <Missing onClose={close} />}
    </div>
  )
}

// /applications and /applications/:id (behind RequireAuth): MY_APPLICATIONS/, adopters only.
// Shelter accounts get their incoming applications instead.
export default function ApplicationsPage() {
  const { user } = useAuth()
  if (user.role !== 'adopter') return <Navigate to="/shelter/applications" replace />
  return <MyApplications />
}
