import { describe, expect, it } from 'vitest'
import { checkInsTaskLabel, groupByApplication, isDue, stopState, summarize, validateUpdate, emptyUpdate } from './checkins.js'

// every date is local, so the day counts don't depend on the machine's time zone
const now = new Date(2026, 8, 27, 10, 0) // 27 Sept 2026, 10:00
const day = (d, h = 0) => new Date(2026, 8, d, h)
const pending = (dueDate) => ({ status: 'pending', dueDate })

describe('stopState (check-in due states)', () => {
  it('overdue once the due date has passed', () => {
    expect(stopState(pending(day(22)), now)).toEqual({ state: 'overdue', text: 'Overdue by 5 days' })
    expect(stopState(pending(day(26)), now)).toEqual({ state: 'overdue', text: 'Overdue by 1 day' })
    expect(stopState(pending(day(27, 9)), now)).toEqual({ state: 'overdue', text: 'Overdue since today' })
  })

  it('trusts the server when it says overdue', () => {
    expect(stopState({ ...pending(day(30)), isOverdue: true }, now).state).toBe('overdue')
  })

  it('due soon within a week', () => {
    expect(stopState(pending(day(27, 18)), now)).toEqual({ state: 'soon', text: 'Due today' })
    expect(stopState(pending(day(28)), now)).toEqual({ state: 'soon', text: 'Due tomorrow' })
    expect(stopState(pending(new Date(2026, 9, 4)), now)).toEqual({ state: 'soon', text: 'Due in 7 days' })
  })

  it('later beyond a week, done once completed', () => {
    expect(stopState(pending(new Date(2026, 9, 5)), now).state).toBe('later')
    expect(stopState({ status: 'pending' }, now)).toEqual({ state: 'later', text: 'No due date' })
    expect(stopState({ status: 'completed', dueDate: day(1) }, now)).toEqual({ state: 'done', text: 'Done' })
    expect(stopState({ status: 'completed', completedAt: day(2) }, now).text).toMatch(/^Done 2 Sept/)
  })

  it('isDue means overdue or soon', () => {
    expect(isDue(pending(day(20)), now)).toBe(true)
    expect(isDue(pending(day(29)), now)).toBe(true)
    expect(isDue(pending(new Date(2026, 10, 21)), now)).toBe(false)
    expect(isDue({ status: 'completed' }, now)).toBe(false)
  })
})

describe('grouping and summaries', () => {
  const checkIns = [
    { _id: 'c3', application: 'a1', kind: 'scheduled', label: '3 months', status: 'pending', dueDate: new Date(2026, 10, 21) },
    { _id: 'c1', application: 'a1', kind: 'scheduled', label: '1 week', status: 'completed', dueDate: day(1), completedAt: day(1), healthUpdate: { condition: 'good' } },
    { _id: 'c2', application: 'a1', kind: 'scheduled', label: '1 month', status: 'pending', dueDate: day(22) },
    { _id: 'x', application: 'a1', kind: 'adhoc', status: 'completed', completedAt: day(10), healthUpdate: { condition: 'great' } },
    { _id: 'b1', application: 'a2', kind: 'scheduled', label: '1 week', status: 'pending', dueDate: day(30) },
  ]

  it('groups by application: scheduled by due date, the log newest first', () => {
    const [a1, a2] = groupByApplication(checkIns)
    expect(a1.scheduled.map((c) => c._id)).toEqual(['c1', 'c2', 'c3'])
    expect(a1.log.map((c) => c._id)).toEqual(['x', 'c1'])
    expect(a2.scheduled.map((c) => c._id)).toEqual(['b1'])
  })

  it('summarize says overdue, soon or ok', () => {
    const [a1, a2] = groupByApplication(checkIns)
    expect(summarize(a1, now)).toMatchObject({ standing: 'overdue', next: { _id: 'c2' }, last: { _id: 'x' } })
    expect(summarize(a2, now)).toMatchObject({ standing: 'soon', last: null })
  })

  it('the taskbar label depends on the role', () => {
    expect(checkInsTaskLabel('adopter', null)).toBe('Check-ins')
    expect(checkInsTaskLabel('adopter', 1)).toBe('Check-ins (1 due)')
    expect(checkInsTaskLabel('shelter', 2)).toBe('Check-ins (2 overdue)')
  })
})

describe('validateUpdate', () => {
  it('needs a condition and a sensible weight', () => {
    expect(validateUpdate(emptyUpdate(), 'Bruno')).toEqual({ condition: 'Pick how Bruno is doing.' })
    expect(validateUpdate({ ...emptyUpdate(), condition: 'good', weight: '-3' }, 'Bruno')).toHaveProperty('weight')
    expect(validateUpdate({ ...emptyUpdate(), condition: 'good', weight: '31.5' }, 'Bruno')).toEqual({})
  })
})
