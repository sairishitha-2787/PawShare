import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Pill from '../ui/Pill.jsx'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import FormError from '../auth/FormError.jsx'
import PetFace from '../pets/PetFace.jsx'
import { Review, TypeAnswers, HomeAnswers } from '../apply/Answers.jsx'
import { applicationPet, decideApplication } from '../../api/applications.js'
import { APP_STATUS_COLOR, APP_STATUS_LABEL, TYPE_LABEL, applicantName } from '../../utils/applications.js'
import { formatLong } from '../../utils/dates.js'
import { SPECIES_LABEL } from '../../utils/pets.js'
import '../ui/Button.css'
import '../apply/ApplicationDetail.css'
import './ReadingPane.css'

// One contact detail as selectable text with a Copy button. The clipboard can refuse (no permission, not a
// secure page), so a failure says so and leaves the text there to select by hand.
function CopyLine({ label, value }) {
  const [copy, setCopy] = useState('idle') // 'idle' | 'copied' | 'failed'

  useEffect(() => {
    if (copy !== 'copied') return
    const id = setTimeout(() => setCopy('idle'), 2000)
    return () => clearTimeout(id)
  }, [copy])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <div className="copy-line">
      <dt>{label}</dt>
      <dd>
        {value ? (
          <>
            <span className="copy-value">{value}</span>
            <Button className="copy-btn" onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
              {copy === 'copied' ? 'Copied' : 'Copy'}
            </Button>
          </>
        ) : (
          <span className="copy-value none">Not given</span>
        )}
        <span className="copy-note" role="status">
          {copy === 'failed' ? "Couldn't copy. Select the text instead." : ''}
        </span>
      </dd>
    </div>
  )
}

// "Approved 26 Sept 2026" / "Withdrawn by the applicant 26 Sept 2026"
function decisionLine({ status, decidedAt }) {
  const label = status === 'withdrawn' ? 'Withdrawn by the applicant' : APP_STATUS_LABEL[status]
  return decidedAt ? `${label} ${formatLong(decidedAt)}` : label
}

