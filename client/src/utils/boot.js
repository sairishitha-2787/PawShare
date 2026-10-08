// BOOT.EXE: the start-up screen that covers the API's cold start. Storage helpers and the timeline.

const BOOTED_KEY = 'pawshare-booted' // sessionStorage: already booted in this tab
const PREF_KEY = 'pawshare-boot' // localStorage: '0' = "Show boot screen" is off

// Storage can throw (private mode, blocked site data): then the boot screen just shows, and the setting isn't kept.
export function hasBooted() {
  try {
    return sessionStorage.getItem(BOOTED_KEY) === '1'
  } catch {
    return false
  }
}

export function markBooted() {
  try {
    sessionStorage.setItem(BOOTED_KEY, '1')
  } catch {
    // storage blocked: it shows again on refresh
  }
}

export function bootEnabled() {
  try {
    return localStorage.getItem(PREF_KEY) !== '0'
  } catch {
    return true
  }
}

export function setBootEnabled(on) {
  try {
    if (on) localStorage.removeItem(PREF_KEY)
    else localStorage.setItem(PREF_KEY, '0')
  } catch {
    // storage blocked: the setting lasts until the page is reloaded
  }
}

export const BOOT_LINES = ['CHECKING SHELTERS...', 'LOADING PETS...', 'WAKING SERVER...', 'STARTING DESKTOP...']
export const BLOCKS = 12
export const MIN_MS = 2200 // on screen at least this long
export const MAX_MS = 9000 // stop waiting for the API after this ("WAKING SERVER... SLOW")
export const REDUCED_MIN_MS = 600 // reduced motion: shortest time on screen

const SERVER_LINE = 2
const LINE_AT = [200, 700, 1200] // the first three lines; the last one follows the server's answer
const SERVER_LINE_MIN = 1500 // the server line shows its result no sooner than this
const LAST_LINE_GAP = 300 // server answer → "STARTING DESKTOP... OK"
const END_GAP = 400 // last line → close
const FULL_HOLD = 200 // the full bar stays this long before closing
const WAIT_BLOCKS = 9 // the bar stops here until the API answers

// What the screen shows t ms after it opened. server: null while waiting, else { at (ms), status: 'ok'|'slow' }.
// → { lines: [{ text, visible, status: 'ok'|'slow'|null }], blocks (filled, 0–12), done }
// Reduced motion: every line and the full bar at once; only the server line changes, and it still waits for the API.
export function bootFrame(t, server, { reduced = false } = {}) {
  const lineStatus = (i, resolved) => (i !== SERVER_LINE ? 'ok' : resolved ? server.status : null)

  if (reduced) {
    return {
      lines: BOOT_LINES.map((text, i) => ({ text, visible: true, status: lineStatus(i, server != null) })),
      blocks: BLOCKS,
      done: server != null && t >= REDUCED_MIN_MS,
    }
  }

  const resolvedAt = server ? Math.max(server.at, SERVER_LINE_MIN) : Infinity
  const lastAt = resolvedAt + LAST_LINE_GAP
  const endAt = Math.max(MIN_MS, lastAt + END_GAP)
  const showAt = [...LINE_AT, lastAt]

  const waiting = (ms) => Math.min(WAIT_BLOCKS, Math.floor((ms / MIN_MS) * BLOCKS))
  let blocks = waiting(t)
  if (t >= resolvedAt) {
    // from wherever the bar was when the API answered, fill the rest by the end
    const base = waiting(resolvedAt)
    const share = Math.min(1, (t - resolvedAt) / Math.max(1, endAt - FULL_HOLD - resolvedAt))
    blocks = base + Math.floor((BLOCKS - base) * share)
  }

  return {
    lines: BOOT_LINES.map((text, i) => ({ text, visible: t >= showAt[i], status: lineStatus(i, t >= resolvedAt) })),
    blocks,
    done: t >= endAt,
  }
}
