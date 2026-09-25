import { useEffect, useId, useRef, useState } from 'react'
import Field from '../ui/Field.jsx'
import ChoiceField from '../ui/ChoiceField.jsx'
import SegToggle from '../ui/SegToggle.jsx'
import Button from '../ui/Button.jsx'
import FormError from '../auth/FormError.jsx'
import TagField from './TagField.jsx'
import HealthLogField from './HealthLogField.jsx'
import PhotoField from './PhotoField.jsx'
import PetPreview from './PetPreview.jsx'
import { petLook } from '../../api/animals.js'
import {
  AGE_UNITS, BOTH_TYPE, FORM_SPECIES, GENDERS, LISTING_TYPES, MAX, SIZES,
  ageMonthsOf, listingBody, savedBreed, validateListing,
} from '../../utils/listing.js'
import './PetForm.css'

const YES_NO = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]

// the pin status the map will give it (same rule as toPet in api/animals.js)
function pinStatus(listingType, status) {
  if (status === 'pending') return 'pending'
  return listingType === 'foster' ? 'urgent' : 'available'
}

function Section({ title, children }) {
  return (
    <fieldset className="pf-section">
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

// The add/edit listing form, in four sections with a live map preview beside it (under it on a narrow screen).
// initial: form state (utils/listing.js). location: kept on save (see listingBody). animalId/status: the listing
// being edited, so the preview gets its map colours and pin. onSave(body) resolves when saved or throws the
// server's error. onCancel goes back.
export default function PetForm({ initial, location, animalId, status, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  // after the first failed save the check runs live, so a message goes away as soon as its field is fixed
  const [checked, setChecked] = useState(false)
  const errors = checked ? validateListing(form) : {}
  const [serverError, setServerError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const formRef = useRef(null)
  const ageId = useId()
  const [focusError, setFocusError] = useState(0)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const setText = (field) => (e) => set(field)(e.target.value)
  // 'both' stays offered only for a listing that already has it
  const listingTypes = initial.listingType === 'both' ? [...LISTING_TYPES, BOTH_TYPE] : LISTING_TYPES

  // after a failed check, bring the first message into view and focus its control
  useEffect(() => {
    if (!focusError) return
    const field = formRef.current?.querySelector('.field-err')?.closest('.field')
    if (!field) return
    field.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    field.querySelector('input, textarea, button')?.focus({ preventScroll: true })
  }, [focusError])

  async function submit(e) {
    e.preventDefault()
    if (saving || uploading) return
    const found = validateListing(form)
    if (Object.keys(found).length) {
      setServerError(null)
      setChecked(true)
      setFocusError((n) => n + 1)
      return
    }
    setServerError(null)
    setSaving(true)
    try {
      await onSave(listingBody(form, location))
    } catch (err) {
      setServerError(err)
      setSaving(false)
    }
  }

  const breedHint =
    form.species === 'hamster'
      ? `Saved as “${savedBreed(form)}”, so it shows as a hamster.`
      : 'Leave blank for “Mixed”.'
  const months = ageMonthsOf(form)
  const ageHint = months !== null && form.ageUnit === 'years' && !Number.isInteger(Number(form.age))
    ? `Saved as ${months} months.`
    : 'Years or months, whichever you know.'

  const previewPet = form.species && {
    ...petLook({
      _id: animalId || 'new-pet',
      name: form.name.trim() || 'Name',
      species: form.species === 'hamster' ? 'other' : form.species,
      breed: savedBreed(form),
      photos: form.photos,
    }),
    status: pinStatus(form.listingType, status),
  }

  return (
    <form className="pet-form" ref={formRef} onSubmit={submit} noValidate>
      <div className="pf-main">
        <Section title="BASICS">
          <Field label="Name" value={form.name} maxLength={MAX.name + 10} onChange={setText('name')} error={errors.name} />
          <ChoiceField label="Species" options={FORM_SPECIES} value={form.species} onChange={set('species')} error={errors.species} />
          <Field
            label="Breed"
            value={form.breed}
            placeholder={form.species === 'hamster' ? 'Syrian' : 'Indie'}
            onChange={setText('breed')}
            error={errors.breed}
            hint={breedHint}
          />
          <div className="field">
            <label className="field-label" htmlFor={ageId}>Age</label>
            <div className="age-row">
              <input
                id={ageId}
                type="number"
                inputMode="decimal"
                min="0"
                step={form.ageUnit === 'years' ? '0.5' : '1'}
                value={form.age}
                onChange={setText('age')}
                aria-invalid={errors.age ? true : undefined}
                aria-describedby={`${ageId}-note`}
              />
              <SegToggle label="Age unit" options={AGE_UNITS} value={form.ageUnit} onChange={set('ageUnit')} />
            </div>
            <p id={`${ageId}-note`} className={errors.age ? 'field-err' : 'field-hint'}>{errors.age || ageHint}</p>
          </div>
          <ChoiceField label="Sex" options={GENDERS} value={form.gender} onChange={set('gender')} error={errors.gender} />
          <ChoiceField label="Size" options={SIZES} value={form.size} onChange={set('size')} error={errors.size} />
          <ChoiceField
            label="Listing"
            options={listingTypes}
            value={form.listingType}
            onChange={set('listingType')}
            error={errors.listingType}
            hint="Foster listings get the pink pin that bounces."
          />
          <Field label="City or area" autoComplete="address-level2" value={form.city} onChange={setText('city')} error={errors.city} />
        </Section>

        <Section title="PERSONALITY">
          <TagField tags={form.tags} onChange={set('tags')} error={errors.tags} />
          <Field
            label="About (optional)"
            as="textarea"
            value={form.description}
            onChange={setText('description')}
            error={errors.description}
            hint={`What's a day with this pet like? ${form.description.trim().length} / ${MAX.description}`}
          />
        </Section>

        <Section title="HEALTH">
          <div className="pf-pair">
            <ChoiceField label="Vaccinated" options={YES_NO} value={form.vaccinated} onChange={set('vaccinated')} error={errors.vaccinated} />
            <ChoiceField label="Neutered / spayed" options={YES_NO} value={form.neutered} onChange={set('neutered')} error={errors.neutered} />
          </div>
          <HealthLogField records={form.health} onChange={set('health')} errors={errors} />
        </Section>

        <Section title="PHOTOS">
          <PhotoField photos={form.photos} onChange={set('photos')} onBusy={setUploading} error={errors.photos} />
        </Section>

        <FormError error={serverError} />
        {Object.keys(errors).length > 0 && !serverError && (
          <p className="pf-check" role="alert">Some fields need a look. They&apos;re marked in pink.</p>
        )}

        <div className="pf-actions">
          <Button onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || uploading}>
            {saving ? 'SAVING...' : uploading ? 'Wait for the upload' : 'Save pet'}
          </Button>
        </div>
      </div>

      <aside className="pf-side" aria-label="Map preview">
        <h3>ON THE MAP</h3>
        {previewPet ? (
          <PetPreview pet={previewPet} />
        ) : (
          <p className="pf-side-empty">Pick a species to see the house.</p>
        )}
        <p className="pf-side-note">
          {form.photos.length ? 'The main photo goes on the pin.' : 'No photo yet, so the pin shows a cartoon face.'}
        </p>
      </aside>
    </form>
  )
}
