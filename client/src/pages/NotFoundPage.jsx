import { Link, useLocation } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import './NotFoundPage.css'

// Any unknown route: FILE NOT FOUND, with the way home and to the map.
export default function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <div className="desk missing-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title="FILE NOT FOUND" barColor="pink" className="missing" role="alert">
        <div className="missing-body">
          <p>
            We couldn&apos;t find <code>{pathname}</code>.
          </p>
          <div className="missing-actions">
            <Link className="btn" to="/">Go home</Link>
            <Link className="btn primary" to="/adopt">Open the neighborhood</Link>
          </div>
        </div>
      </Window>
    </div>
  )
}
