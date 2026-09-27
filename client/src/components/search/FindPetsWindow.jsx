import { useId, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Window from '../ui/Window.jsx'
import Button from '../ui/Button.jsx'
import Chip from '../ui/Chip.jsx'
import Field from '../ui/Field.jsx'
import ChoiceField from '../ui/ChoiceField.jsx'
import { AREAS } from '../../utils/geo.js'
import {
  AGE_GROUPS, GENDERS, LISTINGS, SIZES, SORTS, TEMPERAMENTS, defaultSortLabel, filterCount, tagLabel,
} from '../../utils/search.js'
import './FindPetsWindow.css'

// cities the demo shelters are in; the server wants the exact name (any case)
const CITIES = [...new Set(AREAS.map((a) => a.label.replace(/ centre$/, '')))]

// A row of toggle chips (any number on), labelled like a Field.
function ChipGroup({ label, options, selected, onToggle }) {
  const id = useId()
  return (
    <div className="field">
      <span className="field-label" id={id}>{label}</span>
      <div className="chips" role="group" aria-labelledby={id}>
        {options.map((o) => (
          <Chip key={o.value} pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)}>{o.label}</Chip>
        ))}
      </div>
    </div>
  )
}

// Magnifying glass for the button column, like the classic Find dialog's searchlight.
function Magnifier() {
  return (
    <svg className="find-glass" viewBox="0 0 64 64" aria-hidden="true">
      <line x1="40" y1="40" x2="56" y2="56" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" />
      <line x1="40" y1="40" x2="55" y2="55" stroke="var(--lav)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="26" cy="26" r="18" fill="#BFE3FF" stroke="var(--ink)" strokeWidth="4" />
      <path d="M16 22 a11 11 0 0 1 9 -8" fill="none" stroke="var(--paper)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

// FIND_PETS.EXE: every filter the server supports, in the style of the classic Find Files dialog. Nothing changes
// until "Find now"; "Clear all" clears the whole search. Species, urgent and Near me stay in the toolbar.
export default function FindPetsWindow({ filters, onFind, onClearAll, onClose }) {
  const titleId = useId()
  const [draft, setDraft] = useState(filters)
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))
  const setText = (key) => (e) => set(key)(e.target.value)
  const toggle = (key) => (value) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value] }))

  const tags = [...new Set([...TEMPERAMENTS, ...draft.temperament])].map((t) => ({ value: t, label: tagLabel(t) }))
  const tidy = { ...draft, q: draft.q.trim(), breed: draft.breed.trim(), city: draft.city.trim() }
  const count = filterCount(tidy)

  const submit = (e) => {
    e.preventDefault()
    onFind(tidy)
  }

  return (
    <Modal open onClose={onClose} labelledBy={titleId} className="find-modal">
      <Window as="div" title={<span id={titleId}>FIND_PETS.EXE</span>} onClose={onClose} closeLabel="Close Find pets">
        <form className="find" onSubmit={submit}>
          <div className="find-sheet">
            <span className="find-tab">Pet details</span>
            <div className="find-panel">
              <div className="find-col">
                <Field label="Keyword" placeholder="Name, breed or description" value={draft.q} onChange={setText('q')} maxLength={60} />
                <Field label="Breed" placeholder="e.g. golden" value={draft.breed} onChange={setText('breed')} maxLength={60} />
                <Field label="City" hint="The area's exact name" list="find-cities" value={draft.city} onChange={setText('city')} maxLength={60} />
                <datalist id="find-cities">
                  {CITIES.map((c) => <option key={c} value={c} />)}
                </datalist>
                <Field label="Sort by" as="select" value={draft.sort} onChange={setText('sort')}>
                  <option value="">{defaultSortLabel(filters.near)}</option>
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Field>
              </div>
              <div className="find-col">
                <ChipGroup label="Age" options={AGE_GROUPS} selected={draft.age} onToggle={toggle('age')} />
                <ChipGroup label="Size" options={SIZES} selected={draft.size} onToggle={toggle('size')} />
                <ChipGroup label="Gender" options={GENDERS} selected={draft.gender} onToggle={toggle('gender')} />
                <ChoiceField label="Looking to" options={LISTINGS} value={draft.listing} onChange={set('listing')} />
              </div>
              <div className="find-wide">
                <ChipGroup label="Temperament (all must match)" options={tags} selected={draft.temperament} onToggle={toggle('temperament')} />
              </div>
            </div>
          </div>

          <div className="find-btns">
            <Button type="submit" variant="primary">Find now</Button>
            <Button onClick={onClearAll}>Clear all</Button>
            <Magnifier />
          </div>
        </form>
        <p className="find-status" aria-live="polite">
          {count ? `${count} ${count === 1 ? 'filter' : 'filters'} set` : 'No filters set'}
        </p>
      </Window>
    </Modal>
  )
}
