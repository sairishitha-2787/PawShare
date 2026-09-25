import { useState } from 'react'
import SceneBackdrop from './SceneBackdrop.jsx'
import HouseMarker from '../pets/HouseMarker.jsx'
import Button from '../ui/Button.jsx'
import { LOTS } from './lots.js'
import './Neighborhood.css'

// The map: backdrop plus one house per pet. More pets than lots → page through "streets" of LOTS.length.
export default function Neighborhood({ pets, isDimmed, onOpen }) {
  const [street, setStreet] = useState(0)
  const streets = Math.max(1, Math.ceil(pets.length / LOTS.length))
  const current = Math.min(street, streets - 1)

  const placed = pets
    .slice(current * LOTS.length, (current + 1) * LOTS.length)
    .map((pet, i) => ({ pet, ...LOTS[i] }))
    .sort((a, b) => a.y - b.y) // nearer houses draw on top

  return (
    <div>
      <div className="mapwrap">
        <svg viewBox="0 0 1000 560" role="group" aria-label="Neighborhood map of adoptable pets">
          <SceneBackdrop />
          {placed.map(({ pet, x, y }) => (
            <HouseMarker key={pet.id} pet={pet} x={x} y={y} onOpen={onOpen} dimmed={isDimmed?.(pet) ?? false} />
          ))}
        </svg>
      </div>
      {streets > 1 && (
        <div className="streets">
          <Button onClick={() => setStreet(current - 1)} disabled={current === 0}>
            ← Previous street
          </Button>
          <Button onClick={() => setStreet(current + 1)} disabled={current === streets - 1}>
            Next street →
          </Button>
        </div>
      )}
      <p className="hint">Click a house to open that pet's profile. On a small screen, swipe the map sideways.</p>
    </div>
  )
}
