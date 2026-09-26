import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import ErrorDialog from '../ui/ErrorDialog.jsx'
import LoadingWindow from '../ui/LoadingWindow.jsx'
import { RatingSummary, Stars } from '../shelters/Stars.jsx'
import { getAllReviews } from '../../api/admin.js'
import { deleteReview } from '../../api/reviews.js'
import { useLoad } from '../../hooks/useLoad.js'
import { formatShort } from '../../utils/dates.js'
import { reviewCount, shelterPath } from '../../utils/shelters.js'
import '../ui/Button.css'
import '../apply/ApplicationDetail.css'
import './ReviewsSection.css'

// One review with "Remove review", confirmed inside the row. onRemoved() after the server deletes it.
function ReviewRow({ review, petName, shelterName, onRemoved }) {
  const [step, setStep] = useState('idle') // 'idle' | 'confirm' | 'removing'
  const [error, setError] = useState('')
  const questionId = useId()
  const questionRef = useRef(null)
  const removeRef = useRef(null)
  const reviewer = review.reviewer?.name || 'A former adopter'

  const shown = useRef(step)
  useEffect(() => {
    const from = shown.current
    shown.current = step
    if (from === 'idle' && step === 'confirm') questionRef.current?.focus()
    if (step === 'idle' && from !== 'idle') removeRef.current?.focus()
  }, [step])

  async function remove() {
    setStep('removing')
    setError('')
    try {
      await deleteReview(review._id)
      onRemoved(review, reviewer)
    } catch (err) {
      setError(err.message)
      setStep('confirm')
    }
  }

  return (
    <li className="rv">
      <div className="rv-head">
        <span className="rv-who">{reviewer}</span>
        <span className="rv-stars">
          <Stars rating={review.rating} />
          <span className="sr-only">{`${review.rating} out of 5 stars`}</span>
        </span>
        <span className="rv-date">{formatShort(review.createdAt)}</span>
      </div>
      <p className="rv-pet">
        <span>Pet</span> {petName || 'Not known'}
      </p>
      <p className={review.comment ? 'rv-comment' : 'rv-comment none'}>{review.comment || 'No comment'}</p>

      {step === 'idle' ? (
        <div className="rv-actions">
          <button ref={removeRef} type="button" className="btn" onClick={() => setStep('confirm')}>Remove review</button>
        </div>
      ) : (
        <div className="confirm rv-confirm" role="group" aria-labelledby={questionId}>
          <p id={questionId} ref={questionRef} tabIndex={-1}>
            {`Remove ${reviewer}'s review? ${shelterName}'s rating is worked out again without it. This can't be undone.`}
          </p>
          {error && <p className="rv-err" role="alert">{error}</p>}
          <div className="rv-actions">
            <Button onClick={() => setStep('idle')} disabled={step === 'removing'}>Cancel</Button>
            <Button variant="primary" onClick={remove} disabled={step === 'removing'}>
              {step === 'removing' ? 'REMOVING...' : 'Yes, remove'}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

// One shelter's reviews (key it by the shelter id). petNames: application id → pet name.
function ShelterReviews({ shelter, petNames, onChanged }) {
  const fetchReviews = useCallback((options) => getAllReviews(shelter._id, options), [shelter._id])
  const reviews = useLoad(fetchReviews)
  const [done, setDone] = useState('')

  if (reviews.status !== 'ready') {
    return (
      <div className="rv-wait">
        {reviews.status === 'loading' && <LoadingWindow label={`Fetching ${shelter.name}'s reviews`} />}
        {reviews.status === 'error' && <ErrorDialog message="COULDN'T LOAD THE REVIEWS." okLabel="Retry" onOk={reviews.retry} />}
      </div>
    )
  }

  const { reviews: list, rating, ratingCount } = reviews.data
  const removed = (review, reviewer) => {
    // drop it now; the refetch brings the shelter's new rating
    reviews.update((d) => ({ ...d, reviews: d.reviews.filter((r) => r._id !== review._id) }))
    reviews.refresh()
    setDone(`Removed ${reviewer}'s review.`)
    onChanged()
  }

  return (
    <div className="rv-shelter">
      <div className="rv-summary">
        <RatingSummary rating={rating} count={ratingCount} />
        <Link to={shelterPath(shelter._id, 'reviews')}>See the public reviews</Link>
      </div>
      {done && <p className="rv-done" role="status">{done}</p>}
      {list.length === 0 ? (
        <p className="rv-empty">{`${shelter.name} has no reviews.`}</p>
      ) : (
        <ul className="rv-list" aria-label={`Reviews of ${shelter.name}`}>
          {list.map((r) => (
            <ReviewRow
              key={r._id}
              review={r}
              petName={petNames.get(String(r.application))}
              shelterName={shelter.name}
              onRemoved={removed}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// Pick an approved shelter, then moderate its reviews. stats: shelter id → { count } (may still be loading).
// onChanged(): after a removal, so the page can count again.
export default function ReviewsSection({ shelters, stats, petNames, onChanged }) {
  const [shelterId, setShelterId] = useState('')
  const picked = shelters.find((s) => s._id === shelterId)
  const sorted = [...shelters].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="rv-section">
      <div className="rv-tools">
        <label className="rv-pick">
          <span>Shelter</span>
          <select value={shelterId} onChange={(e) => setShelterId(e.target.value)}>
            <option value="">Pick a shelter</option>
            {sorted.map((s) => {
              const count = stats?.get(s._id)?.count
              return (
                <option key={s._id} value={s._id}>
                  {count === undefined ? s.name : `${s.name} (${reviewCount(count)})`}
                </option>
              )
            })}
          </select>
        </label>
      </div>
      {shelters.length === 0 ? (
        <p className="rv-empty">No verified shelters yet, so there are no reviews to check.</p>
      ) : picked ? (
        <ShelterReviews key={picked._id} shelter={picked} petNames={petNames} onChanged={onChanged} />
      ) : (
        <p className="rv-hint">Pick a verified shelter to see its reviews.</p>
      )}
    </div>
  )
}
