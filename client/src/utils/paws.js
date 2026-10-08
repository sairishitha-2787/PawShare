// Walking paw trails behind the windows: the Settings preference and the path a trail walks.

const PREF_KEY = 'pawshare-paws' // localStorage: '0' = "Walking paws in background" is off

// Storage can throw (private mode, blocked site data): then the paws just walk, and the setting isn't kept.
export function pawsEnabled() {
  try {
    return localStorage.getItem(PREF_KEY) !== '0'
  } catch {
    return true
  }
}

export function setPawsEnabled(on) {
  try {
    if (on) localStorage.removeItem(PREF_KEY)
    else localStorage.setItem(PREF_KEY, '0')
  } catch {
    // storage blocked: the setting lasts until the page is reloaded
  }
}

// every: ms between prints, step: px along the path, gap: px each print sits left/right of it, size: px
export const GAITS = {
  dog: { every: 420, step: 34, gap: 8, size: 26 },
  cat: { every: 300, step: 22, gap: 5, size: 18 },
}
export const PRINT_MS = 3000 // 200ms fade in, ~2.5s shown, 300ms fade out (PawTrails.css)
export const MAX_PRINTS = 20
export const REST_MS = [3000, 6000] // between one trail leaving and the next starting

const EDGES = ['top', 'right', 'bottom', 'left']
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

// Any edge but the one the last trail started from
export function nextEdge(last, rand = Math.random) {
  const choices = EDGES.filter((e) => e !== last)
  return choices[Math.floor(rand() * choices.length) % choices.length]
}

// A point just outside `edge`, somewhere in its middle 70%
function offEdge(edge, w, h, margin, rand) {
  const along = 0.15 + rand() * 0.7
  if (edge === 'top') return { x: along * w, y: -margin }
  if (edge === 'bottom') return { x: along * w, y: h + margin }
  if (edge === 'left') return { x: -margin, y: along * h }
  return { x: w + margin, y: along * h }
}

// The prints of one trail across a w×h screen, from just outside `edge` to just outside the opposite one, along a
// gentle curve (a quadratic Bézier bowed sideways by 10–25% of its length). Prints are evenly spaced, alternate
// left/right of the path and turn to face the way it goes (angle in degrees, 0 = toes up).
// → [{ x, y, angle }]
export function makeTrail(kind, { w, h }, edge, rand = Math.random) {
  const { step, gap, size } = GAITS[kind]
  const a = offEdge(edge, w, h, size, rand)
  const b = offEdge(OPPOSITE[edge], w, h, size + step, rand) // a step further, so the last print is off screen too
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const bow = (0.1 + rand() * 0.15) * len * (rand() < 0.5 ? -1 : 1)
  const c = { x: (a.x + b.x) / 2 - (dy / len) * bow, y: (a.y + b.y) / 2 + (dx / len) * bow }

  const at = (t) => ({
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
  })
  const tangent = (t) => ({
    x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x),
    y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y),
  })

  // walk the curve in small pieces and drop a print every `step` px of distance
  const prints = []
  const SAMPLES = 400
  let prev = a
  let walked = step // the first print goes right at the start
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    const p = at(t)
    walked += Math.hypot(p.x - prev.x, p.y - prev.y)
    prev = p
    if (walked < step) continue
    walked -= step
    const d = tangent(t)
    const dl = Math.hypot(d.x, d.y) || 1
    const side = prints.length % 2 ? 1 : -1 // left, right, left...
    prints.push({
      x: p.x + (-d.y / dl) * gap * side,
      y: p.y + (d.x / dl) * gap * side,
      angle: (Math.atan2(d.y, d.x) * 180) / Math.PI + 90,
    })
  }
  return prints
}
