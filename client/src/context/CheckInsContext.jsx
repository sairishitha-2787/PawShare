import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { getMyCheckIns, getReceivedCheckIns } from '../api/checkins.js'
import { SOON_DAYS, checkInsTaskLabel } from '../utils/checkins.js'
import { usePolling } from '../hooks/usePolling.js'

const CheckInsContext = createContext(null)
const EVERY = 60000

// Adopters: check-ins due within 7 days or overdue. Shelters (and admins): adoptions with an overdue check-in.
function fetchCount(role) {
  if (role === 'adopter') return getMyCheckIns({ dueWithin: SOON_DAYS }).then((list) => list.length)
  return getReceivedCheckIns({ status: 'overdue' }).then((list) => new Set(list.map((c) => String(c.application))).size)
}

// The number for the "Check-ins (n due)" / "Check-ins (n overdue)" task: fetched on login, then every minute
// while the tab is visible. count is null until known. refresh() fetches now, e.g. after a check-in is saved.
export function CheckInsProvider({ children }) {
  const { user } = useAuth()
  const [known, setKnown] = useState(null) // { userId, count }

  const refresh = useCallback(() => {
    if (!user) return
    const userId = user.id
    fetchCount(user.role)
      .then((count) => setKnown({ userId, count }))
      .catch(() => {
        // offline or logged out meanwhile: keep the last count
      })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])
  usePolling(refresh, EVERY, Boolean(user))

  const count = user && known?.userId === user.id ? known.count : null
  const value = useMemo(() => ({ count, refresh }), [count, refresh])
  return <CheckInsContext.Provider value={value}>{children}</CheckInsContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useCheckIns() {
  const ctx = useContext(CheckInsContext)
  if (!ctx) throw new Error('useCheckIns must be used inside <CheckInsProvider>')
  return ctx
}

// The taskbar item for any page. Off its own page it hides below 520px unless something needs doing.
// eslint-disable-next-line react/only-export-components
export function useCheckInsTask(navigate, { current = false } = {}) {
  const { user } = useAuth()
  const { count } = useCheckIns()
  if (!user) return null
  const path = user.role === 'adopter' ? '/checkins' : '/shelter/checkins'
  return {
    id: 'checkins',
    label: checkInsTaskLabel(user.role, count),
    ...(!current && { onClick: () => navigate(path), hideOnSmall: !count }),
  }
}
