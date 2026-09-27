import Window from '../ui/Window.jsx'
import ShelterLink from '../shelters/ShelterLink.jsx'
import { formatKm } from '../../utils/geo.js'
import './Search.css'

// Shelters in the Near me results, nearest first: { id, name, count, nearestKm }
function groupByShelter(pets) {
  const byShelter = new Map()
  for (const p of pets) {
    const key = p.shelterId || p.shelter
    const g = byShelter.get(key) || { id: p.shelterId, name: p.shelter, count: 0, nearestKm: Infinity }
    g.count += 1
    if (p.distanceKm != null) g.nearestKm = Math.min(g.nearestKm, p.distanceKm)
    byShelter.set(key, g)
  }
  return [...byShelter.values()].sort((a, b) => a.nearestKm - b.nearestKm)
}

// NEARBY_SHELTERS/: in the sidebar under KEY.TXT while Near me is on.
export default function NearbyShelters({ pets, radius }) {
  const shelters = groupByShelter(pets)
  return (
    <Window title="NEARBY_SHELTERS/" barColor="mint" as="div">
      <div className="nshelters">
        {shelters.length ? (
          <ol>
            {shelters.map((s) => (
              <li key={s.id || s.name}>
                <ShelterLink id={s.id} name={s.name} />
                <small>
                  {`${s.count} ${s.count === 1 ? 'pet' : 'pets'}`}
                  {Number.isFinite(s.nearestKm) && ` · nearest ${formatKm(s.nearestKm)}`}
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <p>{`No shelters with matching pets within ${radius} km.`}</p>
        )}
      </div>
    </Window>
  )
}
