import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useMatch, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import { ListingsIcon, ReviewsIcon, VerifyIcon } from '../components/admin/PanelIcons.jsx'
import VerificationSection from '../components/admin/VerificationSection.jsx'
import ReviewsSection from '../components/admin/ReviewsSection.jsx'
import ListingsSection from '../components/admin/ListingsSection.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { useAdmin, useAdminTask } from '../context/AdminContext.jsx'
import { useReceivedApplications } from '../hooks/useReceivedApplications.js'
import { useLoad } from '../hooks/useLoad.js'
import { getAllAnimals, getShelters } from '../api/admin.js'
import { getReviews } from '../api/users.js'
import { messagesTaskLabel } from '../utils/messages.js'
import { inboxTaskLabel } from '../utils/applications.js'
import { firstName } from '../utils/auth.js'
import { SECTIONS, SECTION_TITLE, plural, verificationLabel, verifyStatusOf } from '../utils/admin.js'
import './AdminPage.css'

const fetchShelters = (options) => getShelters(undefined, options)

// "3" once known, "..." while loading, "?" if it failed
const shown = (load, value) => (load.status === 'ready' ? String(value) : load.status === 'error' ? '?' : '...')

// Review counts for the approved shelters → Map(id → { count }). One small request per shelter (limit 1):
// the server has no "all reviews" endpoint.
function useReviewStats(shelterIds, enabled) {
  const key = shelterIds.join(',')
  const fetchStats = useCallback(
    async (options) => {
      const ids = key ? key.split(',') : []
      const results = await Promise.all(ids.map((id) => getReviews(id, { limit: 1 }, options)))
      return new Map(ids.map((id, i) => [id, { count: results[i].total, rating: results[i].rating }]))
    },
    [key],
  )
  return useLoad(fetchStats, enabled)
}

