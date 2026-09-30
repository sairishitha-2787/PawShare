import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { useUnread } from './UnreadContext.jsx'
import { useCheckIns } from './CheckInsContext.jsx'
import { useAdmin } from './AdminContext.jsx'
import { useMyApplications } from '../hooks/useMyApplications.js'
import { useReceivedApplications } from '../hooks/useReceivedApplications.js'

const TaskCountsContext = createContext(null)

const pendingIn = (list) => (list.status === 'ready' ? list.applications.filter((a) => a.status === 'pending').length : null)

// Loads one user's applications and reports the pending count. Keyed by the user id, so a count never
// carries over to the next account. Refetches quietly on every navigation (a page may have changed it),
// and when a page asks (nudge changes).
function ApplicationCounts({ role, pathname, nudge, onCount }) {
  const isAdopter = role === 'adopter'
  const mine = useMyApplications(isAdopter)
  const received = useReceivedApplications(!isAdopter)
  const list = isAdopter ? mine : received
  const { refresh } = list
  const count = pendingIn(list)

  const first = useRef(true)
  useEffect(() => {
    if (first.current) first.current = false
    else refresh()
  }, [pathname, nudge, refresh])

  useEffect(() => {
    onCount(count)
  }, [count, onCount])
  return null
}

// The numbers shared by the taskbar, the Start menu and the desktop: pending applications (adopters) or
// pending applications received (shelters, admins), check-ins, unread messages, shelters waiting (admins).
// A page holding a fresher list publishes its own number with usePublishTaskCount, which wins while it's mounted.
export function TaskCountsProvider({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { count: unread } = useUnread()
  const { count: checkIns } = useCheckIns()
  const { count: admin } = useAdmin()
  const [apps, setApps] = useState(null) // { userId, count }
  const [published, setPublished] = useState({})
  const [nudge, setNudge] = useState(0)
  const refreshApplications = useCallback(() => setNudge((n) => n + 1), [])

  const userId = user?.id
  const onCount = useCallback((count) => setApps({ userId, count }), [userId])
  const appCount = user && apps?.userId === user.id ? apps.count : null

  const publish = useCallback((key, n) => {
    setPublished((p) => {
      if (n == null) {
        if (!(key in p)) return p
        const { [key]: _gone, ...rest } = p
        return rest
      }
      return p[key] === n ? p : { ...p, [key]: n }
    })
  }, [])

  const counts = useMemo(
    () => ({
      applications: user?.role === 'adopter' ? (published.applications ?? appCount) : null,
      inbox: user && user.role !== 'adopter' ? (published.inbox ?? appCount) : null,
      checkIns,
      unread,
      admin,
      favorites: published.favorites ?? null,
    }),
    [user, published, appCount, checkIns, unread, admin],
  )
  const value = useMemo(() => ({ counts, publish, refreshApplications }), [counts, publish, refreshApplications])

  return (
    <TaskCountsContext.Provider value={value}>
      {user && <ApplicationCounts key={user.id} role={user.role} pathname={pathname} nudge={nudge} onCount={onCount} />}
      {children}
    </TaskCountsContext.Provider>
  )
}

// { applications, inbox, checkIns, unread, admin, favorites }: each null until known (or not for this role)
// eslint-disable-next-line react/only-export-components
export function useTaskCounts() {
  const ctx = useContext(TaskCountsContext)
  if (!ctx) throw new Error('useTaskCounts must be used inside <TaskCountsProvider>')
  return ctx.counts
}

// → a function that refetches the applications count now, for a page that changed it without navigating
// (APPLY.EXE after "Send application"). Does nothing outside the shell.
// eslint-disable-next-line react/only-export-components
export function useRefreshTaskCounts() {
  const ctx = useContext(TaskCountsContext)
  return ctx?.refreshApplications || noop
}
const noop = () => {}

// A page's own count for a task ('applications' | 'inbox' | 'favorites'), shown instead of the shared one
// while the page is mounted. n = null publishes nothing.
// eslint-disable-next-line react/only-export-components
export function usePublishTaskCount(key, n) {
  const ctx = useContext(TaskCountsContext)
  const publish = ctx?.publish
  useEffect(() => {
    if (!publish) return
    publish(key, n)
    return () => publish(key, null)
  }, [publish, key, n])
}
