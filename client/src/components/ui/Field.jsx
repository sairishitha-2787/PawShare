import { useId } from 'react'
import './Field.css'

// Labelled text input with its error underneath. Extra props go to the <input>.
export default function Field({ label, hint, error, className = '', ...inputProps }) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error || hint
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={note ? noteId : undefined} {...inputProps} />
      {note && <p id={noteId} className={error ? 'field-err' : 'field-hint'}>{note}</p>}
    </div>
  )
}
