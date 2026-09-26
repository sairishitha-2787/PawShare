import { useState } from 'react'
import Chip from '../ui/Chip.jsx'
import PetCard from '../pets/PetCard.jsx'
import ListingFoot from '../shelter/ListingFoot.jsx'
import { toListing } from '../../api/animals.js'
import { LISTING_STATUSES, LISTING_STATUS_LABEL } from '../../utils/listing.js'
import './ListingsSection.css'

const FILTERS = ['all', ...LISTING_STATUSES]
const FILTER_LABEL = { all: 'All', ...LISTING_STATUS_LABEL }

const matches = (animal, query) => {
  if (!query) return true
  const q = query.toLowerCase()
  return animal.name.toLowerCase().includes(q) || (animal.breed || '').toLowerCase().includes(q)
}

// Every listing on PawShare, any status, with status chips and a name/breed search (on the client).
// apps: every application ({ status, applications }), for the Remove guard. onEdit(id), onRemoved(animal).
export default function ListingsSection({ animals, apps, onEdit, onRemoved }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const q = query.trim()

  const found = animals.filter((a) => matches(a, q))
  const counts = { all: found.length }
  for (const s of LISTING_STATUSES) counts[s] = found.filter((a) => a.status === s).length
  const shown = filter === 'all' ? found : found.filter((a) => a.status === filter)
  const appsFor = (id) => ({ status: apps.status, list: apps.applications.filter((a) => a.animal?._id === id) })

  let empty = null
  if (shown.length === 0) {
    const kind = filter === 'all' ? 'listings' : `${FILTER_LABEL[filter].toLowerCase()} listings`
    empty = q ? `No ${kind} match "${q}".` : `No ${kind}.`
  }

  return (
    <div className="ls-section">
      <div className="ls-tools">
        <div className="ls-chips" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Chip key={f} pressed={filter === f} onClick={() => setFilter(f)}>
              {`${FILTER_LABEL[f]} (${counts[f]})`}
            </Chip>
          ))}
        </div>
        <label className="ls-search">
          <span>Search</span>
          <input type="search" value={query} placeholder="Name or breed" onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {empty ? (
        <p className="ls-empty">{empty}</p>
      ) : (
        <div className="ls-list">
          {shown.map((a) => {
            const pet = toListing(a)
            return (
              <PetCard
                key={a._id}
                pet={pet}
                detail={[a.owner?.name || 'Unknown shelter', pet.area].filter(Boolean).join(' · ')}
                foot={<ListingFoot animal={a} apps={appsFor(a._id)} onEdit={onEdit} onRemoved={onRemoved} />}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
