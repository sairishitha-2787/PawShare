import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { startThread } from '../../api/threads.js'
import './MessageButton.css'

// Opens (or starts) the conversation and goes to /messages/:threadId. to: startThread's body
// ({ animalId } and/or { recipientId }). Logged out → the login page first, which sends them back here.
export default function MessageButton({ to, variant, children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function open() {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setBusy(true)
    setError('')
    try {
      const thread = await startThread(to)
      // the list may not have it yet: the messenger uses this copy for the header until it does
      navigate(`/messages/${encodeURIComponent(thread._id)}`, { state: { thread } })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <span className="msg-btn">
      <Button variant={variant} onClick={open} disabled={busy}>
        {busy ? 'OPENING...' : children}
      </Button>
      {error && <span className="msg-btn-err" role="alert">{error}</span>}
    </span>
  )
}
