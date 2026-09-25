import { Link } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import '../components/ui/Button.css'
import './ApplyPage.css'

// A page that arrives in a later session: its window, one line, and a way back.
export default function PlaceholderPage({ title, text }) {
  return (
    <div className="desk apply-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title={title} className="apply">
        <div className="apply-body">
          <p className="lead">{text}</p>
          <div className="apply-actions">
            <Link className="btn" to="/adopt">Back to the neighborhood</Link>
          </div>
        </div>
      </Window>
    </div>
  )
}