// Pending only: the note and Approve / Reject, each confirmed inside the pane (no confirm()).
// othersPending: how many other pending applications the same pet has (they're rejected on approve).
// onDecided(updated) after the server agrees; onFailed() after it refuses (decided or withdrawn meanwhile, say).
function DecisionBox({ application, name, petName, othersPending, onDecided, onFailed }) {
  const [note, setNote] = useState('')
  // 'idle' | 'approve' | 'reject' (asking) | 'busy'
  const [phase, setPhase] = useState('idle')
  const [asked, setAsked] = useState(null)
  const [error, setError] = useState(null)
  const questionId = useId()
  const questionRef = useRef(null)
  const approveRef = useRef(null)
  const rejectRef = useRef(null)
  const shown = useRef(phase)

  // opening a question focuses it; Cancel puts focus back on the button that asked
  useEffect(() => {
    const from = shown.current
    shown.current = phase
    if (from === phase) return
    if (from === 'idle') questionRef.current?.focus()
    // after Cancel, or after the server said no
    if (phase === 'idle') (asked === 'approve' ? approveRef : rejectRef).current?.focus()
  }, [phase, asked])

  const ask = (which) => {
    setAsked(which)
    setPhase(which)
  }

  const decide = async () => {
    const status = asked === 'approve' ? 'approved' : 'rejected'
    setPhase('busy')
    setError(null)
    try {
      onDecided(await decideApplication(application._id, status, note.trim()))
    } catch (err) {
      setError(err)
      setPhase('idle')
      onFailed()
    }
  }

  const others =
    othersPending === 0
      ? ''
      : othersPending === 1
        ? ` The other 1 pending application for ${petName} will be rejected automatically.`
        : ` The other ${othersPending} pending applications for ${petName} will be rejected automatically.`
  const question =
    asked === 'approve' ? `Approve ${name} for ${petName}?${others}` : `Reject ${name}'s application?`

  return (
    <div className="decide">
      <h3>Your decision</h3>
      <Field
        label="Note to the applicant"
        hint="Optional. They'll see it with your decision."
        as="textarea"
        value={note}
        maxLength={1000}
        onChange={(e) => setNote(e.target.value)}
        disabled={phase === 'busy'}
      />
      <FormError error={error} />
      {phase === 'idle' ? (
        <div className="app-actions">
          {/* plain .btn buttons: focus comes back here after Cancel, and Button doesn't pass refs on */}
          <button ref={rejectRef} type="button" className="btn" onClick={() => ask('reject')}>Reject</button>
          <button ref={approveRef} type="button" className="btn primary" onClick={() => ask('approve')}>Approve</button>
        </div>
      ) : (
        <div className="confirm" role="group" aria-labelledby={questionId}>
          <p id={questionId} ref={questionRef} tabIndex={-1}>{question}</p>
          <div className="app-actions">
            <Button onClick={() => setPhase('idle')} disabled={phase === 'busy'}>Cancel</Button>
            <Button variant="primary" onClick={decide} disabled={phase === 'busy'}>
              {phase === 'busy'
                ? asked === 'approve' ? 'APPROVING...' : 'REJECTING...'
                : asked === 'approve' ? 'Yes, approve' : 'Yes, reject'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// The decision once it's made, read-only: status, date and the note.
function Decision({ application, name }) {
  const { status } = application
  const note = application.shelterNote

  return (
    <div className="decision" data-status={status}>
      <div className="decision-head">
        <Pill label={APP_STATUS_LABEL[status]} color={APP_STATUS_COLOR[status]} />
        <p>{decisionLine(application)}</p>
      </div>
      {status !== 'withdrawn' && (
        <p className="decision-note">
          <span>Note to the applicant</span>
          {note || 'No note'}
        </p>
      )}
      {status === 'approved' && (
        <div className="app-actions">
          <Link className="btn primary" to="/messages">{`Message ${name}`}</Link>
        </div>
      )}
    </div>
  )
}

// The reading pane for one received application (key it by id, so a new one starts fresh). othersPending, onDecided, onFailed: see DecisionBox.
// headingRef: the applicant's name, focused when a row is picked on a narrow screen.
export default function ReadingPane({ application, othersPending, onDecided, onFailed, headingRef }) {
  const pet = applicationPet(application)
  const name = applicantName(application)
  const { applicant = {}, animal, status, type } = application
  const from = [applicant.location?.city, applicant.location?.state].filter(Boolean).join(', ')

  // once it's decided the buttons are gone, so focus moves to the decision that replaced them
  const endRef = useRef(null)
  const lastStatus = useRef(status)
  useEffect(() => {
    if (lastStatus.current !== status) endRef.current?.focus()
    lastStatus.current = status
  }, [status])

  return (
    <article className="reading" aria-labelledby={`reading-${application._id}`}>
      <header className="reading-head">
        <div>
          <h2 id={`reading-${application._id}`} ref={headingRef} tabIndex={-1}>{name}</h2>
          {from && <p className="sub">{from}</p>}
        </div>
        <Pill label={APP_STATUS_LABEL[status]} color={APP_STATUS_COLOR[status]} />
      </header>

      <dl className="contact">
        <CopyLine label="Email" value={applicant.email} />
        <CopyLine label="Phone" value={applicant.phone} />
      </dl>

      <div className="reading-pet">
        <PetFace pet={pet} size={48} />
        <div>
          <p className="pet-name">{pet.name}</p>
          <p className="sub">{[SPECIES_LABEL[pet.species], animal?.breed, pet.area].filter(Boolean).join(' · ')}</p>
        </div>
        <span className="type-tag">{TYPE_LABEL[type]}</span>
      </div>

      <Review title="What kind of home" heading="h3">
        <TypeAnswers type={type} fosterUntil={application.fosterUntil} />
      </Review>
      <Review title="About their home" heading="h3">
        <HomeAnswers answers={application.answers} />
      </Review>
      <Review title="Their message" heading="h3">
        <p>{application.message || 'No message'}</p>
      </Review>
      <p className="sent">{`Sent ${formatLong(application.createdAt)}`}</p>

      {status === 'pending' ? (
        <DecisionBox
          application={application}
          name={name}
          petName={pet.name}
          othersPending={othersPending}
          onDecided={onDecided}
          onFailed={onFailed}
        />
      ) : (
        <div className="decision-wrap" ref={endRef} tabIndex={-1}>
          <Decision application={application} name={name} />
        </div>
      )}
    </article>
  )
}
