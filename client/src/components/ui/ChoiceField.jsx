import { useId } from 'react'
import Chip from './Chip.jsx'
import './Field.css'

// A row of Chips where one can be picked, with a Field-style label and error.
// options: [{ value, label, disabled? }]
export default function ChoiceField({ label, options, value, onChange, error, hint }) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error || hint
  return (
    <div className="field">
      <span className="field-label" id={id}>{label}</span>
      <div className="chips" role="group" aria-labelledby={id} aria-describedby={note ? noteId : undefined}>
        {options.map((o) => (
          <Chip key={String(o.value)} pressed={value === o.value} disabled={o.disabled} onClick={() => onChange(o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
      {note && <p id={noteId} className={error ? 'field-err' : 'field-hint'}>{note}</p>}
    </div>
  )
}
