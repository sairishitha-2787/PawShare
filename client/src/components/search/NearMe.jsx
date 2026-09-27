import Chip from '../ui/Chip.jsx'
import Button from '../ui/Button.jsx'
import { AREAS, RADII } from '../../utils/geo.js'
import './Search.css'

// The toolbar toggle (nearMe comes from hooks/useNearMe.js). On: turns Near me off. Off: asks for the location (or closes the picker if it's open).
export function NearMeToggle({ near, nearMe, onOff }) {
  const onClick = () => {
    if (near) onOff()
    else if (nearMe.mode === 'picking') nearMe.cancel()
    else if (nearMe.mode === 'idle') nearMe.locate()
  }
  return (
    <Chip pressed={Boolean(near)} onClick={onClick} aria-busy={nearMe.mode === 'locating' || undefined}>
      {nearMe.mode === 'locating' ? 'Locating...' : 'Near me'}
    </Chip>
  )
}

// The row under the toolbar: the area picker, or where "near" is plus the radius chips.
export function NearRow({ near, radius, nearMe, onRadius }) {
  if (nearMe.mode === 'picking') {
    return (
      <div className="subrow" role="group" aria-label="Pick an area">
        <span>{nearMe.reason && `${nearMe.reason} `}Pick an area:</span>
        <div className="chips">
          {AREAS.map((a) => (
            <Chip key={a.key} pressed={near?.key === a.key} onClick={() => nearMe.pick(a.key)}>{a.label}</Chip>
          ))}
          {/* opened with Change, not after a failed attempt: the browser location is still worth a try */}
          {!nearMe.reason && <Chip onClick={nearMe.locate}>My location</Chip>}
        </div>
        <Button onClick={nearMe.cancel}>Cancel</Button>
      </div>
    )
  }
  if (!near) return null
  return (
    <div className="subrow">
      <span>
        Near <b>{near.label}</b>
      </span>
      <Button onClick={() => nearMe.openPicker()}>Change</Button>
      <div className="chips" role="group" aria-label="Distance">
        {RADII.map((r) => (
          <Chip key={r} pressed={radius === r} onClick={() => onRadius(r)}>{`${r} km`}</Chip>
        ))}
      </div>
    </div>
  )
}
