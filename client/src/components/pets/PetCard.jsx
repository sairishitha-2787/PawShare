import Window from '../ui/Window.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../ui/Button.jsx'
import PetFace from './PetFace.jsx'
import { houseTypeFor } from '../../utils/pets.js'
import './PetCard.css'

const BAR = { dog: 'pink', cat: 'lav', hutch: 'sun' }

// One pet in the Full list view. Port of renderList() in the reference.
export default function PetCard({ pet, onOpen }) {
  const file = `${pet.name}.${pet.species === 'guinea' ? 'PIG' : pet.species}`
  return (
    <Window as="article" title={file} barColor={BAR[houseTypeFor(pet.species)]} className="card">
      <div className="inner">
        <PetFace pet={pet} size={64} />
        <div>
          <h4>{pet.name}</h4>
          <p>{`${pet.age} · ${pet.breed}`}</p>
          <p>{pet.area}</p>
        </div>
      </div>
      <div className="foot">
        <Pill status={pet.status} />
        <Button onClick={() => onOpen?.(pet.id)} aria-label={`Open ${pet.name}'s profile`}>Open</Button>
      </div>
    </Window>
  )
}
