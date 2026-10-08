import { describe, expect, it } from 'vitest'
import { GAITS, makeTrail, nextEdge } from './paws.js'

const screen = { w: 1200, h: 800 }
const off = ({ x, y }, margin) => x < margin || y < margin || x > screen.w - margin || y > screen.h - margin

// a repeatable "random": cycles through the given values
const seq = (...values) => {
  let i = 0
  return () => values[i++ % values.length]
}

describe('makeTrail', () => {
  it('walks from just off one edge to just off the opposite one', () => {
    for (const edge of ['top', 'right', 'bottom', 'left']) {
      const prints = makeTrail('dog', screen, edge, seq(0.3, 0.6, 0.8, 0.2))
      const first = prints[0]
      const last = prints.at(-1)
      expect(off(first, 0)).toBe(true)
      expect(off(last, 0)).toBe(true)
      if (edge === 'left') {
        expect(first.x).toBeLessThan(0)
        expect(last.x).toBeGreaterThan(screen.w - GAITS.dog.step)
      }
      if (edge === 'top') expect(first.y).toBeLessThan(0)
    }
  })

  it('spaces prints about a step apart', () => {
    for (const kind of ['dog', 'cat']) {
      const { step, gap } = GAITS[kind]
      const prints = makeTrail(kind, screen, 'left', seq(0.5, 0.5, 0.5, 0.9))
      expect(prints.length).toBeGreaterThan(screen.w / step - 2)
      for (let i = 1; i < prints.length; i++) {
        const d = Math.hypot(prints[i].x - prints[i - 1].x, prints[i].y - prints[i - 1].y)
        // a step along the path, give or take the left/right offset (a little more on the outside of the curve)
        expect(d).toBeGreaterThan(step - 1)
        expect(d).toBeLessThan(step + 2 * gap)
      }
    }
  })

  it('faces the direction of travel', () => {
    // a straight-ish walk left to right faces right (90°); top to bottom faces down (180°)
    const straight = seq(0.5, 0.5, 0, 0.9) // bow 10%, so the middle print is nearly straight
    const across = makeTrail('cat', screen, 'left', straight)
    expect(across[Math.floor(across.length / 2)].angle).toBeCloseTo(90, -1)
    const down = makeTrail('cat', screen, 'top', straight)
    expect(down[Math.floor(down.length / 2)].angle).toBeCloseTo(180, -1)
  })
})

describe('nextEdge', () => {
  it('never starts from the same edge twice in a row', () => {
    for (const last of ['top', 'right', 'bottom', 'left']) {
      for (const r of [0, 0.34, 0.67, 0.999]) expect(nextEdge(last, () => r)).not.toBe(last)
    }
  })
})
