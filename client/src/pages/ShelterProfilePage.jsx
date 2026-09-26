import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetCard from '../components/pets/PetCard.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import ProfileWindow from '../components/pets/ProfileWindow.jsx'
import MessageButton from '../components/messages/MessageButton.jsx'
import { RatingSummary, Stars } from '../components/shelters/Stars.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { getAdoptionHistory, getProfile, getReviews } from '../api/users.js'
import { getAnimals, petLook } from '../api/animals.js'
import { messagesTaskLabel } from '../utils/messages.js'
import { formatLong, formatMonth } from '../utils/dates.js'
import { firstName } from '../utils/auth.js'
import { profileTask } from '../utils/shelters.js'
import './ShelterProfilePage.css'

// Properties-dialog tabs; the URL hash picks one (#reviews), so any tab can be linked to.
const TABS = [
  { id: 'general', label: 'GENERAL' },
  { id: 'pets', label: 'PETS' },
  { id: 'reviews', label: 'REVIEWS' },
  { id: 'history', label: 'HISTORY' },
]
const REVIEWS_PAGE = 10

// The shelter's public profile and its placements (the GENERAL stats, HISTORY and the pet each review is about).
// status: 'loading' | 'ready' | 'missing' | 'error'. A user who isn't a shelter counts as missing.
function useShelter(id) {
  const [load, setLoad] = useState({ id: null, status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    const options = { signal: ctrl.signal }
    Promise.all([getProfile(id, options), getAdoptionHistory(id, options)])
      .then(([profile, history]) =>
        setLoad(profile.role === 'shelter' ? { id, status: 'ready', profile, history } : { id, status: 'missing' }),
      )
      .catch((err) => {
        if (err.name === 'AbortError') return
        // 400: not an id at all; 403: an adopter's (private) history; 404: nobody
        setLoad({ id, status: [400, 403, 404].includes(err.status) ? 'missing' : 'error' })
      })
    return () => ctrl.abort()
  }, [id, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...(load.id === id ? load : { status: 'loading' }), retry }
}

// Fetches once, the first time its tab is shown. status: 'idle' | 'loading' | 'ready' | 'error'.
function useWhenShown(active, fetcher) {
  const [load, setLoad] = useState({ status: 'idle' })
  const [attempt, setAttempt] = useState(0)
  const [shown, setShown] = useState(active)
  if (active && !shown) setShown(true)

  useEffect(() => {
    if (!shown) return
    const ctrl = new AbortController()
    fetcher({ signal: ctrl.signal })
      .then((data) => setLoad({ status: 'ready', data }))
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error' })
      })
    return () => ctrl.abort()
  }, [shown, fetcher, attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])
  return { ...load, status: shown && load.status === 'idle' ? 'loading' : load.status, retry }
}

function General({ profile, history, isOwn, canMessage }) {
  const adopted = history.filter((h) => h.type === 'adoption').length
  const fostered = history.filter((h) => h.type === 'foster').length
  const website = /^https?:\/\//i.test(profile.website || '') ? profile.website : ''

  return (
    <div className="sp-general">
      <p className="sp-about">{profile.about || 'This shelter hasn’t written about itself yet.'}</p>

      <dl className="sp-props">
        {website && (
          <div>
            <dt>WEBSITE</dt>
            <dd><a href={website} target="_blank" rel="noopener noreferrer">{website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}</a></dd>
          </div>
        )}
        <div>
          <dt>MEMBER SINCE</dt>
          <dd>{formatMonth(profile.memberSince)}</dd>
        </div>
      </dl>

      <dl className="sp-stats">
        <div><dt>AVAILABLE NOW</dt><dd>{profile.stats?.availableCount ?? 0}</dd></div>
        <div><dt>ADOPTED</dt><dd>{adopted}</dd></div>
        <div><dt>FOSTERED</dt><dd>{fostered}</dd></div>
      </dl>

      {canMessage && (
        <div className="sp-actions">
          <MessageButton variant="primary" to={{ recipientId: profile.id }}>Message this shelter</MessageButton>
        </div>
      )}
      {isOwn && (
        <p className="sp-own">
          This is how adopters see your shelter. Your email and phone number aren&apos;t shown.
        </p>
      )}
    </div>
  )
}

function Pets({ load, onOpen }) {
  if (load.status === 'error') return <ErrorDialog message="COULDN'T LOAD THIS SHELTER'S PETS." okLabel="Retry" onOk={load.retry} />
  if (load.status !== 'ready') return <LoadingWindow label="Fetching this shelter's pets" />
  if (!load.data.length) return <p className="sp-empty">No pets up for adoption or foster right now.</p>
  return (
    <div className="sp-pets">
      {load.data.map((p) => <PetCard key={p.id} pet={p} detail={p.area} onOpen={() => onOpen(p)} />)}
    </div>
  )
}

