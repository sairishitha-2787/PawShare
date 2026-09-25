import { useId } from 'react'
import './Field.css'

// Labelled text input (or textarea, with as="textarea") with its error underneath. Extra props go to the control.
export default function Field({ label, hint, error, as: Control = 'input', className = '', ...controlProps }) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error || hint
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <Control id={id} aria-invalid={error ? true : undefined} aria-describedby={note ? noteId : undefined} {...controlProps} />
      {note && <p id={noteId} className={error ? 'field-err' : 'field-hint'}>{note}</p>}
    </div>
  )
}
