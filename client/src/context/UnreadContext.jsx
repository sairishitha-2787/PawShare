import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { unreadCount } from '../api/threads.js'
import { usePolling } from '../hooks/usePolling.js'

const UnreadContext = createContext(null)
const EVERY = 15000

// Unread messages for the logged-in user, for the "Messages (n)" task: fetched on login, then every 15s while
// the tab is visible. count is null until known (or while logged out). refresh() fetches now, e.g. after the
// messenger marks a thread read.
export function UnreadProvider({ children }) {
  const { user } = useAuth()
  const [known, setKnown] = useState(null) // { userId, count }

  const refresh = useCallback(() => {
    if (!user) return
    const userId = user.id
    unreadCount()
      .then((count) => setKnown({ userId, count }))
      .catch(() => {
        // offline or logged out meanwhile: keep the last count
      })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])
  usePolling(refresh, EVERY, Boolean(user))

  // a count fetched for someone else (before a logout/login) doesn't count
  const count = user && known?.userId === user.id ? known.count : null
  const value = useMemo(() => ({ count, refresh }), [count, refresh])
  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useUnread() {
  const ctx = useContext(UnreadContext)
  if (!ctx) throw new Error('useUnread must be used inside <UnreadProvider>')
  return ctx
}

