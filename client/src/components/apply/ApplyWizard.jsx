import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import ChoiceField from '../ui/ChoiceField.jsx'
import FormError from '../auth/FormError.jsx'
import { Review, TypeAnswers, HomeAnswers } from './Answers.jsx'
import { applyFor, getMyApplications, isActive } from '../../api/applications.js'
import { HOME_TYPE_LABEL, TYPE_LABEL } from '../../utils/applications.js'
import './ApplyWizard.css'

export const STEP_COUNT = 3
const STEP_TITLE = { 1: 'What kind of home?', 2: 'About your home', 3: 'Say hello' }

// values are the ones POST /api/applications accepts (see server/models/Application.js)
const HOME_TYPES = Object.entries(HOME_TYPE_LABEL).map(([value, label]) => ({ value, label }))
const YES_NO = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]
// the Application model's maxlength for each text field
const MAX = { otherPets: 300, experience: 1000, message: 2000 }

// local date as YYYY-MM-DD (what <input type="date"> uses), offset by some days
function isoDate(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// the types this listing accepts; the server answers 400 for any other
function allowedTypes(pet) {
  return pet.listingType === 'both' ? ['adoption', 'foster'] : [pet.listingType]
}

// urgent pets (available foster listings) start on Foster, the rest on Adopt, if the listing allows it
function defaultType(pet) {
  const allowed = allowedTypes(pet)
  const preferred = pet.status === 'urgent' ? 'foster' : 'adoption'
  return allowed.includes(preferred) ? preferred : allowed[0]
}

function validate(step, form) {
  const errors = {}
  if (step === 1 && form.type === 'foster') {
    if (!form.fosterUntil) errors.fosterUntil = 'Pick the date you can foster until.'
    // YYYY-MM-DD strings compare in date order
    else if (form.fosterUntil <= isoDate()) errors.fosterUntil = 'Pick a date after today.'
  }
  if (step === 2) {
    if (!form.homeType) errors.homeType = 'Pick one.'
    if (form.hasYard === null) errors.hasYard = 'Pick yes or no.'
    if (form.hasChildren === null) errors.hasChildren = 'Pick yes or no.'
    const hours = form.hoursAlonePerDay.trim()
    if (hours === '' || !Number.isFinite(Number(hours)) || Number(hours) < 0 || Number(hours) > 24) {
      errors.hoursAlonePerDay = 'Enter a number from 0 to 24.'
    }
    if (form.otherPets.trim().length > MAX.otherPets) errors.otherPets = `Keep it under ${MAX.otherPets} characters.`
    if (form.experience.trim().length > MAX.experience) errors.experience = `Keep it under ${MAX.experience} characters.`
  }
  if (step === 3 && form.message.trim().length > MAX.message) {
    errors.message = `Keep it under ${MAX.message} characters.`
  }
  return errors
}

// the POST body; empty optional text is left out rather than sent as ""
function toBody(pet, form) {
  const otherPets = form.otherPets.trim()
  const experience = form.experience.trim()
  const message = form.message.trim()
  return {
    animalId: pet.id,
    type: form.type,
    ...(form.type === 'foster' && { fosterUntil: form.fosterUntil }),
    answers: {
      homeType: form.homeType,
      hasYard: form.hasYard,
      hasChildren: form.hasChildren,
      hoursAlonePerDay: Number(form.hoursAlonePerDay),
      ...(otherPets && { otherPets }),
      ...(experience && { experience }),
    },
    ...(message && { message }),
  }
}

// The three steps of APPLY.EXE. onStep(n) reports the current step for the progress bar;
// onSent(application) after it's created; onAlreadyApplied(application) if the server says there's one already.
export default function ApplyWizard({ pet, onStep, onSent, onAlreadyApplied }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => ({
    type: defaultType(pet),
    fosterUntil: '',
    homeType: '',
    hasYard: null,
    hasChildren: null,
    otherPets: '',
    hoursAlonePerDay: '',
    experience: '',
    message: '',
  }))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const headingRef = useRef(null)
  const shownStep = useRef(step)

  // a new step moves focus to its heading, so keyboard and screen reader users start at the top of it
  // (compared with the last step rather than a first-render flag, which StrictMode's double effect defeats)
  useEffect(() => {
    onStep?.(step)
    if (shownStep.current === step) return
    shownStep.current = step
    headingRef.current?.focus()
  }, [step, onStep])

  // setting a value clears its error; the rest stay until the next Next
  const setValue = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((errs) => (errs[key] ? { ...errs, [key]: undefined } : errs))
  }
  const onInput = (key) => (e) => setValue(key, e.target.value)

  const goTo = (n) => {
    setErrors({})
    setServerError(null)
    setStep(n)
  }

  const back = () => (step === 1 ? navigate(`/adopt/${encodeURIComponent(pet.id)}`) : goTo(step - 1))

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    const found = validate(step, form)
    setErrors(found)
    setServerError(null)
    if (Object.keys(found).length) return
    if (step < STEP_COUNT) {
      setStep(step + 1)
      return
    }

    setBusy(true)
    try {
      onSent(await applyFor(toBody(pet, form)))
    } catch (err) {
      // 409 is either "already applied" or "no longer accepting"; the adopter's own list tells them apart
      if (err.status === 409) {
        const mine = await getMyApplications().catch(() => [])
        const existing = mine.find((a) => a.animal?._id === pet.id && isActive(a))
        if (existing) {
          onAlreadyApplied(existing)
          return
        }
      }
      setServerError(err)
      setBusy(false)
    }
  }

  const allowed = allowedTypes(pet)
  const typeOptions = Object.entries(TYPE_LABEL).map(([value, text]) => ({ value, label: text, disabled: !allowed.includes(value) }))
  const onlyOne = allowed.length === 1 ? `${pet.name} is listed for ${allowed[0]} only.` : undefined

  return (
    <form className="wizard" onSubmit={submit} noValidate>
      <h3 ref={headingRef} tabIndex={-1}>{STEP_TITLE[step]}</h3>

      {step === 1 && (
        <>
          <ChoiceField
            label="I'd like to"
            options={typeOptions}
            value={form.type}
            onChange={(v) => setValue('type', v)}
            hint={onlyOne}
          />
          {form.type === 'foster' && (
            <Field
              label="Foster until"
              type="date"
              min={isoDate(1)}
              value={form.fosterUntil}
              onChange={onInput('fosterUntil')}
              error={errors.fosterUntil}
            />
          )}
          {pet.status === 'pending' && (
            <p className="note">
              Someone has already applied for {pet.name}. You can still apply: the shelter reads every application.
            </p>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <ChoiceField
            label="Home type"
            options={HOME_TYPES}
            value={form.homeType}
            onChange={(v) => setValue('homeType', v)}
            error={errors.homeType}
          />
          <ChoiceField label="Has a yard" options={YES_NO} value={form.hasYard} onChange={(v) => setValue('hasYard', v)} error={errors.hasYard} />
          <ChoiceField
            label="Children at home"
            options={YES_NO}
            value={form.hasChildren}
            onChange={(v) => setValue('hasChildren', v)}
            error={errors.hasChildren}
          />
          <Field
            label="Other pets (optional)"
            placeholder="e.g. one older cat"
            maxLength={MAX.otherPets}
            value={form.otherPets}
            onChange={onInput('otherPets')}
            error={errors.otherPets}
          />
          <Field
            label="Hours alone per day"
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            className="short"
            value={form.hoursAlonePerDay}
            onChange={onInput('hoursAlonePerDay')}
            error={errors.hoursAlonePerDay}
            hint="How long the pet would be on its own on a normal day."
          />
          <Field
            as="textarea"
            label="Experience with pets (optional)"
            maxLength={MAX.experience}
            value={form.experience}
            onChange={onInput('experience')}
            error={errors.experience}
            hint={`Pets you've had or looked after. Up to ${MAX.experience} characters.`}
          />
        </>
      )}

      {step === 3 && (
        <>
          <Field
            as="textarea"
            label="Message to the shelter (optional)"
            maxLength={MAX.message}
            value={form.message}
            onChange={onInput('message')}
            error={errors.message}
            hint={`${form.message.length} / ${MAX.message}`}
          />

          <Review title="What kind of home" onEdit={() => goTo(1)} editLabel="Edit what kind of home">
            <TypeAnswers type={form.type} fosterUntil={form.fosterUntil} />
          </Review>
          <Review title="About your home" onEdit={() => goTo(2)} editLabel="Edit about your home">
            <HomeAnswers answers={toBody(pet, form).answers} />
          </Review>
        </>
      )}

      <FormError error={serverError} />

      <div className="wiz-nav">
        <Button onClick={back} disabled={busy}>Back</Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {step < STEP_COUNT ? 'Next' : busy ? 'SENDING...' : 'Send application'}
        </Button>
      </div>
    </form>
  )
}
