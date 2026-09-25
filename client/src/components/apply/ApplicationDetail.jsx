import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Window from '../ui/Window.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../ui/Button.jsx'
import FormError from '../auth/FormError.jsx'
import PetFace from '../pets/PetFace.jsx'
import { Review, TypeAnswers, HomeAnswers } from './Answers.jsx'
import { applicationPet, withdrawApplication } from '../../api/applications.js'
import { APP_STATUS_COLOR, APP_STATUS_LABEL, TYPE_LABEL } from '../../utils/applications.js'
import { formatLong } from '../../utils/dates.js'
import { SPECIES_LABEL } from '../../utils/pets.js'
import './ApplicationDetail.css'

// "Approved 26 Sept 2026", or for a pending one who it's waiting on
function statusLine(application, shelter) {
  const { status, decidedAt } = application
  if (status === 'pending') return `Waiting for ${shelter} to decide`
  return decidedAt ? `${APP_STATUS_LABEL[status]} ${formatLong(decidedAt)}` : APP_STATUS_LABEL[status]
}

// Pending only: "Withdraw application", confirmed inside the window (no confirm()).
// onWithdrawn(updated) after the server agrees; onFailed() after it refuses (it was decided meanwhile, say).
function Withdraw({ application, petName, onWithdrawn, onFailed }) {
  // 'idle' | 'confirm' | 'busy'
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState(null)
  const questionId = useId()
  const buttonRef = useRef(null)
  const questionRef = useRef(null)
  const shown = useRef(phase)

  // opening the question focuses it; "Keep it" puts focus back on the button that asked
  useEffect(() => {
    if (shown.current === phase) return
    const from = shown.current
    shown.current = phase
    if (phase === 'confirm' && from === 'idle') questionRef.current?.focus()
    if (phase === 'idle' && from === 'confirm') buttonRef.current?.focus()
  }, [phase])

  const withdraw = async () => {
    setPhase('busy')
    setError(null)
    try {
      onWithdrawn(await withdrawApplication(application._id))
    } catch (err) {
      setError(err)
      setPhase('idle')
      onFailed()
    }
  }

  return (
    <div className="withdraw">
      <FormError error={error} />
      {phase === 'idle' ? (
        <div className="app-actions">
          {/* a plain .btn: focus comes back here after "Keep it", and Button doesn't pass refs on */}
          <button ref={buttonRef} type="button" className="btn" onClick={() => setPhase('confirm')}>
            Withdraw application
          </button>
        </div>
      ) : (
        <div className="confirm" role="group" aria-labelledby={questionId}>
          <p id={questionId} ref={questionRef} tabIndex={-1}>
            {`Withdraw your application for ${petName}?`}
          </p>
          <div className="app-actions">
            <Button onClick={() => setPhase('idle')} disabled={phase === 'busy'}>Keep it</Button>
            <Button variant="primary" onClick={withdraw} disabled={phase === 'busy'}>
              {phase === 'busy' ? 'WITHDRAWING...' : 'Yes, withdraw'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// <PETNAME>.APP: one of the adopter's applications, read-only, in the Modal.
// canReapply: show "Apply again" (withdrawn/rejected and the pet is still open, with no newer active application).
// onWithdrawn / onWithdrawFailed: see Withdraw. fallbackFocus: see Modal.
export default function ApplicationDetail({ application, canReapply, onClose, onWithdrawn, onWithdrawFailed, fallbackFocus }) {
  const titleId = useId()
  const statusRef = useRef(null)
  const pet = applicationPet(application)
  const shelter = application.shelter?.name || 'The shelter'
  const { status, type } = application
  const place = [application.shelter?.name, pet.area].filter(Boolean).join(', ')

  // after a withdraw the button is gone, so focus moves to the new status
  const lastStatus = useRef(status)
  useEffect(() => {
    if (lastStatus.current !== status) statusRef.current?.focus()
    lastStatus.current = status
  }, [status])

  return (
    <Modal open onClose={onClose} labelledBy={titleId} fallbackFocus={fallbackFocus}>
      <Window as="div" title={`${pet.name.toUpperCase()}.APP`} onClose={onClose} closeLabel="Close application">
        <div className="app-detail">
          <div className="app-head">
            <PetFace pet={pet} size={64} />
            <div>
              <h2 id={titleId}>{pet.name}</h2>
              <p className="sub">{[SPECIES_LABEL[pet.species], place].filter(Boolean).join(' · ')}</p>
              <span className="type-tag">{TYPE_LABEL[type]}</span>
            </div>
          </div>

          <div className="app-status" ref={statusRef} tabIndex={-1}>
            <Pill label={APP_STATUS_LABEL[status]} color={APP_STATUS_COLOR[status]} />
            <p>
              {statusLine(application, shelter)}
              <span>{`Sent ${formatLong(application.createdAt)}`}</span>
            </p>
          </div>

          {status === 'approved' && (
            <div className="approved">
              <p>{`Approved! ${shelter} will be in touch.`}</p>
              <Link className="btn primary" to="/messages">Message the shelter</Link>
            </div>
          )}

          {application.shelterNote && (
            <Review title={`Note from ${shelter}`} heading="h3">
              <p>{application.shelterNote}</p>
            </Review>
          )}

          <Review title="What kind of home" heading="h3">
            <TypeAnswers type={type} fosterUntil={application.fosterUntil} />
          </Review>
          <Review title="About your home" heading="h3">
            <HomeAnswers answers={application.answers} />
          </Review>
          <Review title="Your message" heading="h3">
            <p>{application.message || 'No message'}</p>
          </Review>

          {status === 'pending' && (
            <Withdraw application={application} petName={pet.name} onWithdrawn={onWithdrawn} onFailed={onWithdrawFailed} />
          )}
          {canReapply && (
            <div className="app-actions">
              <Link className="btn primary" to={`/apply/${encodeURIComponent(pet.id)}`}>{`Apply for ${pet.name} again`}</Link>
            </div>
          )}
        </div>
      </Window>
    </Modal>
  )
}
