import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import BootScreen from '../components/os/BootScreen.jsx'
import { bootEnabled, hasBooted, markBooted, setBootEnabled } from '../utils/boot.js'

const BootContext = createContext(null)

// Shows BOOT.EXE over the shell once per browser session (unless "Show boot screen" is off in Settings).
// replay() shows it again (Settings, the Start menu, the dev kit). The route underneath is untouched, so deep
// links keep working; when it closes, focus moves to the page. skip: never show it (no API URL configured).
export function BootProvider({ skip = false, children }) {
  const [booting, setBooting] = useState(() => !skip && bootEnabled() && !hasBooted())
  const [enabled, setEnabledState] = useState(bootEnabled)

  const replay = useCallback(() => setBooting(true), [])
  const setEnabled = useCallback((on) => {
    setBootEnabled(on)
    setEnabledState(on)
  }, [])
  const done = useCallback(() => {
    markBooted()
    setBooting(false)
    document.getElementById('page')?.focus()
  }, [])

  const value = useMemo(() => ({ replay, enabled, setEnabled }), [replay, enabled, setEnabled])
  return (
    <BootContext.Provider value={value}>
      {children}
      {booting && <BootScreen onDone={done} />}
    </BootContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function useBoot() {
  return useContext(BootContext)
}
