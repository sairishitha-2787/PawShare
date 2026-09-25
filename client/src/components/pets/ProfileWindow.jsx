import { useId } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Window from '../ui/Window.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../ui/Button.jsx'
import PetFace from './PetFace.jsx'
import { useFavorites } from '../../context/FavoritesContext.jsx'
import { SPECIES_LABEL } from '../../utils/pets.js'
import './ProfileWindow.css'

// primary button label per status; every one goes to the application page
const ACTION_LABEL = {
  urgent: 'Offer to foster',
  available: 'Start adoption application',
  pending: 'Join the waitlist',
}

// <NAME>.PROFILE dialog. Port of openPet() in the reference.
// fallbackFocus: see Modal (used when the button that opened it is gone by close time).
export default function ProfileWindow({ pet, onClose, fallbackFocus }) {
  const titleId = useId()
  const { isFav, toggleFav } = useFavorites()
  const navigate = useNavigate()
  const fav = isFav(pet.id)

  return (
    <Modal open onClose={onClose} labelledBy={titleId} fallbackFocus={fallbackFocus}>
      <Window as="div" title={`${pet.name.toUpperCase()}.PROFILE`} onClose={onClose} closeLabel="Close profile">
        <div className="pbody">
          <div className="phead">
            <PetFace pet={pet} size={120} />
            <div>
              <h2 id={titleId}>{pet.name}</h2>
              <p className="sub">{`${SPECIES_LABEL[pet.species]} · ${pet.shelter}, ${pet.area}`}</p>
              <Pill status={pet.status} />
            </div>
          </div>

          <dl className="stats">
            <div><dt>AGE</dt><dd>{pet.age}</dd></div>
            <div><dt>SEX</dt><dd>{pet.sex}</dd></div>
            <div><dt>SIZE</dt><dd>{pet.size}</dd></div>
            <div className="wide"><dt>BREED</dt><dd>{pet.breed}</dd></div>
            <div><dt>VACCINES</dt><dd>{pet.vax}</dd></div>
          </dl>

          <div className="tags">
            {pet.tags.map((t) => <span key={t}>{t}</span>)}
          </div>
          <p className="blurb">{pet.blurb}</p>

          <div className="actions">
            <Button variant="primary" onClick={() => navigate(`/apply/${pet.id}`)}>{ACTION_LABEL[pet.status]}</Button>
            <Button aria-pressed={fav} onClick={() => toggleFav(pet.id)}>
              {fav ? '♥ Saved to favorites' : '♡ Add to favorites'}
            </Button>
          </div>
        </div>
      </Window>
    </Modal>
  )
}
