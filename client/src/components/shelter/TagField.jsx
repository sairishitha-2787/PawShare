import { useId, useState } from 'react'
import Chip from '../ui/Chip.jsx'
import Button from '../ui/Button.jsx'
import { MAX, TAG_SUGGESTIONS } from '../../utils/listing.js'
import '../ui/Field.css'

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Temperament tags. The server takes any text (stored lowercased), so: quick-pick toggle chips, the shelter's
// own tags as pressed chips (click to remove), and a box to add a new one.
export default function TagField({ tags, onChange, error }) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState('')
  const full = tags.length >= MAX.tags
  const custom = tags.filter((t) => !TAG_SUGGESTIONS.includes(t))

  const toggle = (tag) => {
    setNote('')
    if (tags.includes(tag)) onChange(tags.filter((t) => t !== tag))
    else if (!full) onChange([...tags, tag])
  }

  const add = () => {
    const tag = draft.trim().replace(/\s+/g, ' ').toLowerCase()
    if (!tag) return
    if (tag.length > MAX.tag) return setNote(`Keep each tag under ${MAX.tag} characters.`)
    if (full) return setNote(`Up to ${MAX.tags} tags.`)
    if (!tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
    setNote('')
  }

  const message = error || note || `${tags.length} of ${MAX.tags}. Click a tag to add or remove it.`
  return (
    <div className="field">
      <span className="field-label" id={`${id}-label`}>Temperament</span>
      <div className="chips" role="group" aria-labelledby={`${id}-label`}>
        {[...TAG_SUGGESTIONS, ...custom].map((t) => {
          const on = tags.includes(t)
          return (
            <Chip key={t} pressed={on} disabled={!on && full} onClick={() => toggle(t)}>
              {capitalize(t)}
            </Chip>
          )
        })}
      </div>
      <div className="tag-add">
        <label className="sr-only" htmlFor={id}>New tag</label>
        <input
          id={id}
          value={draft}
          maxLength={MAX.tag + 10}
          placeholder="Add your own, e.g. Loves cuddles"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the tag instead of submitting the form
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button onClick={add} disabled={!draft.trim()}>Add tag</Button>
      </div>
      <p className={error || note ? 'field-err' : 'field-hint'}>{message}</p>
    </div>
  )
}