// Newest first, REVIEWS_PAGE at a time; "Load more" adds the next page under them.
function Reviews({ shelterId, active, petFor }) {
  const [pages, setPages] = useState({ status: 'idle', reviews: [], page: 0, totalPages: 0 })
  const [more, setMore] = useState({ busy: false, error: '' })
  const [attempt, setAttempt] = useState(0)
  const [shown, setShown] = useState(active)
  if (active && !shown) setShown(true)
  // index of the first review "Load more" added: it takes focus
  const [newFrom, setNewFrom] = useState(null)
  const firstNewRef = useRef(null)

  useEffect(() => {
    if (!shown) return
    const ctrl = new AbortController()
    getReviews(shelterId, { page: 1, limit: REVIEWS_PAGE }, { signal: ctrl.signal })
      .then((r) => setPages({ status: 'ready', reviews: r.reviews, page: 1, totalPages: r.totalPages }))
      .catch((err) => {
        if (err.name !== 'AbortError') setPages((p) => ({ ...p, status: 'error' }))
      })
    return () => ctrl.abort()
  }, [shown, shelterId, attempt])

  useEffect(() => {
    if (newFrom != null) firstNewRef.current?.focus()
  }, [newFrom])

  async function loadMore() {
    setMore({ busy: true, error: '' })
    try {
      const r = await getReviews(shelterId, { page: pages.page + 1, limit: REVIEWS_PAGE })
      setNewFrom(pages.reviews.length)
      setPages((p) => {
        // a review added meanwhile shifts the pages: skip any we already have
        const seen = new Set(p.reviews.map((x) => x._id))
        return { ...p, reviews: [...p.reviews, ...r.reviews.filter((x) => !seen.has(x._id))], page: r.page, totalPages: r.totalPages }
      })
      setMore({ busy: false, error: '' })
    } catch (err) {
      setMore({ busy: false, error: err.message })
    }
  }

  if (pages.status === 'error') {
    const retry = () => {
      setPages((p) => ({ ...p, status: 'idle' }))
      setAttempt((n) => n + 1)
    }
    return <ErrorDialog message="COULDN'T LOAD THE REVIEWS." okLabel="Retry" onOk={retry} />
  }
  if (pages.status !== 'ready') return <LoadingWindow label="Fetching reviews" />
  if (!pages.reviews.length) return <p className="sp-empty">No reviews yet.</p>

  return (
    <div className="sp-reviews">
      <ol className="sp-review-list">
        {pages.reviews.map((r, i) => {
          const pet = petFor(r.application)
          return (
            <li key={r._id} ref={i === newFrom ? firstNewRef : undefined} tabIndex={i === newFrom ? -1 : undefined}>
              <div className="sp-review-head">
                <b>{firstName(r.reviewer?.name || 'Former adopter')}</b>
                <Stars rating={r.rating} scale={1.5} />
                <span className="sr-only">{`${r.rating} out of 5 stars`}</span>
                <time dateTime={r.createdAt}>{formatLong(r.createdAt)}</time>
              </div>
              {r.comment && <p>{r.comment}</p>}
              {pet && <p className="sp-review-pet">{`${pet.type === 'foster' ? 'Fostered' : 'Adopted'} ${pet.name}`}</p>}
            </li>
          )
        })}
      </ol>
      {pages.page < pages.totalPages && (
        <div className="sp-more">
          <Button onClick={loadMore} disabled={more.busy}>{more.busy ? 'LOADING...' : 'Load more'}</Button>
          {more.error && <p className="sp-more-err" role="alert">{more.error}</p>}
        </div>
      )}
    </div>
  )
}

function History({ history }) {
  if (!history.length) return <p className="sp-empty">No adoptions or fosters yet.</p>
  return (
    <ol className="sp-history">
      {history.map((h) => {
        const pet = h.animal?._id ? petLook(h.animal) : petLook({ _id: h._id, name: 'Unknown pet', species: 'other' })
        return (
          <li key={h._id}>
            <PetFace pet={pet} size={44} />
            <b>{pet.name}</b>
            <span className="type-tag">{h.type === 'foster' ? 'Fostered' : 'Adopted'}</span>
            {h.decidedAt && <time dateTime={h.decidedAt}>{formatMonth(h.decidedAt)}</time>}
          </li>
        )
      })}
    </ol>
  )
}

