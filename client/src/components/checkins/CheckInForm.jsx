import { useEffect, useId, useRef, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Window from '../ui/Window.jsx'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import ChoiceField from '../ui/ChoiceField.jsx'
import FormError from '../auth/FormError.jsx'
import { canUpload, checkPhotoFile, uploadPetPhoto } from '../../api/uploads.js'
import { completeCheckIn, logHealthUpdate } from '../../api/checkins.js'
import {
  CONDITIONS, CONDITION_LABEL, MAX, checkInTitle, emptyUpdate, updateBody, validateUpdate,
} from '../../utils/checkins.js'
import { isHttpUrl } from '../../utils/listing.js'
import '../ui/Field.css'
import './CheckIns.css'

const CONDITION_OPTIONS = CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABEL[c] }))
const YES_NO = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]

// Up to 3 photos as plain URLs: uploaded to Cloudinary (the listing form's helper), or pasted without it.
function PhotosField({ photos, onChange, onBusy, error }) {
  const id = useId()
  const fileRef = useRef(null)
  const [progress, setProgress] = useState(null) // 0–1 while uploading
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const full = photos.length >= MAX.photos

  async function pickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = checkPhotoFile(file)
    if (problem) return setNote(problem)
    setNote('')
    setProgress(0)
    onBusy(true)
    try {
      const { url: uploaded } = await uploadPetPhoto(file, setProgress)
      onChange([...photos, uploaded])
    } catch (err) {
      setNote(err.message)
    } finally {
      setProgress(null)
      onBusy(false)
    }
  }

  function addUrl() {
    const u = url.trim()
    if (!isHttpUrl(u)) return setNote('Paste a full image link starting with http:// or https://.')
    if (u.length > MAX.photoUrl) return setNote(`That link is too long (${MAX.photoUrl} characters at most).`)
    if (photos.includes(u)) return setNote('That photo is already here.')
    onChange([...photos, u])
    setUrl('')
    setNote('')
  }

  const uploading = progress !== null
  const pct = Math.round((progress ?? 0) * 100)
  const message = error || note

  return (
    <div className="field">
      <span className="field-label" id={`${id}-label`}>{`Photos (${photos.length} of ${MAX.photos}, optional)`}</span>
      {photos.length > 0 && (
        <ul className="ci-thumbs" aria-labelledby={`${id}-label`}>
          {photos.map((p, i) => (
            <li key={p}>
              <img src={p} alt={`Photo ${i + 1}`} width="64" height="64" />
              <Button onClick={() => onChange(photos.filter((x) => x !== p))} aria-label={`Remove photo ${i + 1}`}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
      {canUpload ? (
        <div className="ci-photo-add">
          <input ref={fileRef} id={id} type="file" accept="image/*" className="sr-only" onChange={pickFile} disabled={full || uploading} />
          <Button onClick={() => fileRef.current?.click()} disabled={full || uploading}>
            {uploading ? 'Uploading...' : 'Upload a photo'}
          </Button>
          {uploading && (
            <div className="ci-upbar" role="progressbar" aria-label="Upload progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${pct}%` }} />
              <span>{`${pct}%`}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="ci-photo-add">
          <label className="field-label" htmlFor={id}>Paste image URL</label>
          <div className="ci-url">
            <input
              id={id}
              type="url"
              value={url}
              placeholder="https://..."
              disabled={full}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addUrl()
                }
              }}
            />
            <Button onClick={addUrl} disabled={full || !url.trim()}>Add photo</Button>
          </div>
        </div>
      )}
      <p className={message ? 'field-err' : 'field-hint'} role={note ? 'alert' : undefined}>
        {message ||
          (full
            ? `That's the limit of ${MAX.photos} photos.`
            : canUpload
              ? 'Images only, up to 5 MB.'
              : 'Uploads aren’t set up here, so paste a link to an image.')}
      </p>
    </div>
  )
}

// CHECKUP.EXE — <PET>: fills in a scheduled check-in (checkIn) or logs an ad-hoc update (checkIn null).
// onSaved(checkIn) after the server has it; onClose to cancel.
export default function CheckInForm({ pet, checkIn, onClose, onSaved }) {
  const titleId = useId()
  const [form, setForm] = useState(emptyUpdate)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const formRef = useRef(null)
  const focusError = useRef(false)

  // after a failed submit, the first problem gets focus: the condition chips, or the first invalid box
  useEffect(() => {
    if (!focusError.current) return
    focusError.current = false
    const el = formRef.current
    const target = errors.condition
      ? el.querySelector('.chips .chip')
      : el.querySelector('[aria-invalid="true"], .ci-photo-add button, .ci-photo-add input')
    target?.focus()
  }, [errors])
  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const heading = checkIn ? checkInTitle(checkIn) : 'Health update'

  async function submit(e) {
    e.preventDefault()
    const found = validateUpdate(form, pet.name)
    setErrors(found)
    if (Object.keys(found).length) {
      focusError.current = true
      return
    }
    setSaving(true)
    setServerError(null)
    try {
      const body = updateBody(form)
      onSaved(checkIn ? await completeCheckIn(checkIn._id, body) : await logHealthUpdate(pet.id, body))
    } catch (err) {
      setServerError(err)
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} labelledBy={titleId}>
      <Window as="div" title={`CHECKUP.EXE — ${pet.name.toUpperCase()}`} barColor="mint" onClose={onClose} closeLabel="Close check-in">
        <form ref={formRef} className="checkup" onSubmit={submit} noValidate>
          <h2 id={titleId}>{`${pet.name}: ${heading}`}</h2>
          <ChoiceField label={`How is ${pet.name} doing?`} options={CONDITION_OPTIONS} value={form.condition} onChange={set('condition')} error={errors.condition} />
          <Field
            label="Weight in kg (optional)"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max={MAX.weightKg}
            value={form.weight}
            onChange={(e) => set('weight')(e.target.value)}
            error={errors.weight}
          />
          <ChoiceField label="Eating well?" options={YES_NO} value={form.eatingWell} onChange={set('eatingWell')} hint="Optional" />
          <ChoiceField label="Vet visit since last time?" options={YES_NO} value={form.vetVisit} onChange={set('vetVisit')} hint="Optional" />
          <Field
            as="textarea"
            label="Notes (optional)"
            value={form.notes}
            maxLength={MAX.notes}
            onChange={(e) => set('notes')(e.target.value)}
            error={errors.notes}
            hint={`${form.notes.length} / ${MAX.notes}`}
          />
          <PhotosField photos={form.photos} onChange={set('photos')} onBusy={setUploading} error={errors.photos} />
          <FormError error={serverError} />
          <div className="checkup-actions">
            <Button onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving || uploading}>
              {saving ? 'SAVING...' : 'Save check-in'}
            </Button>
          </div>
        </form>
      </Window>
    </Modal>
  )
}
