import { describe, expect, it } from 'vitest'
import { BLOCKS, MAX_MS, MIN_MS, REDUCED_MIN_MS, bootFrame } from './boot.js'

const visible = (frame) => frame.lines.filter((l) => l.visible).length
const serverLine = (frame) => frame.lines[2]

describe('bootFrame', () => {
  it('shows the lines one by one and waits on the server line', () => {
    expect(visible(bootFrame(0, null))).toBe(0)
    expect(visible(bootFrame(800, null))).toBe(2)
    const stuck = bootFrame(5000, null)
    expect(visible(stuck)).toBe(3)
    expect(serverLine(stuck).status).toBe(null)
    expect(stuck.blocks).toBeLessThan(BLOCKS)
    expect(stuck.done).toBe(false)
  })

  it('stays on screen for the minimum time when the API answers at once', () => {
    const server = { at: 100, status: 'ok' }
    expect(bootFrame(MIN_MS - 1, server).done).toBe(false)
    const end = bootFrame(MIN_MS, server)
    expect(end.done).toBe(true)
    expect(visible(end)).toBe(4)
    expect(serverLine(end).status).toBe('ok')
    expect(end.blocks).toBe(BLOCKS)
  })

  it('finishes soon after a late answer, and marks a timeout SLOW', () => {
    const slow = { at: MAX_MS, status: 'slow' }
    expect(serverLine(bootFrame(MAX_MS, slow)).status).toBe('slow')
    expect(bootFrame(MAX_MS + 1000, slow).done).toBe(true)
  })

  it('never empties the bar', () => {
    for (const at of [0, 1000, 1900, 4000, MAX_MS]) {
      let last = 0
      for (let t = 0; t <= MAX_MS + 1000; t += 50) {
        const { blocks } = bootFrame(t, t >= at ? { at, status: 'ok' } : null)
        expect(blocks).toBeGreaterThanOrEqual(last)
        last = blocks
      }
      expect(last).toBe(BLOCKS)
    }
  })

  it('reduced motion: everything at once, still waits for the API', () => {
    const waiting = bootFrame(0, null, { reduced: true })
    expect(visible(waiting)).toBe(4)
    expect(waiting.blocks).toBe(BLOCKS)
    expect(serverLine(waiting).status).toBe(null)
    expect(bootFrame(3000, null, { reduced: true }).done).toBe(false)
    expect(bootFrame(REDUCED_MIN_MS - 1, { at: 50, status: 'ok' }, { reduced: true }).done).toBe(false)
    expect(bootFrame(REDUCED_MIN_MS, { at: 50, status: 'ok' }, { reduced: true }).done).toBe(true)
  })
})
