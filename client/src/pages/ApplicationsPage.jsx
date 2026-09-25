import { Link } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import '../components/ui/Button.css'
import './ApplyPage.css'

// Placeholder for My applications (/applications); the list arrives in session 11.
export default function ApplicationsPage() {
  return (
    <div className="desk apply-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title="MY_APPLICATIONS.EXE" className="apply">
        <div className="apply-body">
          <p className="lead">Your applications will be listed here soon.</p>
          <div className="apply-actions">
            <Link className="btn" to="/adopt">Back to the neighborhood</Link>
          </div>
        </div>
      </Window>
    </div>
  )
}
