import { useId, useState } from 'react'
import Window from '../components/ui/Window.jsx'
import Chip from '../components/ui/Chip.jsx'
import SegToggle from '../components/ui/SegToggle.jsx'
import Button from '../components/ui/Button.jsx'
import Pill from '../components/ui/Pill.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import Modal from '../components/ui/Modal.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import HouseMarker from '../components/pets/HouseMarker.jsx'
import { mockPets } from '../data/mockPets.js'
import './DevKit.css'

const pet = (id) => mockPets.find((p) => p.id === id)
// one pet per species; peanut is the only guinea pig
const FACES = ['biscuit', 'mochi', 'clover', 'peanut'].map(pet)
// a stand-in photo so the photoUrl branch (clipped to the same circle) is visible without a network call
const PHOTO_PET = {
  ...pet('luna'),
  photoUrl: 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" fill="#8FB8F0"/><rect y="30" width="60" height="30" fill="#E9668E"/></svg>',
  ),
}
// houses on one ground line; pepper is shown dimmed (filtered out)
const HOUSES = [
  { id: 'biscuit', x: 90 },
  { id: 'mochi', x: 230 },
  { id: 'clover', x: 370 },
  { id: 'pepper', x: 510, dimmed: true },
]

const SPECIES = [
  { value: 'all', label: 'All' },
  { value: 'dog', label: 'Dogs' },
  { value: 'cat', label: 'Cats' },
  { value: 'small', label: 'Small pets' },
]

export default function DevKit() {
  const [species, setSpecies] = useState('all')
  const [view, setView] = useState('map')
  const [showError, setShowError] = useState(true)
  const [opened, setOpened] = useState(null)
  // /dev/kit#modal opens the modal on load, handy for screenshots
  const [modalOpen, setModalOpen] = useState(() => window.location.hash === '#modal')
  const titleId = useId()

  return (
    <div className="desk">
      <h1 className="kit-h">DEV KIT · UI COMPONENTS</h1>

      <h2 className="kit-h">WINDOW</h2>
      <div className="kit-grid">
        <Window title="LAVENDER.TXT"><p className="kit-body">Default title bar.</p></Window>
        <Window title="PINK.TXT" barColor="pink"><p className="kit-body">barColor pink.</p></Window>
        <Window title="MINT.TXT" barColor="mint"><p className="kit-body">barColor mint.</p></Window>
        <Window title="SUN.TXT" barColor="sun"><p className="kit-body">barColor sun.</p></Window>
        <Window title="closable.profile" onClose={() => {}}><p className="kit-body">onClose shows the X (lowercase title, uppercased by CSS).</p></Window>
        <Window title="NO-DOTS.TXT" dots={false}><p className="kit-body">dots=false.</p></Window>
      </div>

      <h2 className="kit-h">CHIP · SEGTOGGLE · BUTTON · PILL</h2>
      <Window title="CONTROLS.EXE">
        <div className="kit-row">
          <div className="kit-row" style={{ padding: 0, gap: 8 }} role="group" aria-label="Species">
            {SPECIES.map((s) => (
              <Chip key={s.value} pressed={species === s.value} onClick={() => setSpecies(s.value)}>{s.label}</Chip>
            ))}
          </div>
          <SegToggle
            options={[{ value: 'map', label: 'Map' }, { value: 'list', label: 'Full list' }]}
            value={view}
            onChange={setView}
          />
        </div>
        <div className="kit-row">
          <Button>Default</Button>
          <Button variant="primary">Primary</Button>
        </div>
        <div className="kit-row">
          <Pill status="available" />
          <Pill status="urgent" />
          <Pill status="pending" />
        </div>
      </Window>

      <h2 className="kit-h">ERRORDIALOG · MODAL</h2>
      <Window title="DIALOGS.EXE">
        <div className="kit-row">
          <Button onClick={() => setShowError(true)}>Show error</Button>
          <Button variant="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
        </div>
        <div className="kit-stage">
          {showError && <ErrorDialog message="NO CATS NEED AN URGENT FOSTER RIGHT NOW." onOk={() => setShowError(false)} />}
        </div>
      </Window>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} labelledBy={titleId}>
        <Window as="div" title="MOCHI.PROFILE" onClose={() => setModalOpen(false)} closeLabel="Close profile">
          <div className="kit-modal">
            <h2 id={titleId}>Mochi</h2>
            <p>Esc, the X, or a click on the dim background closes this. Tab stays inside.</p>
            <div className="kit-row" style={{ padding: 0 }}>
              <Button variant="primary">Offer to foster</Button>
              <Button aria-pressed="false">♡ Add to favorites</Button>
            </div>
          </div>
        </Window>
      </Modal>

      <h2 className="kit-h">PETFACE · HOUSE · PIN</h2>
      <Window title="PETS.SVG" barColor="mint">
        <div className="kit-row">
          {FACES.map((p) => <PetFace key={p.id} pet={p} size={64} />)}
          <PetFace pet={PHOTO_PET} size={64} />
        </div>
        <div className="kit-houses">
          <svg viewBox="0 0 600 225" role="group" aria-label="House types">
            {HOUSES.map((h) => (
              <HouseMarker key={h.id} pet={pet(h.id)} x={h.x} y={185} dimmed={h.dimmed} onOpen={setOpened} />
            ))}
          </svg>
        </div>
        <p className="kit-body">Last opened: {opened ?? 'none'}. Hover or Tab to lift a pin; Mochi (urgent) bobs.</p>
      </Window>

      <h2 className="kit-h">TASKBAR</h2>
      <Taskbar
        items={[
          { label: 'Neighborhood.exe' },
          { label: 'Key.txt', hideOnSmall: true },
          { id: 'fav', label: 'Favorites (2)', hideOnSmall: true },
        ]}
      />
    </div>
  )
}
