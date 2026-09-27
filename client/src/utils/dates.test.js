import { describe, expect, it } from 'vitest'
import { formatDay, formatLong, formatMonth, formatShort } from './dates.js'

describe('date labels', () => {
  it('formatDay reads a calendar date as a local date, whatever the time zone', () => {
    expect(formatDay('2026-10-12')).toBe('12 Oct 2026')
    // the server stores due dates as UTC midnight; that must not slip to the 11th
    expect(formatDay('2026-10-12T00:00:00.000Z')).toBe('12 Oct 2026')
    expect(formatDay('2027-01-01')).toBe('1 Jan 2027')
  })

  it('formatShort leaves out the year only for this year', () => {
    const thisYear = new Date().getFullYear()
    expect(formatShort(new Date(thisYear, 2, 5, 12))).toBe('5 Mar')
    expect(formatShort(new Date(2020, 2, 5, 12))).toBe('5 Mar 2020')
  })

  it('formatLong always has the year, formatMonth only month and year', () => {
    const d = new Date(2026, 7, 23, 15, 30)
    expect(formatLong(d)).toBe('23 Aug 2026')
    expect(formatMonth(d)).toBe('Aug 2026')
  })
})
