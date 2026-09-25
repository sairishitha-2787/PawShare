import { useState } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import SegToggle from '../components/ui/SegToggle.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import Neighborhood from '../components/map/Neighborhood.jsx'
import Legend from '../components/map/Legend.jsx'
import PetCard from '../components/pets/PetCard.jsx'
import FavoritesPanel from '../components/pets/FavoritesPanel.jsx'
import ProfileWindow from '../components/pets/ProfileWindow.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { matchesFilter } from '../utils/pets.js'
import { mockPets } from '../data/mockPets.js'
import './AdoptPage.css'

const SPECIES = [
  { value: 'all', label: 'All', word: 'PETS' },
  { value: 'dog', label: 'Dogs', word: 'DOGS' },
  { value: 'cat', label: 'Cats', word: 'CATS' },
  { value: 'small', label: 'Small pets', word: 'SMALL PETS' },
]
const VIEWS = [{ value: 'map', label: 'Map' }, { value: 'list', label: 'Full list' }]

export default function AdoptPage() {
  const pets = mockPets
  const [filter, setFilter] = useState({ species: 'all', urgent: false })
  const { favs } = useFavorites()
  // the view lives in the URL hash (#list) so it survives a refresh
  const { hash } = useLocation()
  const navigate = useNavigate()
  const view = hash === '#list' ? 'list' : 'map'
  const setView = (v) => navigate({ hash: v === 'list' ? '#list' : '' }, { replace: true })

  const matches = (p) => matchesFilter(p, filter)
  const shown = pets.filter(matches)
  const noneWord = SPECIES.find((s) => s.value === filter.species).word

  // the open profile lives in the URL too: /adopt/:petId (keeps #list if it's there)
  const petId = useMatch('/adopt/:petId')?.params.petId
  const profilePet = pets.find((p) => p.id === petId)
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
            {shown.length === 0 && (
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
          {shown.length ? (
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
        ]}
      />

      {profilePet && <ProfileWindow key={profilePet.id} pet={profilePet} onClose={closePet} fallbackFocus={houseFor(profilePet.id)} />}
    </div>
  )
}
