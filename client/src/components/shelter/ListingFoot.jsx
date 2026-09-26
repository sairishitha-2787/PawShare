import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pill from '../ui/Pill.jsx'
import Button from '../ui/Button.jsx'
import { deleteAnimal } from '../../api/animals.js'
import { LISTING_STATUS_COLOR, LISTING_STATUS_LABEL } from '../../utils/listing.js'
import './ListingFoot.css'

// Why this pet can't be removed, or null. The server deletes whatever it's asked to, so the check is here:
// pending applications need a decision first, and an approved one keeps the pet for the adopter's check-ins.
function removeBlock(name, apps) {
  if (apps.status !== 'ready') return null
  const pending = apps.list.filter((a) => a.status === 'pending').length
  if (pending) {
    return `${name} has ${pending} pending ${pending === 1 ? 'application' : 'applications'}. Approve or reject ${pending === 1 ? 'it' : 'them'} in the inbox first.`
  }
  if (apps.list.some((a) => a.status === 'approved')) {
    return `${name} has an approved application, so the listing stays for the adopter's check-ins and reviews.`
  }
  return null
}

// A listing card's footer: status pill + Edit / Remove, or the "Remove Mochi from PawShare?" confirm in its place.
// apps: { status: 'loading' | 'ready' | 'error', list: this pet's applications }.
export default function ListingFoot({ animal, apps, onEdit, onRemoved }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('idle') // 'idle' | 'confirm' | 'removing'
  const [error, setError] = useState('')
  const { name } = animal
  const blocked = removeBlock(name, apps)

  async function remove() {
    setStep('removing')
    setError('')
    try {
      await deleteAnimal(animal._id)
      onRemoved(animal)
    } catch (err) {
      setError(err.message)
      setStep('confirm')
    }
  }

  if (step === 'idle') {
    return (
      <div className="foot listing-foot">
        <Pill label={LISTING_STATUS_LABEL[animal.status]} color={LISTING_STATUS_COLOR[animal.status]} />
        <span className="foot-btns">
          <Button onClick={() => onEdit(animal._id)} aria-label={`Edit ${name}`}>Edit</Button>
          <Button onClick={() => setStep('confirm')} aria-label={`Remove ${name}`}>Remove</Button>
        </span>
      </div>
    )
  }

  return (
    <div className="confirm listing-confirm" role="group" aria-label={`Remove ${name}`}>
      {blocked ? (
        <>
          <p>{blocked}</p>
          <span className="foot-btns">
            <Button onClick={() => setStep('idle')} autoFocus>Cancel</Button>
            <Button onClick={() => navigate('/shelter/applications')}>Open inbox</Button>
          </span>
        </>
      ) : (
        <>
          <p>{`Remove ${name} from PawShare?`}</p>
          {apps.status === 'loading' && <p className="confirm-small">Checking for applications...</p>}
          {error && <p className="confirm-err" role="alert">{error}</p>}
          <span className="foot-btns">
            <Button onClick={() => setStep('idle')} disabled={step === 'removing'} autoFocus>Cancel</Button>
            <Button variant="primary" onClick={remove} disabled={step === 'removing' || apps.status === 'loading'}>
              {step === 'removing' ? 'REMOVING...' : 'Yes, remove'}
            </Button>
          </span>
        </>
      )}
    </div>
  )
}
