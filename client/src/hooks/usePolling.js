import { useEffect, useRef } from 'react'

// Calls fn every `ms` while enabled and the tab is visible. Hiding the tab pauses it; showing it again calls
// fn straight away and restarts the timer. fn can change between renders (the latest one is called).
export function usePolling(fn, ms, enabled = true) {
  const latest = useRef(fn)
  useEffect(() => {
    latest.current = fn
  })

  useEffect(() => {
    if (!enabled) return
    let timer = null
    const start = () => {
      clearInterval(timer)
      timer = setInterval(() => latest.current(), ms)
    }
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(timer)
      } else {
        latest.current()
        start()
      }
    }
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ms, enabled])
}
