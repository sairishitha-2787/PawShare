import { shelterPath } from './shelters.js'

// The Start menu's role pages, in order: [{ id, label, to }]. Admins can open the inbox and check-ins too
// (the server returns every application for them).
export function rolePages(user) {
  if (!user) return []
  const messages = { id: 'msgs', label: 'Messages', to: '/messages' }
  if (user.role === 'adopter') {
    return [
      { id: 'apps', label: 'Applications', to: '/applications' },
      { id: 'checkins', label: 'Pet diary', to: '/checkins' },
      messages,
      { id: 'favs', label: 'Favorites', to: '/adopt#favorites' },
    ]
  }
  if (user.role === 'shelter') {
    return [
      { id: 'mypets', label: 'My pets', to: '/shelter/animals' },
      { id: 'inbox', label: 'Inbox', to: '/shelter/applications' },
      { id: 'checkins', label: 'Check-ins', to: '/shelter/checkins' },
      messages,
      { id: 'profile', label: 'My profile', to: shelterPath(user.id) },
      { id: 'verify', label: 'Verification', to: '/shelter/verification' },
    ]
  }
  return [
    { id: 'admin', label: 'Control panel', to: '/admin' },
    { id: 'inbox', label: 'Inbox', to: '/shelter/applications' },
    { id: 'checkins', label: 'Check-ins', to: '/shelter/checkins' },
    messages,
  ]
}

// The pet of the day: the same pet all day (picked by the local date), from the urgent pets if there are any,
// else from the available ones. Pending pets are skipped. null if there's nobody to show.
export function petOfTheDay(pets, date = new Date()) {
  const open = pets.filter((p) => p.status === 'urgent' || p.status === 'available')
  const urgent = open.filter((p) => p.status === 'urgent')
  const pool = (urgent.length ? urgent : open).slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  if (!pool.length) return null
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  let hash = 0
  for (const ch of day) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return pool[hash % pool.length]
}

// "1 check-in due" / "2 unread messages"
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
