import { Link, useParams } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import './ApplyPage.css'

// Placeholder for the adoption / foster application form (/apply/:petId).
export default function ApplyPage() {
  const { petId } = useParams()
  return (
    <div className="desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title="APPLICATION.EXE" className="apply">
        <div className="body">
          <p>The application form is on its way. Check back soon.</p>
          <Link className="btn" to={`/adopt/${encodeURIComponent(petId)}`}>Back to profile</Link>
        </div>
      </Window>
    </div>
  )
}
