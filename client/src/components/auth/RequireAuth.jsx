import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import LoadingWindow from '../ui/LoadingWindow.jsx'
import './RequireAuth.css'

// Wraps a page that needs a login. Logged-out visitors go to /login; the page they wanted rides along in
// router state (not the URL) so the login page can send them back.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-check">
        <LoadingWindow label="Checking your login" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
