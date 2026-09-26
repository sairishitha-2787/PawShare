import Window from '../ui/Window.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../ui/Button.jsx'
import PetFace from './PetFace.jsx'
import ShelterLink from '../shelters/ShelterLink.jsx'
import { houseTypeFor } from '../../utils/pets.js'
import './PetCard.css'

const BAR = { dog: 'pink', cat: 'lav', bird: 'mint', hutch: 'sun' }

// One pet in the Full list view. Port of renderList() in the reference.
// The last line is the area and the shelter (a link to its profile); detail replaces it (MY_PETS/, a shelter's own
// PETS tab). MY_PETS/ also swaps the footer (pill + Open) for its own with foot.
export default function PetCard({ pet, onOpen, detail, foot }) {
  const file = `${pet.name}.${pet.species === 'guinea' ? 'PIG' : pet.species}`
  return (
    <Window as="article" title={file} barColor={BAR[houseTypeFor(pet.species)]} className="card">
      <div className="inner">
        <PetFace pet={pet} size={64} />
        <div>
          <h4>{pet.name}</h4>
          <p>{`${pet.age} · ${pet.breed}`}</p>
          <p>
            {detail ?? (
              <>
                {pet.area}
                {pet.area && ' · '}
                <ShelterLink id={pet.shelterId} name={pet.shelter} />
              </>
            )}
          </p>
        </div>
      </div>
      {foot ?? (
        <div className="foot">
          <Pill status={pet.status} />
          <Button onClick={() => onOpen?.(pet.id)} aria-label={`Open ${pet.name}'s profile`}>Open</Button>
        </div>
      )}
    </Window>
  )
}
