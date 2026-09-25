import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import Pill from '../components/ui/Pill.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import FormError from '../components/auth/FormError.jsx'
import PetFace from '../components/pets/PetFace.jsx'
import ApplyWizard, { STEP_COUNT } from '../components/apply/ApplyWizard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getAnimal } from '../api/animals.js'
import { getMyApplications, isActive } from '../api/applications.js'
import { SPECIES_LABEL } from '../utils/pets.js'
import './ApplyPage.css'

const CELLS_PER_STEP = 4

// The pet, and (for adopters) their active application for it, if they have one.
// status: 'loading' | 'ready' | 'closed' (adopted/fostered) | 'error'
function useApplyData(petId, isAdopter) {
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    const opts = { signal: ctrl.signal }
    Promise.all([getAnimal(petId, opts), isAdopter ? getMyApplications(undefined, opts) : []])
      .then(([pet, mine]) => {
        if (!pet) return setLoad({ status: 'closed' })
        const existing = mine.find((a) => a.animal?._id === pet.id && isActive(a))
        setLoad({ status: 'ready', pet, existing })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error', error: err })
      })
    return () => ctrl.abort()
  }, [petId, isAdopter, attempt])

  const retry = () => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }
  return { ...load, retry }
}

function PetSummary({ pet }) {
  return (
    <div className="apply-pet">
      <PetFace pet={pet} size={64} />
      <div>
        <h2>{pet.name}</h2>
        <p className="sub">{`${SPECIES_LABEL[pet.species]} · ${pet.shelter}, ${pet.area}`}</p>
        <Pill status={pet.status} />
      </div>
    </div>
  )
}

// 12 pixel cells, 4 per step
function StepBar({ step }) {
  return (
    <div className="stepbar">
      <p id="apply-step">{`STEP ${step} OF ${STEP_COUNT}`}</p>
      <div
        className="cells"
        role="progressbar"
        aria-labelledby="apply-step"
        aria-valuemin={1}
        aria-valuemax={STEP_COUNT}
        aria-valuenow={step}
      >
        {Array.from({ length: STEP_COUNT * CELLS_PER_STEP }, (_, i) => (
          <i key={i} className={i < step * CELLS_PER_STEP ? 'on' : undefined} />
        ))}
      </div>
    </div>
  )
}

// /applications/:id opens that application's detail window
const applicationLink = (application) => `/applications/${encodeURIComponent(application._id)}`

function Shell({ children }) {
  return (
    <div className="desk apply-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      {children}
    </div>
  )
}

// The mint window that replaces the wizard once the application is in.
function Sent({ pet, application }) {
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <Window title="APPLICATION SENT" barColor="mint" className="apply">
      <div className="apply-body">
        <p ref={ref} tabIndex={-1} className="lead">
          {`${pet.shelter} will review your application. You'll see its status under My applications.`}
        </p>
        <div className="apply-actions">
          <Link className="btn" to="/adopt">Back to the neighborhood</Link>
          <Link className="btn primary" to={applicationLink(application)}>View application</Link>
        </div>
      </div>
    </Window>
  )
}

// /apply/:petId (behind RequireAuth): APPLY.EXE, the 3-step adoption / foster application.
export default function ApplyPage() {
  const { petId } = useParams()
  const { user, logout } = useAuth()
  const isAdopter = user?.role === 'adopter'
  const { status, pet, existing, error, retry } = useApplyData(petId, isAdopter)
  const [step, setStep] = useState(1)
  // null while the form is open; 'sent' with the new application, or 'applied' with the one the server
  // said was already there
  const [outcome, setOutcome] = useState(null)
  const onSent = useCallback((application) => setOutcome({ kind: 'sent', application }), [])
  const onAlreadyApplied = useCallback((application) => setOutcome({ kind: 'applied', application }), [])

  if (status === 'loading') {
    return (
      <Shell>
        <div className="apply-wait">
          <LoadingWindow label="Opening the application" />
        </div>
      </Shell>
    )
  }

  if (status !== 'ready') {
    const message =
      status === 'closed'
        ? 'This animal is no longer accepting applications.'
        : error.status === 404 || error.status === 400
          ? "We couldn't find that pet."
          : error.message
    return (
      <Shell>
        <Window title="APPLY.EXE" className="apply">
          <div className="apply-body">
            <FormError error={{ message }} />
            <div className="apply-actions">
              <Link className="btn" to="/adopt">Back to the neighborhood</Link>
              {status === 'error' && error.status !== 404 && error.status !== 400 && (
                <Button variant="primary" onClick={retry}>Retry</Button>
              )}
            </div>
          </div>
        </Window>
      </Shell>
    )
  }

  if (outcome?.kind === 'sent') {
    return <Shell><Sent pet={pet} application={outcome.application} /></Shell>
  }

  const activeApplication = outcome?.kind === 'applied' ? outcome.application : existing
  const alreadyApplied = Boolean(activeApplication)
  return (
    <Shell>
      <Window title={`APPLY.EXE — ${pet.name}`} className="apply">
        <div className="apply-top">
          <PetSummary pet={pet} />
          {isAdopter && !alreadyApplied && <StepBar step={step} />}
        </div>
        <div className="apply-body">
          {!isAdopter ? (
            <>
              <FormError
                error={{
                  message:
                    user?.role === 'shelter'
                      ? "Shelter accounts can't apply. Log in with an adopter account."
                      : "Only adopter accounts can apply. Log in with an adopter account.",
                }}
              />
              <div className="apply-actions">
                <Link className="btn" to={`/adopt/${encodeURIComponent(pet.id)}`}>Back to profile</Link>
                {/* logging out sends RequireAuth to /login, which comes back here afterwards */}
                <Button variant="primary" onClick={logout}>Log out</Button>
              </div>
            </>
          ) : alreadyApplied ? (
            <>
              <p className="note" role="status">
                {`You've already applied for ${pet.name}. You'll see its status under My applications.`}
              </p>
              <div className="apply-actions">
                <Link className="btn" to="/adopt">Back to the neighborhood</Link>
                <Link className="btn primary" to={applicationLink(activeApplication)}>View application</Link>
              </div>
            </>
          ) : (
            <ApplyWizard pet={pet} onStep={setStep} onSent={onSent} onAlreadyApplied={onAlreadyApplied} />
          )}
        </div>
      </Window>
    </Shell>
  )
}