function Summary({ shelters, animals, apps }) {
  const list = shelters.data || []
  const tiles = [
    ['Waiting for verification', shown(shelters, list.filter((s) => verifyStatusOf(s) === 'pending').length)],
    ['Verified shelters', shown(shelters, list.filter((s) => verifyStatusOf(s) === 'approved').length)],
    ['Listings', shown(animals, animals.data?.length)],
    ['Placed pets', shown(apps, apps.applications.filter((a) => a.status === 'approved').length)],
  ]
  return (
    <dl className="cp-summary">
      {tiles.map(([label, value]) => (
        <div key={label} className="cp-stat">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// The icon grid. counts: { verification, reviews, listings } (null while loading). iconRefs: for focus on the way back.
function IconGrid({ counts, onOpen, iconRefs }) {
  const icons = {
    verification: { Art: VerifyIcon, label: verificationLabel(counts.verification) },
    reviews: { Art: ReviewsIcon, label: 'Reviews', sr: counts.reviews === null ? '' : `, ${plural(counts.reviews, 'review')}` },
    listings: { Art: ListingsIcon, label: 'Listings', sr: counts.listings === null ? '' : `, ${plural(counts.listings, 'listing')}` },
  }
  return (
    <ul className="cp-icons" aria-label="Control panel">
      {SECTIONS.map((id) => {
        const { Art, label, sr } = icons[id]
        const count = counts[id]
        return (
          <li key={id}>
            <button
              type="button"
              className="cp-icon"
              ref={(el) => {
                iconRefs.current[id] = el
              }}
              onClick={() => onOpen(id)}
            >
              <span className="cp-art">
                <Art />
                {count !== null && <span className="cp-badge" aria-hidden="true">{count}</span>}
              </span>
              <span className="cp-label">
                {label}
                {sr && <span className="sr-only">{sr}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// LOADING... / ERROR (with Retry) for a section whose data isn't here yet
function Wait({ load, label, error }) {
  return (
    <div className="cp-wait">
      {load.status === 'error' ? <ErrorDialog message={error} okLabel="Retry" onOk={load.retry} /> : <LoadingWindow label={label} />}
    </div>
  )
}

function ControlPanel() {
  const { user, logout } = useAuth()
  const { count: unread } = useUnread()
  const { refresh: refreshWaiting } = useAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const checkInsTask = useCheckInsTask(navigate)
  const adminTask = useAdminTask(navigate, { current: true })

  const param = useMatch('/admin/:section')?.params.section
  const section = SECTIONS.includes(param) ? param : null

  const shelters = useLoad(fetchShelters)
  const animals = useLoad(getAllAnimals)
  const apps = useReceivedApplications()
  const approved = useMemo(
    () => (shelters.data || []).filter((s) => verifyStatusOf(s) === 'approved'),
    [shelters.data],
  )
  const reviewStats = useReviewStats(approved.map((s) => s._id), shelters.status === 'ready')
  const petNames = useMemo(
    () => new Map(apps.applications.map((a) => [String(a._id), a.animal?.name])),
    [apps.applications],
  )

  // "Saved Kiwi." after the editor, opened from Listings, sends the admin back here
  const [done, setDone] = useState(() => (location.state?.saved ? `Saved ${location.state.saved}.` : ''))
  useEffect(() => {
    if (location.state?.saved) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  // opening a section focuses its heading; going back focuses the icon it came from
  const headingRef = useRef(null)
  const iconRefs = useRef({})
  const lastSection = useRef(section)
  useEffect(() => {
    const from = lastSection.current
    lastSection.current = section
    if (from === section) return
    if (section) headingRef.current?.focus()
    else if (from) iconRefs.current[from]?.focus()
  }, [section])

  const waiting = shelters.status === 'ready' ? shelters.data.filter((s) => verifyStatusOf(s) === 'pending').length : null
  const counts = {
    verification: waiting,
    reviews: reviewStats.status === 'ready' ? [...reviewStats.data.values()].reduce((n, s) => n + s.count, 0) : null,
    listings: animals.status === 'ready' ? animals.data.length : null,
  }
  const pendingApps = apps.status === 'ready' ? apps.applications.filter((a) => a.status === 'pending').length : null

  const afterDecision = () => {
    shelters.refresh()
    refreshWaiting()
  }
  const editListing = (id) => navigate(`/shelter/animals/${encodeURIComponent(id)}/edit`, { state: { from: 'admin' } })
  const removedListing = (animal) => {
    animals.update((list) => list.filter((a) => a._id !== animal._id))
    setDone(`Removed ${animal.name}.`)
  }

  let body = null
  if (section === 'verification') {
    body =
      shelters.status === 'ready' ? (
        <VerificationSection shelters={shelters.data} onDecided={afterDecision} />
      ) : (
        <Wait load={shelters} label="Fetching the shelters" error="COULDN'T LOAD THE SHELTERS." />
      )
  } else if (section === 'reviews') {
    body =
      shelters.status === 'ready' ? (
        <ReviewsSection
          shelters={approved}
          stats={reviewStats.status === 'ready' ? reviewStats.data : null}
          petNames={petNames}
          onChanged={reviewStats.refresh}
        />
      ) : (
        <Wait load={shelters} label="Fetching the shelters" error="COULDN'T LOAD THE SHELTERS." />
      )
  } else if (section === 'listings') {
    body =
      animals.status === 'ready' ? (
        <ListingsSection animals={animals.data} apps={apps} onEdit={editListing} onRemoved={removedListing} />
      ) : (
        <Wait load={animals} label="Fetching every listing" error="COULDN'T LOAD THE LISTINGS." />
      )
  }

  return (
    <div className="desk admin-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <div className="admin-stack">
        {section === 'listings' && done && <p className="admin-note" role="status">{done}</p>}

        <Window title="CONTROL_PANEL.EXE" className="cpanel" aria-label="Control panel">
          <Summary shelters={shelters} animals={animals} apps={apps} />

          {section ? (
            <div className="cp-section">
              <div className="cp-nav">
                <Button onClick={() => navigate('/admin')}>
                  <span aria-hidden="true">←</span> Control Panel
                </Button>
                <h2 ref={headingRef} tabIndex={-1}>
                  {section === 'verification' ? verificationLabel(waiting) : SECTION_TITLE[section]}
                </h2>
              </div>
              {body}
            </div>
          ) : param ? (
            <Navigate to="/admin" replace />
          ) : (
            <IconGrid counts={counts} onOpen={(id) => navigate(`/admin/${id}`)} iconRefs={iconRefs} />
          )}
        </Window>
      </div>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt'), hideOnSmall: true },
          adminTask,
          { id: 'inbox', label: inboxTaskLabel(pendingApps), onClick: () => navigate('/shelter/applications'), hideOnSmall: true },
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />
    </div>
  )
}

// Anyone else who finds /admin
function AdminsOnly() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="desk admin-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <div className="cp-wait cp-denied">
        <ErrorDialog message="ADMINS ONLY." onOk={() => navigate('/adopt')} />
      </div>
      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />
    </div>
  )
}

// /admin, /admin/verification, /admin/reviews, /admin/listings (behind RequireAuth): CONTROL_PANEL.EXE, admins only.
export default function AdminPage() {
  const { user } = useAuth()
  return user.role === 'admin' ? <ControlPanel /> : <AdminsOnly />
}
