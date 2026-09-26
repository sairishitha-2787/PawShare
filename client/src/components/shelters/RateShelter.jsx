import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Button from '../ui/Button.jsx'
import FormError from '../auth/FormError.jsx'
import ShelterLink from './ShelterLink.jsx'
import ReviewWindow from './ReviewWindow.jsx'
import { RatingSummary, Stars } from './Stars.jsx'
import { deleteReview, findMyReview } from '../../api/reviews.js'
import { getProfile } from '../../api/users.js'
import './Reviews.css'

// The adopter's own review for one approved application (or null), and the shelter's current rating.
// status: 'loading' | 'ready' | 'error'. refresh() fetches both again quietly.
function useMyReview(application) {
  const shelterId = application.shelter?._id
  const [load, setLoad] = useState({ status: 'loading', review: null, shelter: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!shelterId) return
    const ctrl = new AbortController()
    const options = { signal: ctrl.signal }
    Promise.all([
      findMyReview({ shelterId, applicationId: application._id, since: application.decidedAt }, options),
      getProfile(shelterId, options),
    ])
      .then(([review, shelter]) => setLoad({ status: 'ready', review, shelter }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoad((l) => (l.status === 'ready' ? l : { ...l, status: 'error' }))
      })
    return () => ctrl.abort()
  }, [shelterId, application._id, application.decidedAt, attempt])

  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...load, refresh }
}

// "Rate <Shelter>" for an approved application, or your review with "Edit your review" / "Delete".
// Delete is confirmed in place (no confirm()). Shown in <PET>.APP and in the pet diary.
export default function RateShelter({ application, petName }) {
  const shelter = application.shelter
  const { status, review, shelter: profile, refresh } = useMyReview(application)
  const [editing, setEditing] = useState(false)
  // 'idle' | 'confirm' | 'busy'
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState(null)
  const [note, setNote] = useState('')
  const questionId = useId()
  const noteRef = useRef(null)
  const questionRef = useRef(null)
  const deleteRef = useRef(null)

  // a note after saving or deleting takes focus (the button that was used is often gone by then)
  useEffect(() => {
    if (note) noteRef.current?.focus()
  }, [note])

  // the delete question takes focus; "Keep it" puts it back on Delete
  const lastPhase = useRef(phase)
  useEffect(() => {
    if (phase === 'confirm' && lastPhase.current === 'idle') questionRef.current?.focus()
    if (phase === 'idle' && lastPhase.current === 'confirm') deleteRef.current?.focus()
    lastPhase.current = phase
  }, [phase])

  if (!shelter?._id) return null
  const name = shelter.name || 'the shelter'

  const edit = () => {
    setNote('')
    setEditing(true)
  }

  async function remove() {
    setPhase('busy')
    setError(null)
    try {
      await deleteReview(review._id)
      setPhase('idle')
      setNote('Your review is deleted.')
      refresh()
    } catch (err) {
      setError(err)
      setPhase('confirm')
    }
  }

  return (
    <section className="rate" aria-label={`Your review of ${name}`}>
      <p className="rate-shelter">
        <ShelterLink id={shelter._id} name={name} tab="reviews" />
        {profile && <RatingSummary rating={profile.rating} count={profile.ratingCount} scale={1.5} />}
      </p>

      {status === 'error' && (
        <p className="rate-err">
          Couldn&apos;t check for your review.
          <Button onClick={refresh}>Retry</Button>
        </p>
      )}

      {status === 'ready' && !review && (
        <div className="rate-actions">
          <Button variant="primary" onClick={edit}>{`Rate ${name}`}</Button>
        </div>
      )}

      {status === 'ready' && review && (
        <>
          <div className="rate-mine">
            <span className="rate-label">Your review</span>
            <Stars rating={review.rating} scale={1.5} />
            <span className="sr-only">{`${review.rating} out of 5 stars`}</span>
            {review.comment && <p>{review.comment}</p>}
          </div>
          {phase === 'idle' ? (
            <div className="rate-actions">
              <Button onClick={edit}>Edit your review</Button>
              {/* a plain .btn: focus comes back here after "Keep it", and Button doesn't pass refs on */}
              <button
                ref={deleteRef}
                type="button"
                className="btn"
                onClick={() => {
                  setNote('')
                  setPhase('confirm')
                }}
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="confirm" role="group" aria-labelledby={questionId}>
              <p id={questionId} ref={questionRef} tabIndex={-1}>{`Delete your review of ${name}?`}</p>
              <FormError error={error} />
              <div className="rate-actions">
                <Button
                  onClick={() => {
                    setError(null)
                    setPhase('idle')
                  }}
                  disabled={phase === 'busy'}
                >
                  Keep it
                </Button>
                <Button variant="primary" onClick={remove} disabled={phase === 'busy'}>
                  {phase === 'busy' ? 'DELETING...' : 'Yes, delete'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {note && <p ref={noteRef} className="rate-note" role="status" tabIndex={-1}>{note}</p>}

      {editing && (
        <ReviewWindow
          applicationId={application._id}
          shelterName={name}
          petName={petName}
          type={application.type}
          review={review}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            setNote(review ? 'Your review is updated.' : `Thanks! Your review of ${name} is saved.`)
            refresh()
          }}
          fallbackFocus={() => noteRef.current}
        />
      )}
    </section>
  )
}
