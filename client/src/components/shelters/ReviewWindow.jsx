import { useId, useRef, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Window from '../ui/Window.jsx'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import FormError from '../auth/FormError.jsx'
import StarInput from './StarInput.jsx'
import { MAX_COMMENT, createReview, updateReview } from '../../api/reviews.js'
import './Reviews.css'

// REVIEW.EXE: rate a shelter for one approved application, or edit the review you already left.
// review: the existing review, or null for a new one. onSaved(review) after the server agrees. fallbackFocus: see Modal.
export default function ReviewWindow({ applicationId, shelterName, petName, type, review, onClose, onSaved, fallbackFocus }) {
  const titleId = useId()
  const starsLabelId = useId()
  const starsErrId = useId()
  const groupRef = useRef(null)
  const [rating, setRating] = useState(review?.rating || 0)
  const [comment, setComment] = useState(review?.comment || '')
  const [missingRating, setMissingRating] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!rating) {
      setMissingRating(true)
      groupRef.current?.querySelector('[tabindex="0"]')?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const body = { rating, comment: comment.trim() }
      onSaved(review ? await updateReview(review._id, body) : await createReview({ applicationId, ...body }))
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  const left = MAX_COMMENT - comment.length
  const what = type === 'foster' ? 'foster' : 'adoption'

  return (
    <Modal open onClose={onClose} labelledBy={titleId} fallbackFocus={fallbackFocus}>
      <Window as="div" title="REVIEW.EXE" barColor="sun" onClose={onClose} closeLabel="Close review">
        <form className="review-form" onSubmit={submit} noValidate>
          <div>
            <h2 id={titleId}>{review ? 'Edit your review' : `Rate ${shelterName}`}</h2>
            <p className="sub">{review ? `${shelterName}, for ${petName}'s ${what}` : `For ${petName}'s ${what}`}</p>
          </div>

          <div className="field">
            <span className="field-label" id={starsLabelId}>Your rating</span>
            <StarInput
              value={rating}
              onChange={(n) => {
                setRating(n)
                setMissingRating(false)
              }}
              labelledBy={starsLabelId}
              describedBy={missingRating ? starsErrId : undefined}
              invalid={missingRating}
              groupRef={groupRef}
            />
            {missingRating && <p id={starsErrId} className="field-err">Pick from 1 to 5 stars.</p>}
          </div>

          <Field
            as="textarea"
            label="Comment (optional)"
            value={comment}
            maxLength={MAX_COMMENT}
            rows={5}
            onChange={(e) => setComment(e.target.value)}
            hint={`${left} ${left === 1 ? 'character' : 'characters'} left`}
            placeholder={`How did it go with ${shelterName}?`}
          />

          <FormError error={error} />

          <div className="review-actions">
            <Button onClick={onClose} disabled={busy}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? 'SENDING...' : review ? 'Save changes' : 'Send review'}
            </Button>
          </div>
        </form>
      </Window>
    </Modal>
  )
}
