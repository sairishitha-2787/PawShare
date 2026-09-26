import { useCallback, useEffect, useState } from 'react'

// Data from fetcher(options) (a module-level function or a useCallback, so it stays the same between renders).
// status: 'idle' (enabled is false) | 'loading' | 'ready' | 'error'. retry() shows LOADING again; refresh()
// refetches quietly, keeping the current data on screen (and on screen if it fails). update(fn) changes the
// data in place, e.g. to drop a removed item.
export function useLoad(fetcher, enabled = true) {
  const [load, setLoad] = useState({ status: enabled ? 'loading' : 'idle', data: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    fetcher({ signal: ctrl.signal })
      .then((data) => setLoad({ status: 'ready', data }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoad((l) => (l.status === 'ready' ? l : { status: 'error', data: null, error: err }))
      })
    return () => ctrl.abort()
  }, [fetcher, enabled, attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading', data: null })
    setAttempt((n) => n + 1)
  }, [])
  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  const update = useCallback((fn) => setLoad((l) => (l.status === 'ready' ? { ...l, data: fn(l.data) } : l)), [])

  return { ...load, retry, refresh, update }
}
