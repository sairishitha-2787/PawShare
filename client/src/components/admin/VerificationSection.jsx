import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Chip from '../ui/Chip.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import FormError from '../auth/FormError.jsx'
import { decideVerification } from '../../api/admin.js'
import { VERIFY_COLOR, VERIFY_LABEL, VERIFY_STATUSES, verifyStatusOf } from '../../utils/admin.js'
import { formatLong, formatShort } from '../../utils/dates.js'
import { shelterPath } from '../../utils/shelters.js'
import '../ui/Button.css'
import '../apply/ApplicationDetail.css'
import '../inbox/ReadingPane.css'
import './VerificationSection.css'

// the panes stack below this width (VerificationSection.css); picking a row then moves focus down to the pane
const STACKED = '(max-width: 859px)'
const MAX_NOTE = 1000

const EMPTY = {
  pending: 'No shelters are waiting for verification.',
  approved: 'No verified shelters yet.',
  rejected: 'No rejected requests.',
  unsubmitted: 'Every shelter has sent a request.',
}

function ShelterRow({ shelter, selected, onOpen }) {
  const status = verifyStatusOf(shelter)
  const submitted = shelter.verification?.submittedAt
  const cls = ['vrow', status === 'pending' && 'unread', selected && 'selected'].filter(Boolean).join(' ')
  return (
    <li>
      <button type="button" className={cls} aria-current={selected || undefined} onClick={() => onOpen(shelter._id)}>
        <span className="vrow-main">
          <span className="vrow-name">{shelter.name}</span>
          <span className="vrow-area">{shelter.location?.city || 'No area given'}</span>
        </span>
        <span className="vrow-side">
          <span className="vrow-date">{submitted ? formatShort(submitted) : 'Not submitted'}</span>
          <Pill label={VERIFY_LABEL[status]} color={VERIFY_COLOR[status]} />
        </span>
      </button>
    </li>
  )
}

// One line of the request: label, then the value (or "Not given")
function Detail({ label, children }) {
  return (
    <div className="vdetail">
      <dt>{label}</dt>
      <dd>{children || <span className="none">Not given</span>}</dd>
    </div>
  )
}

const ExternalLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (opens in a new tab)</span></a>
)

