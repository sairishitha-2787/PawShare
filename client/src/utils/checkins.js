import { formatShort } from './dates.js'
import { isHttpUrl } from './listing.js'

// A health update's condition (server/models/CheckIn.js), in chip order. The pill always carries the word too.
export const CONDITIONS = ['great', 'good', 'fair', 'poor']
export const CONDITION_LABEL = { great: 'Great', good: 'Good', fair: 'Fair', poor: 'Poor' }
export const CONDITION_COLOR = { great: 'var(--mint)', good: 'var(--mint-soft)', fair: 'var(--sun)', poor: 'var(--pink)' }

// the server's limits for a health update
export const MAX = { weightKg: 200, notes: 2000, photos: 3, photoUrl: 500 }

// "due soon" on the timeline and in the taskbar count
export const SOON_DAYS = 7

const DAY = 24 * 60 * 60 * 1000
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
// whole calendar days from today to the date (negative once it's past)
const daysUntil = (date, now = new Date()) => Math.round((dayStart(new Date(date)) - dayStart(now)) / DAY)
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Where a scheduled check-in stands, for its timeline stop and the shelter's "next due":
// { state: 'done'|'overdue'|'soon'|'later', text }. The text says it all, the colour is extra.
export function stopState(checkIn, now = new Date()) {
  if (checkIn.status === 'completed') {
    return { state: 'done', text: checkIn.completedAt ? `Done ${formatShort(checkIn.completedAt)}` : 'Done' }
  }
  if (!checkIn.dueDate) return { state: 'later', text: 'No due date' }
  const days = daysUntil(checkIn.dueDate, now)
  if (checkIn.isOverdue || new Date(checkIn.dueDate) < now) {
    return { state: 'overdue', text: days < 0 ? `Overdue by ${plural(-days, 'day')}` : 'Overdue since today' }
  }
  if (days <= SOON_DAYS) {
    return { state: 'soon', text: days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days` }
  }
  return { state: 'later', text: `Due ${formatShort(checkIn.dueDate)}` }
}

// needs doing now: overdue or due within SOON_DAYS
export const isDue = (checkIn, now) => ['overdue', 'soon'].includes(stopState(checkIn, now).state)

// "1 week" → "1 week check-in"; an ad-hoc one is "Health update"
export const checkInTitle = (checkIn) =>
  checkIn.kind === 'adhoc' ? checkIn.label || 'Health update' : `${checkIn.label} check-in`

// Check-ins grouped by application (one adoption or foster), each group's check-ins split up:
// { applicationId, animal, adopter, shelter, scheduled (by due date), log (completed ones, newest first) }
export function groupByApplication(checkIns) {
  const groups = new Map()
  for (const c of checkIns) {
    const id = String(c.application)
    if (!groups.has(id)) groups.set(id, { applicationId: id, animal: c.animal, adopter: c.adopter, shelter: c.shelter, all: [] })
    groups.get(id).all.push(c)
  }
  return [...groups.values()].map(({ all, ...group }) => ({
    ...group,
    scheduled: all.filter((c) => c.kind !== 'adhoc').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    log: all
      .filter((c) => c.status === 'completed' && c.healthUpdate)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
  }))
}

// The shelter's summary of one adoption: the latest update, the next pending check-in, and where it stands.
// standing: 'overdue' | 'soon' (due this week) | 'ok' (up to date)
export function summarize(group, now = new Date()) {
  const next = group.scheduled.find((c) => c.status === 'pending') || null
  const overdue = group.scheduled.some((c) => stopState(c, now).state === 'overdue')
  const soon = group.scheduled.some((c) => stopState(c, now).state === 'soon')
  return { last: group.log[0] || null, next, standing: overdue ? 'overdue' : soon ? 'soon' : 'ok' }
}

// taskbar labels; n is null until the count is known
export const checkInsTaskLabel = (role, n) => {
  if (!n) return 'Check-ins'
  return role === 'adopter' ? `Check-ins (${n} due)` : `Check-ins (${n} overdue)`
}

// ---- the check-in form ----

export const emptyUpdate = () => ({ condition: null, weight: '', eatingWell: null, vetVisit: null, notes: '', photos: [] })

// field → message, empty when the form can be sent. Same rules as the server, plus a weight above 0.
export function validateUpdate(form, petName) {
  const errors = {}
  if (!CONDITIONS.includes(form.condition)) errors.condition = `Pick how ${petName} is doing.`
  const weight = form.weight.trim()
  if (weight) {
    const kg = Number(weight)
    if (!Number.isFinite(kg) || kg <= 0 || kg > MAX.weightKg) errors.weight = `Enter a weight between 0 and ${MAX.weightKg} kg.`
  }
  if (form.notes.trim().length > MAX.notes) errors.notes = `Keep notes under ${MAX.notes} characters.`
  if (form.photos.length > MAX.photos) errors.photos = `Up to ${MAX.photos} photos.`
  else if (form.photos.some((u) => !isHttpUrl(u) || u.length > MAX.photoUrl)) errors.photos = 'Every photo needs an http(s) link.'
  return errors
}

// form → the API's health update (unanswered optional fields are left out)
export function updateBody(form) {
  const notes = form.notes.trim()
  return {
    condition: form.condition,
    ...(form.weight.trim() && { weightKg: Number(form.weight) }),
    ...(form.eatingWell !== null && { eatingWell: form.eatingWell }),
    ...(form.vetVisit !== null && { vetVisit: form.vetVisit }),
    ...(notes && { notes }),
    photos: form.photos,
  }
}

// 31.5 → "31.5 kg"
export const formatKg = (kg) => `${Number(kg).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`
