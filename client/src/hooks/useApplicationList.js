import { useCallback, useEffect, useState } from 'react'

// A list of applications from fetchList(query, options) (a module-level function, so it stays the same).
// status: 'idle' (enabled is false) | 'loading' | 'ready' | 'error'.
// retry() shows LOADING again; refresh() refetches quietly, keeping the current list on screen.
// patch(id, fields) updates one application in place (e.g. with what a PATCH returned).
export function useApplicationList(fetchList, enabled = true) {
  const [load, setLoad] = useState({ status: enabled ? 'loading' : 'idle', applications: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    fetchList(undefined, { signal: ctrl.signal })
      .then((applications) => setLoad({ status: 'ready', applications }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        // a failed quiet refresh keeps the list it already has
        setLoad((l) => (l.status === 'ready' ? l : { status: 'error', applications: [], error: err }))
      })
    return () => ctrl.abort()
  }, [fetchList, enabled, attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading', applications: [] })
    setAttempt((n) => n + 1)
  }, [])
  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  const patch = useCallback((id, fields) => {
    setLoad((l) => ({ ...l, applications: l.applications.map((a) => (a._id === id ? { ...a, ...fields } : a)) }))
  }, [])

  return { ...load, retry, refresh, patch }
}
