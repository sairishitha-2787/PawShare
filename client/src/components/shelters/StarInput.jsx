import { useRef, useState } from 'react'
import { PixelStar } from './Stars.jsx'

const VALUES = [1, 2, 3, 4, 5]
const clamp = (n) => Math.min(5, Math.max(1, n))

// 1–5 stars as a radio group: click a star, or use the arrow keys (Home/End for 1/5). value 0 = none picked yet.
// Only the checked star (or the first, before a pick) is in the tab order, like native radios.
export default function StarInput({ value, onChange, labelledBy, describedBy, invalid, groupRef }) {
  const refs = useRef([])
  const [hover, setHover] = useState(0)
  const shown = hover || value

  function pick(n) {
    onChange(n)
    refs.current[n - 1]?.focus()
  }

  function onKeyDown(e) {
    const next = {
      ArrowRight: clamp((value || 0) + 1),
      ArrowUp: clamp((value || 0) + 1),
      ArrowLeft: clamp((value || 2) - 1),
      ArrowDown: clamp((value || 2) - 1),
      Home: 1,
      End: 5,
    }[e.key]
    if (!next) return
    e.preventDefault()
    pick(next)
  }

  return (
    <div
      ref={groupRef}
      className="star-input"
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required="true"
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(0)}
    >
      {VALUES.map((n) => (
        <button
          key={n}
          ref={(el) => (refs.current[n - 1] = el)}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
          tabIndex={(value ? value === n : n === 1) ? 0 : -1}
          onClick={() => pick(n)}
          onMouseEnter={() => setHover(n)}
        >
          <PixelStar fill={shown >= n ? 1 : 0} scale={3} />
        </button>
      ))}
      <span className="star-count" aria-hidden="true">{value ? `${value} / 5` : 'Pick 1–5'}</span>
    </div>
  )
}