function Tabs({ tab, onPick }) {
  const refs = useRef({})
  function onKeyDown(e) {
    const i = TABS.findIndex((t) => t.id === tab)
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const to = TABS[(next + TABS.length) % TABS.length].id
    onPick(to)
    refs.current[to]?.focus()
  }
  return (
    <div className="sp-tabs" role="tablist" aria-label="Shelter details" onKeyDown={onKeyDown}>
      {TABS.map((t) => (
        <button
          key={t.id}
          ref={(el) => (refs.current[t.id] = el)}
          type="button"
          role="tab"
          id={`sp-tab-${t.id}`}
          aria-selected={tab === t.id}
          aria-controls={`sp-panel-${t.id}`}
          tabIndex={tab === t.id ? 0 : -1}
          onClick={() => onPick(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function Profile({ id, profile, history, tab, onPick }) {
  const { user } = useAuth()
  const location = useLocation()
  const isOwn = user?.id === id
  // adopters (and visitors, who log in first) can write to the shelter, like on a pet's profile
  const canMessage = !isOwn && (!user || user.role === 'adopter')
  // { pet, key }: the pet's profile window, open until the next navigation (its shelter link, say)
  const [opened, setOpened] = useState(null)
  const openPet = opened?.key === location.key ? opened.pet : null

  const fetchPets = useCallback(
    (options) => getAnimals({}, options).then((pets) => pets.filter((p) => String(p.shelterId) === String(id))),
    [id],
  )
  const pets = useWhenShown(tab === 'pets', fetchPets)

  // application id → { name, type }, so each review can say which pet it was about
  const petFor = useCallback(
    (applicationId) => {
      const h = history.find((x) => String(x._id) === String(applicationId))
      return h?.animal ? { name: h.animal.name, type: h.type } : null
    },
    [history],
  )

  const area = [profile.location?.city, profile.location?.state].filter(Boolean).join(', ')

  return (
    <>
      <Tabs tab={tab} onPick={onPick} />
      <div className="sp-sheet">
        <header className="sp-head">
          <div className="sp-mark" aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</div>
          <div className="sp-head-main">
            <h2>{profile.name}</h2>
            {area && <p className="sub">{area}</p>}
            <div className="sp-badges">
              {profile.isVerified ? (
                <span className="sp-badge mint">VERIFIED</span>
              ) : isOwn ? (
                <Link className="sp-badge sun" to="/shelter/verification">Not verified yet</Link>
              ) : (
                <span className="sp-badge sun">Not verified yet</span>
              )}
              <RatingSummary rating={profile.rating} count={profile.ratingCount} />
            </div>
          </div>
        </header>

        {TABS.map((t) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`sp-panel-${t.id}`}
            aria-labelledby={`sp-tab-${t.id}`}
            hidden={tab !== t.id}
            className={`sp-panel sp-panel-${t.id}`}
            tabIndex={0}
          >
            {t.id === 'general' && <General profile={profile} history={history} isOwn={isOwn} canMessage={canMessage} />}
            {t.id === 'pets' && <Pets load={pets} onOpen={(pet) => setOpened({ pet, key: location.key })} />}
            {t.id === 'reviews' && <Reviews shelterId={id} active={tab === 'reviews'} petFor={petFor} />}
            {t.id === 'history' && <History history={history} />}
          </div>
        ))}
      </div>

      {openPet && (
        <ProfileWindow
          key={openPet.id}
          pet={openPet}
          onClose={() => setOpened(null)}
          fallbackFocus={() => document.getElementById('sp-tab-pets')}
        />
      )}
    </>
  )
}

// /shelters/:id (public): <SHELTER NAME>.INFO, a Properties dialog with GENERAL · PETS · REVIEWS · HISTORY.
export default function ShelterProfilePage() {
  const { id } = useParams()
  const { user, logout, loading: authLoading } = useAuth()
  const { count: unread } = useUnread()
  const navigate = useNavigate()
  const location = useLocation()
  const shelter = useShelter(id)
  const checkInsTask = useCheckInsTask(navigate)
  const tab = TABS.find((t) => `#${t.id}` === location.hash)?.id || 'general'
  const pick = (next) => navigate({ hash: `#${next}` }, { replace: true })
  const isOwn = user?.id === id

  const title = shelter.status === 'ready' ? `${shelter.profile.name.toUpperCase()}.INFO` : 'SHELTER.INFO'

  return (
    <div className="desk sp-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <Window title={title} barColor="sun" className="sp" aria-label={shelter.status === 'ready' ? `${shelter.profile.name} profile` : 'Shelter profile'}>
        {shelter.status === 'ready' ? (
          <Profile id={id} profile={shelter.profile} history={shelter.history} tab={tab} onPick={pick} />
        ) : (
          <div className="sp-waiting">
            {shelter.status === 'loading' && <LoadingWindow label="Opening the shelter's profile" />}
            {shelter.status === 'error' && <ErrorDialog message="COULDN'T LOAD THIS SHELTER." okLabel="Retry" onOk={shelter.retry} />}
            {shelter.status === 'missing' && (
              <ErrorDialog message="WE COULDN'T FIND THAT SHELTER." onOk={() => navigate('/adopt')} />
            )}
          </div>
        )}
      </Window>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt') },
          ...(user
            ? [
                user.role === 'adopter'
                  ? { id: 'apps', label: 'Applications', onClick: () => navigate('/applications'), hideOnSmall: true }
                  : { id: 'mypets', label: 'My pets', onClick: () => navigate('/shelter/animals'), hideOnSmall: true },
                profileTask(user, navigate, { current: isOwn }),
                checkInsTask,
                { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
                { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
                { id: 'logout', label: 'Log out', onClick: logout },
              ]
            : authLoading
              ? []
              : [{ id: 'login', label: 'Log in', onClick: () => navigate('/login', { state: { from: location } }) }]),
        ]}
      />
    </div>
  )
}
