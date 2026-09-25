import { formatShort } from './dates.js'

// taskbar label; n is null until the count is known
export const messagesTaskLabel = (n) => (n == null ? 'Messages' : `Messages (${n})`)

const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const DAY = 24 * 60 * 60 * 1000

// the local calendar day of a moment, for grouping messages under one divider
export const dayKey = (date) => dayStart(new Date(date))

// divider text: "Today", "Yesterday", or "24 Sept" (with the year when it isn't this year)
export function dayLabel(date) {
  const days = Math.round((dayStart(new Date()) - dayKey(date)) / DAY)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return formatShort(date)
}

// "4:05 pm" under a message
export const timeOf = (date) => new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

// the contact list's time: today's messages by time, older ones by date
export const listTime = (date) => (dayLabel(date) === 'Today' ? timeOf(date) : dayLabel(date))

// merges message lists by _id (ObjectIds sort by creation), oldest first
export function mergeMessages(a, b) {
  const byId = new Map(a.map((m) => [m._id, m]))
  for (const m of b) byId.set(m._id, m)
  return [...byId.values()].sort((x, y) => (x._id < y._id ? -1 : x._id > y._id ? 1 : 0))
}
