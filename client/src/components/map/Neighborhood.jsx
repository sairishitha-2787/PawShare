import { useEffect, useMemo, useState } from 'react'
import SceneBackdrop from './SceneBackdrop.jsx'
import HouseMarker from '../pets/HouseMarker.jsx'
import Button from '../ui/Button.jsx'
import { LOTS } from './lots.js'
import { mixHouses, streetOf, streetWithMatch } from '../../utils/streets.js'
import './Neighborhood.css'

// The map: backdrop plus one house per pet. More pets than lots → page through "streets" of LOTS.length.
// children render inside the map box, above the scene (the empty-results ERROR window).
// total: how many pets there are in all, when only some are loaded; onMore() is called when the street
// on screen needs pets that aren't loaded yet.
// isDimmed(pet) greys out pets a client-side filter leaves out; when the filter changes and nothing on the
// street matches, the map jumps to the first street that has a match.
// Houses are placed in mixHouses order (dog, cat, bird, hutch, ...) so every street gets a mix of types.
// openId: the pet whose profile is open; when it changes (or its pet loads), the map shows that pet's street.
export default function Neighborhood({ pets: listed, total = listed.length, onMore, isDimmed, openId, onOpen, children }) {
  const pets = useMemo(() => mixHouses(listed), [listed])
  const [street, setStreet] = useState(0)
  const streets = Math.max(1, Math.ceil(Math.max(total, pets.length) / LOTS.length))
  const matches = (pet) => !isDimmed?.(pet)
  const matchKey = isDimmed ? pets.filter(matches).map((p) => p.id).join() : ''
  const [seenKey, setSeenKey] = useState(matchKey)
  if (matchKey !== seenKey) {
    setSeenKey(matchKey)
    setStreet(streetWithMatch(pets, matches, Math.min(street, streets - 1), LOTS.length))
  }
  const openStreet = openId ? streetOf(pets, openId, LOTS.length) : -1
  const [seenOpen, setSeenOpen] = useState(null)
  if ((openId ?? null) !== seenOpen && (openStreet !== -1 || !openId)) {
    setSeenOpen(openId ?? null)
    if (openStreet !== -1) setStreet(openStreet)
  }
  const current = Math.min(street, streets - 1)
  const needMore = pets.length < total && (current + 1) * LOTS.length > pets.length

  useEffect(() => {
    if (needMore) onMore?.()
  }, [needMore, onMore])

  const placed = pets
    .slice(current * LOTS.length, (current + 1) * LOTS.length)
    .map((pet, i) => ({ pet, ...LOTS[i] }))

  return (
    <div>
      <div className="mapwrap">
        <svg viewBox="0 0 1000 560" role="group" aria-label="Neighborhood map of adoptable pets">
          <SceneBackdrop />
          {placed.map(({ pet, x, y }) => (
            <HouseMarker key={pet.id} pet={pet} x={x} y={y} onOpen={onOpen} dimmed={isDimmed?.(pet) ?? false} />
          ))}
        </svg>
        {children}
      </div>
      {streets > 1 && (
        <div className="streets">
          <Button onClick={() => setStreet(current - 1)} disabled={current === 0}>
            ← Previous street
          </Button>
          <span className="street-no" aria-live="polite">STREET {current + 1} OF {streets}</span>
          <Button onClick={() => setStreet(current + 1)} disabled={current === streets - 1}>
            Next street →
          </Button>
        </div>
      )}
      <p className="hint">Click a house to open that pet's profile. On a small screen, swipe the map sideways.</p>
    </div>
  )
}
