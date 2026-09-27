import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Pill from '../components/ui/Pill.jsx'
import Button from '../components/ui/Button.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import ShelterLink from '../components/shelters/ShelterLink.jsx'
import {
  AdoptIcon,
  ApplicationsIcon,
  CheckInsIcon,
  ControlPanelIcon,
  DiaryIcon,
  FavoritesIcon,
  InboxIcon,
  LogInIcon,
  MessengerIcon,
  MyPetsIcon,
  ProfileIcon,
  SignUpIcon,
} from '../components/desktop/DesktopIcons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { useTaskCounts } from '../context/TaskCountsContext.jsx'
import { useLoad } from '../hooks/useLoad.js'
import { getAnimals } from '../api/animals.js'
import { mockPets } from '../data/mockPets.js'
import { firstName } from '../utils/auth.js'
import { shelterPath } from '../utils/shelters.js'
import { petOfTheDay, plural } from '../utils/shell.js'
import './DesktopPage.css'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const loadPets = USE_MOCK ? async () => mockPets : (options) => getAnimals({}, options)

// The desktop icons for this visitor: [{ id, label, to, Art, count?, sr? }]. count shows as a pink badge.
function iconsFor(user, loading, counts, favorites) {
  const adopt = { id: 'adopt', label: 'ADOPT.EXE', to: '/adopt', Art: AdoptIcon }
  if (loading && !user) return [adopt]
  if (!user) {
    return [
      adopt,
      { id: 'login', label: 'LOG_IN', to: '/login', Art: LogInIcon },
      { id: 'signup', label: 'SIGN_UP', to: '/signup', Art: SignUpIcon },
    ]
  }
  const messenger = { id: 'msgs', label: 'MESSENGER', to: '/messages', Art: MessengerIcon, count: counts.unread, sr: 'unread' }
  if (user.role === 'adopter') {
    return [
      adopt,
      { id: 'apps', label: 'APPLICATIONS', to: '/applications', Art: ApplicationsIcon, count: counts.applications, sr: 'pending' },
      { id: 'diary', label: 'PET_DIARY', to: '/checkins', Art: DiaryIcon, count: counts.checkIns, sr: 'due' },
      messenger,
      { id: 'favs', label: 'FAVORITES', to: '/adopt#favorites', Art: FavoritesIcon, count: favorites, sr: 'saved' },
    ]
  }
  if (user.role === 'shelter') {
    return [
      adopt,
      { id: 'mypets', label: 'MY_PETS', to: '/shelter/animals', Art: MyPetsIcon },
      { id: 'inbox', label: 'INBOX', to: '/shelter/applications', Art: InboxIcon, count: counts.inbox, sr: 'pending' },
      { id: 'checkins', label: 'CHECKINS', to: '/shelter/checkins', Art: CheckInsIcon, count: counts.checkIns, sr: 'overdue' },
      messenger,
      { id: 'profile', label: 'MY_PROFILE', to: shelterPath(user.id), Art: ProfileIcon },
    ]
  }
  return [adopt, { id: 'admin', label: 'CONTROL_PANEL', to: '/admin', Art: ControlPanelIcon, count: counts.admin, sr: 'waiting' }]
}

// What needs doing, for the welcome line: [{ id, text, to }] (only the counts above zero)
function attentionFor(user, counts) {
  const items = []
  const add = (id, n, text, to) => n > 0 && items.push({ id, text, to })
  if (user.role === 'adopter') {
    add('checkins', counts.checkIns, plural(counts.checkIns, 'check-in') + ' due', '/checkins')
  } else if (user.role === 'shelter') {
    add('inbox', counts.inbox, plural(counts.inbox, 'application') + ' to review', '/shelter/applications')
    add('checkins', counts.checkIns, plural(counts.checkIns, 'overdue check-in'), '/shelter/checkins')
  } else {
    add('admin', counts.admin, plural(counts.admin, 'shelter') + ' waiting for verification', '/admin/verification')
  }
  add('msgs', counts.unread, plural(counts.unread, 'unread message'), '/messages')
  return items
}

function Welcome({ user, counts }) {
  const items = attentionFor(user, counts)
  const known = counts.unread !== null
  return (
    <p className="home-welcome">
      {/* a shelter's name is the organisation's, so it isn't cut to a first name */}
      Welcome back, <b>{user.role === 'shelter' ? user.name : firstName(user.name)}</b>.{' '}
      {items.length > 0 ? (
        <>
          {items.map((item, i) => (
            <Fragment key={item.id}>
              {i > 0 && ', '}
              <Link to={item.to}>{item.text}</Link>
            </Fragment>
          ))}
          .
        </>
      ) : (
        known && 'Nothing needs your attention right now.'
      )}
    </p>
  )
}

function PetOfTheDay({ load }) {
  const pet = load.status === 'ready' ? petOfTheDay(load.data) : null
  return (
    <Window title="PET_OF_THE_DAY.JPG" barColor="pink" className="potd" aria-label="Pet of the day">
      {load.status === 'loading' && <p className="potd-msg">Picking today&apos;s pet...</p>}
      {load.status === 'error' && (
        <div className="potd-msg">
          <p>Couldn&apos;t reach the shelters.</p>
          <Button onClick={load.retry}>Retry</Button>
        </div>
      )}
      {load.status === 'ready' && !pet && <p className="potd-msg">No pets are waiting for a home right now.</p>}
      {pet && (
        <div className="potd-body">
          <PetFace pet={pet} size={132} className="potd-face" />
          <div className="potd-info">
            <h2>{pet.name}</h2>
            <p>{`${pet.age} · ${pet.breed}`}</p>
            <p>
              {pet.area}
              {pet.area && ' · '}
              <ShelterLink id={pet.shelterId} name={pet.shelter} />
            </p>
            <Pill status={pet.status} />
          </div>
          <Link className="btn primary potd-meet" to={`/adopt/${encodeURIComponent(pet.id)}`}>
            Meet {pet.name}
          </Link>
        </div>
      )}
    </Window>
  )
}

// "/": the desktop. Icons down the left (a 3-column grid on small screens), README.TXT and PET_OF_THE_DAY.JPG.
export default function DesktopPage() {
  const { user, loading } = useAuth()
  const counts = useTaskCounts()
  const { favs } = useFavorites()
  const pets = useLoad(loadPets)
  const favorites = pets.status === 'ready' ? pets.data.filter((p) => favs.has(p.id)).length : null
  const icons = iconsFor(user, loading, counts, favorites)

  return (
    <div className="desk home-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <div className="home">
        <nav className="home-nav" aria-label="Desktop">
          <ul className="home-icons">
            {icons.map(({ id, label, to, Art, count, sr }) => (
              <li key={id}>
                <Link className="home-icon" to={to}>
                  <span className="home-art">
                    <Art />
                    {count > 0 && <b className="home-badge" aria-hidden="true">{count}</b>}
                  </span>
                  <span className="home-label">{label}</span>
                  {count > 0 && <span className="sr-only">{`, ${count} ${sr}`}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="home-windows">
          {user && <Welcome user={user} counts={counts} />}
          <Window title="README.TXT" barColor="sun" className="readme" aria-label="About PawShare">
            <div className="readme-body">
              <p>Shelters list the pets in their care, from dogs and cats to birds and hamsters.</p>
              <p>Find them on the neighborhood map, read their profiles and apply to adopt or foster.</p>
              <p>Chat with the shelter, and after the adoption check in so they know your pet is doing well.</p>
              <Link className="btn primary" to="/adopt">Open the neighborhood</Link>
            </div>
          </Window>
          <PetOfTheDay load={pets} />
        </div>
      </div>
    </div>
  )
}