// Pending: note + Approve / Reject. Approved: note + Revoke verification. Each confirmed inside the pane.
// Reject and revoke need a note; approve doesn't, but approving without one clears the previous note.
function DecisionBox({ shelter, onDecided }) {
  const status = verifyStatusOf(shelter)
  const name = shelter.name
  const oldNote = shelter.verification?.note
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')
  // 'idle' | 'approve' | 'reject' | 'revoke' (asking) | 'busy'
  const [phase, setPhase] = useState('idle')
  const [asked, setAsked] = useState(null)
  const [error, setError] = useState(null)
  const questionId = useId()
  const boxRef = useRef(null)
  const questionRef = useRef(null)
  const shown = useRef(phase)

  // opening a question focuses it; Cancel (or a refusal) puts focus back on the button that asked
  useEffect(() => {
    const from = shown.current
    shown.current = phase
    if (from === phase) return
    if (from === 'idle') questionRef.current?.focus()
    if (phase === 'idle') boxRef.current?.querySelector(`[data-ask="${asked}"]`)?.focus()
  }, [phase, asked])

  const ask = (which) => {
    if (which !== 'approve' && !note.trim()) {
      setNoteError(which === 'revoke' ? 'Tell the shelter why.' : 'Tell the shelter what to fix.')
      boxRef.current?.querySelector('textarea')?.focus()
      return
    }
    setNoteError('')
    setAsked(which)
    setPhase(which)
  }

  const decide = async () => {
    setPhase('busy')
    setError(null)
    try {
      const updated = await decideVerification(shelter._id, asked === 'approve' ? 'approve' : 'reject', note.trim())
      onDecided(updated, asked)
    } catch (err) {
      setError(err)
      setPhase('idle')
    }
  }

  const clears = oldNote ? ' Approving without a note clears the previous note.' : ''
  const questions = {
    approve: `Approve ${name}? They get the VERIFIED badge and can add new listings.${note.trim() ? '' : clears}`,
    reject: `Reject ${name}'s request? They'll see your note on their verification page and can send it again.`,
    revoke: `Revoke ${name}'s verification? They won't be able to add new listings. Their current listings stay visible.`,
  }
  const busyLabel = { approve: 'APPROVING...', reject: 'REJECTING...', revoke: 'REVOKING...' }
  const yesLabel = { approve: 'Yes, approve', reject: 'Yes, reject', revoke: 'Yes, revoke' }

  const hint =
    status === 'pending'
      ? `Required to reject, optional to approve. The shelter sees it on its verification page.${clears}`
      : 'Required. The shelter sees it on its verification page.'

  return (
    <div className="decide vdecide" ref={boxRef}>
      <h3>Your decision</h3>
      {status === 'approved' && (
        <p className="vexplain">
          Revoking takes away the VERIFIED badge and stops {name} adding new listings. Their current listings stay
          visible and they can send a new request.
        </p>
      )}
      <Field
        label="Note to the shelter"
        hint={noteError ? undefined : hint}
        error={noteError || undefined}
        as="textarea"
        value={note}
        maxLength={MAX_NOTE}
        onChange={(e) => {
          setNote(e.target.value)
          if (noteError && e.target.value.trim()) setNoteError('')
        }}
        disabled={phase === 'busy'}
      />
      <FormError error={error} />
      {phase === 'idle' ? (
        <div className="app-actions">
          {status === 'pending' ? (
            <>
              <button type="button" className="btn" data-ask="reject" onClick={() => ask('reject')}>Reject</button>
              <button type="button" className="btn primary" data-ask="approve" onClick={() => ask('approve')}>Approve</button>
            </>
          ) : (
            <button type="button" className="btn" data-ask="revoke" onClick={() => ask('revoke')}>Revoke verification</button>
          )}
        </div>
      ) : (
        <div className="confirm" role="group" aria-labelledby={questionId}>
          <p id={questionId} ref={questionRef} tabIndex={-1}>{questions[asked]}</p>
          <div className="app-actions">
            <Button onClick={() => setPhase('idle')} disabled={phase === 'busy'}>Cancel</Button>
            <Button variant="primary" onClick={decide} disabled={phase === 'busy'}>
              {phase === 'busy' ? busyLabel[asked] : yesLabel[asked]}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// The detail pane for one shelter. done: "Approved Paws & Whiskers Foundation." after a decision here.
function ShelterPane({ shelter, done, onDecided, headingRef }) {
  const status = verifyStatusOf(shelter)
  const v = shelter.verification || {}
  const headingId = `vpane-${shelter._id}`

  return (
    <article className="vpane" aria-labelledby={headingId}>
      <header className="vpane-head">
        <div>
          <h2 id={headingId} ref={headingRef} tabIndex={-1}>{shelter.name}</h2>
          <p className="sub">{[shelter.location?.city, shelter.email].filter(Boolean).join(' · ')}</p>
        </div>
        <Pill label={VERIFY_LABEL[status]} color={VERIFY_COLOR[status]} />
      </header>

      {done && <p className="vdone" role="status">{done}</p>}

      {status === 'unsubmitted' ? (
        <p className="vnone">This shelter hasn&apos;t sent a verification request yet.</p>
      ) : (
        <dl className="vdetails">
          <Detail label="Registration number">{v.registrationNumber}</Detail>
          <Detail label="About">{v.about && <span className="vabout">{v.about}</span>}</Detail>
          <Detail label="Website">{v.website && <ExternalLink href={v.website}>{v.website}</ExternalLink>}</Detail>
          <Detail label="Document">{v.documentUrl && <ExternalLink href={v.documentUrl}>Open the document</ExternalLink>}</Detail>
          <Detail label="Submitted">{v.submittedAt && formatLong(v.submittedAt)}</Detail>
        </dl>
      )}

      {v.note && (
        <div className="decision" data-status={status === 'approved' || status === 'rejected' ? status : undefined}>
          <p className="decision-note">
            <span>{v.reviewedAt ? `Previous admin note · ${formatLong(v.reviewedAt)}` : 'Previous admin note'}</span>
            {v.note}
          </p>
        </div>
      )}

      <p className="vprofile">
        <Link to={shelterPath(shelter._id)}>See the public profile</Link>
      </p>

      {status === 'pending' || status === 'approved' ? (
        <DecisionBox key={status} shelter={shelter} onDecided={onDecided} />
      ) : (
        <p className="vwaiting">Waiting for the shelter to submit or resubmit.</p>
      )}
    </article>
  )
}

const DONE = { approve: 'Approved', reject: 'Rejected', revoke: 'Revoked the verification of' }

// Status chips, the shelters with that status, and the picked shelter's request.
// shelters: every shelter (ready). onDecided(): after a decision, so the page can fetch the list and counts again.
export default function VerificationSection({ shelters, onDecided }) {
  const [filter, setFilter] = useState('pending')
  const [openId, setOpenId] = useState(null)
  const [done, setDone] = useState(null) // { id, text }
  // the server's copy of the shelter just decided, shown until the refreshed list (a new array) arrives
  const [decided, setDecided] = useState(null) // { base: the list it was decided on, shelter }

  const list =
    decided?.base === shelters ? shelters.map((s) => (s._id === decided.shelter._id ? decided.shelter : s)) : shelters
  const counts = {}
  for (const s of VERIFY_STATUSES) counts[s] = list.filter((sh) => verifyStatusOf(sh) === s).length
  const shown = list.filter((s) => verifyStatusOf(s) === filter)
  const open = openId ? list.find((s) => s._id === openId) : null

  // on a narrow screen the pane is below the list, so a picked row moves focus (and the view) down to it
  const headingRef = useRef(null)
  const focusPane = useRef(false)
  useEffect(() => {
    if (!focusPane.current || !open) return
    focusPane.current = false
    headingRef.current?.focus()
  }, [open])

  const openShelter = (id) => {
    focusPane.current = window.matchMedia(STACKED).matches
    setOpenId(id)
    setDone(null)
  }

  const afterDecision = (updated, verb) => {
    setDecided({ base: shelters, shelter: updated })
    setDone({ id: updated._id, text: `${DONE[verb]} ${updated.name}.` })
    onDecided()
  }

  return (
    <div className="vsection">
      <div className="vtools">
        <div className="vchips" role="group" aria-label="Filter by verification status">
          {VERIFY_STATUSES.map((s) => (
            <Chip key={s} pressed={filter === s} onClick={() => setFilter(s)}>
              {`${VERIFY_LABEL[s]} (${counts[s]})`}
            </Chip>
          ))}
        </div>
      </div>

      <div className="vpanes">
        <div className="vlist">
          {shown.length === 0 ? (
            <p className="vempty">{EMPTY[filter]}</p>
          ) : (
            <ul className="vrows" aria-label={`${VERIFY_LABEL[filter]} shelters`}>
              {shown.map((s) => (
                <ShelterRow key={s._id} shelter={s} selected={s._id === openId} onOpen={openShelter} />
              ))}
            </ul>
          )}
        </div>
        <div className={open ? 'vpane-wrap' : 'vpane-wrap idle'}>
          {open ? (
            <ShelterPane
              key={open._id}
              shelter={open}
              done={done?.id === open._id ? done.text : null}
              onDecided={afterDecision}
              headingRef={headingRef}
            />
          ) : (
            <p className="vhint">Pick a shelter to read its request.</p>
          )}
        </div>
      </div>
    </div>
  )
}
