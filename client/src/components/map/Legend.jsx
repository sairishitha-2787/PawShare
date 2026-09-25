import Window from '../ui/Window.jsx'
import House from '../pets/House.jsx'
import { STATUS_COLOR, houseTypeFor, peakY } from '../../utils/pets.js'
import './Legend.css'

const HOUSES = [
  { type: 'dog', label: 'Doghouse', sub: 'Dogs' },
  { type: 'cat', label: 'Cat tower', sub: 'Cats' },
  { type: 'hutch', label: 'Hutch', sub: 'Rabbits, guinea pigs' },
]

// Mini house cropped to its roof, like keyRow() in the reference (house at 22,36).
function MiniHouse({ type }) {
  const peak = peakY(type, 36)
  return (
    <svg viewBox={`-24 ${peak - 4} 92 ${36 - peak + 10}`} aria-hidden="true">
      <House type={type} x={22} y={36} shadow={false} />
    </svg>
  )
}

// KEY.TXT: what the house shapes and pin rings mean, with counts for the pets currently shown.
export default function Legend({ pets }) {
  const byHouse = (t) => pets.filter((p) => houseTypeFor(p.species) === t).length
  const byStatus = (s) => pets.filter((p) => p.status === s).length

  return (
    <Window title="KEY.TXT" barColor="sun" as="div">
      <div className="key">
        <h3>HOUSE = SPECIES</h3>
        {HOUSES.map((h) => (
          <div className="krow" key={h.type}>
            <MiniHouse type={h.type} />
            <div><b>{h.label}</b><small>{h.sub}</small></div>
            <span className="count">{byHouse(h.type)}</span>
          </div>
        ))}
        <h3>PIN RING = STATUS</h3>
        <div className="krow">
          <span className="ring" style={{ borderColor: STATUS_COLOR.available }} />
          <b>Available</b>
          <span className="count">{byStatus('available')}</span>
        </div>
        <div className="krow">
          <span className="ring" style={{ borderColor: STATUS_COLOR.urgent }} />
          <div><b>Urgent foster</b><small>Pin bounces</small></div>
          <span className="count">{byStatus('urgent')}</span>
        </div>
        <div className="krow">
          <span className="ring" style={{ borderColor: STATUS_COLOR.pending }} />
          <b>Adoption pending</b>
          <span className="count">{byStatus('pending')}</span>
        </div>
      </div>
    </Window>
  )
}
