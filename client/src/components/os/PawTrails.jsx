import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useBoot } from '../../context/BootContext.jsx'
import { GAITS, MAX_PRINTS, REST_MS, makeTrail, nextEdge } from '../../utils/paws.js'
import './PawTrails.css'

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb) => {
  const mq = window.matchMedia?.(REDUCED)
  mq?.addEventListener('change', cb)
  return () => mq?.removeEventListener('change', cb)
}
const getReduced = () => window.matchMedia?.(REDUCED).matches ?? false

const subscribeVisibility = (cb) => {
  document.addEventListener('visibilitychange', cb)
  return () => document.removeEventListener('visibilitychange', cb)
}
const getHidden = () => document.hidden

const between = ([lo, hi]) => lo + Math.random() * (hi - lo)
// the screen without the scrollbar, so no print sits under it
const screenSize = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight })

// Dog: round main pad, 4 round toes, a claw dot above each. Toes up, centered.
function DogPrint() {
  return (
    <g>
      <circle cx="13" cy="17.5" r="6.5" />
      <circle cx="4.6" cy="10.2" r="2.7" />
      <circle cx="9.6" cy="5.8" r="2.7" />
      <circle cx="16.4" cy="5.8" r="2.7" />
      <circle cx="21.4" cy="10.2" r="2.7" />
      <circle cx="3.4" cy="6.6" r="0.9" />
      <circle cx="8.8" cy="2.2" r="0.9" />
      <circle cx="17.2" cy="2.2" r="0.9" />
      <circle cx="22.6" cy="6.6" r="0.9" />
    </g>
  )
}

// Cat: a smaller rounded pad, 4 oval toes, no claws
function CatPrint() {
  return (
    <g>
      <ellipse cx="9" cy="12.8" rx="4.4" ry="3.6" />
      <ellipse cx="3.3" cy="8" rx="1.5" ry="2.1" transform="rotate(-25 3.3 8)" />
      <ellipse cx="6.9" cy="4.6" rx="1.5" ry="2.1" transform="rotate(-8 6.9 4.6)" />
      <ellipse cx="11.1" cy="4.6" rx="1.5" ry="2.1" transform="rotate(8 11.1 4.6)" />
      <ellipse cx="14.7" cy="8" rx="1.5" ry="2.1" transform="rotate(25 14.7 8)" />
    </g>
  )
}

// One dog trail and one cat trail. JS only places prints, one step at a time; each print fades itself in and out
// (PawTrails.css) and is removed when its animation ends. paused: stop placing (the tab is hidden).
function Trails({ paused }) {
  const [prints, setPrints] = useState([])
  const nextId = useRef(0)
  // per kind: the trail being walked (null between trails), the next print in it, the edge it started from
  const walkers = useRef({ dog: { trail: null, i: 0, edge: null }, cat: { trail: null, i: 0, edge: null } })

  useEffect(() => {
    if (paused) return
    const timers = {}

    const walk = (kind) => {
      const w = walkers.current[kind]
      if (!w.trail) {
        w.edge = nextEdge(w.edge)
        w.trail = makeTrail(kind, screenSize(), w.edge)
        w.i = 0
      }
      const print = { id: nextId.current++, kind, ...w.trail[w.i++] }
      setPrints((list) => [...list, print].slice(-MAX_PRINTS))
      if (w.i < w.trail.length) {
        timers[kind] = setTimeout(walk, GAITS[kind].every, kind)
      } else {
        // off the screen: rest, then come back from another edge
        w.trail = null
        timers[kind] = setTimeout(walk, between(REST_MS), kind)
      }
    }

    for (const kind of ['dog', 'cat']) {
      const w = walkers.current[kind]
      // first start: a short wait so the two don't set off together; after a pause: carry on (or keep resting)
      const wait = w.edge == null ? between([500, 2500]) : w.trail ? GAITS[kind].every : between(REST_MS)
      timers[kind] = setTimeout(walk, wait, kind)
    }
    return () => Object.values(timers).forEach(clearTimeout)
  }, [paused])

  const remove = (id) => setPrints((list) => list.filter((p) => p.id !== id))

  return prints.map(({ id, kind, x, y, angle }) => {
    const { size } = GAITS[kind]
    return (
      <svg
        key={id}
        className={`paw paw--${kind}`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        focusable="false"
        style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
        onAnimationEnd={() => remove(id)}
      >
        {kind === 'dog' ? <DogPrint /> : <CatPrint />}
      </svg>
    )
  })
}

// Walking paw prints behind every window (mounted once, in ShellLayout). Decoration only: no pointer events,
// hidden from screen readers. Nothing at all while BOOT.EXE is up, when "Walking paws in background" is off
// (STARTUP.CFG) or with reduced motion.
export default function PawTrails() {
  const { booting, paws } = useBoot()
  const reduced = useSyncExternalStore(subscribeReduced, getReduced)
  const hidden = useSyncExternalStore(subscribeVisibility, getHidden)
  if (!paws || booting || reduced) return null
  return (
    <div className={`paw-trails${hidden ? ' paused' : ''}`} aria-hidden="true">
      <Trails paused={hidden} />
    </div>
  )
}
