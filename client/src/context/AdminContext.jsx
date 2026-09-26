import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { getShelters } from '../api/admin.js'
import { usePolling } from '../hooks/usePolling.js'

const AdminContext = createContext(null)
const EVERY = 60000

// Admins only: how many shelters are waiting for verification, for the "Control Panel (n)" task. Fetched on
// login, then every minute while the tab is visible. count is null until known (and for everyone else).
// refresh() fetches now, e.g. after a decision.
export function AdminProvider({ children }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [known, setKnown] = useState(null) // { userId, count }

  const refresh = useCallback(() => {
    if (!isAdmin) return
    const userId = user.id
    getShelters('pending')
      .then((list) => setKnown({ userId, count: list.length }))
      .catch(() => {
        // offline or logged out meanwhile: keep the last count
      })
  }, [isAdmin, user])

  useEffect(() => {
    refresh()
  }, [refresh])
  usePolling(refresh, EVERY, isAdmin)

  const count = isAdmin && known?.userId === user.id ? known.count : null
  const value = useMemo(() => ({ count, refresh }), [count, refresh])
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>')
  return ctx
}

// "Control Panel (2)" / "Control Panel" while the count loads
// eslint-disable-next-line react/only-export-components
export const controlPanelLabel = (count) => (count === null ? 'Control Panel' : `Control Panel (${count})`)

// The admin's taskbar item for any page (null for everyone else). current: it's the page you're on.
// eslint-disable-next-line react/only-export-components
export function useAdminTask(navigate, { current = false } = {}) {
  const { user } = useAuth()
  const { count } = useAdmin()
  if (user?.role !== 'admin') return null
  return { id: 'admin', label: controlPanelLabel(count), ...(!current && { onClick: () => navigate('/admin') }) }
}
