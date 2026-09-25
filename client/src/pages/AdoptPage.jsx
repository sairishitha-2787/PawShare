import Window from '../components/ui/Window.jsx'
import Neighborhood from '../components/map/Neighborhood.jsx'
import { mockPets } from '../data/mockPets.js'
import './AdoptPage.css'

export default function AdoptPage() {
  const pets = mockPets

  return (
    <div className="desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
        <p>Mockup · Neighborhood view · sample pets from Bengaluru shelters</p>
      </header>

      <Window title={`NEIGHBORHOOD.EXE — ${pets.length} pets nearby`} aria-label="Neighborhood">
        <div className="main">
          <Neighborhood pets={pets} onOpen={(id) => console.log('open pet', id)} />
        </div>
      </Window>
    </div>
  )
}
