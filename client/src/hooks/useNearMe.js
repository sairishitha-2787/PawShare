import { useState } from 'react'
import { roundCoord } from '../utils/geo.js'

// "Near me": asks the browser for a location; if that's blocked or unavailable, opens a picker of areas.
// onPick(near) gets an area key or "lng,lat" (see ?near= in utils/search.js).
// → { mode: 'idle' | 'locating' | 'picking', reason, locate(), openPicker(), cancel(), pick(key) }
export function useNearMe(onPick) {
  const [ui, setUi] = useState({ mode: 'idle', reason: '' })

  const pick = (key) => {
    setUi({ mode: 'idle', reason: '' })
    onPick(key)
  }
  const openPicker = (reason = '') => setUi({ mode: 'picking', reason })
  const cancel = () => setUi({ mode: 'idle', reason: '' })

  const locate = () => {
    if (!navigator.geolocation) return openPicker("This browser can't share a location.")
    setUi({ mode: 'locating', reason: '' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => pick(`${roundCoord(coords.longitude)},${roundCoord(coords.latitude)}`),
      (err) => openPicker(err.code === err.PERMISSION_DENIED ? 'Location access is blocked.' : "Couldn't find your location."),
      { timeout: 10000, maximumAge: 10 * 60 * 1000 },
    )
  }

  return { ...ui, locate, openPicker, cancel, pick }
}
