import { activeFilters } from '../../utils/search.js'
import './Search.css'

// The FIND_PETS.EXE filters that are set, as chips under the toolbar ("Size: Small" + a cross). Clicking one removes it.
export default function ActiveFilters({ filters, onChange, onClearAll }) {
  const chips = activeFilters(filters)
  if (!chips.length) return null
  return (
    <div className="subrow" role="group" aria-label="Active filters">
      <ul className="afilters">
        {chips.map((c) => (
          <li key={c.id}>
            <button type="button" className="afchip" onClick={() => onChange(c.without(filters))} aria-label={`Remove ${c.label}`}>
              {c.label}
              <svg viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="clear-link" onClick={onClearAll}>Clear all</button>
    </div>
  )
}
