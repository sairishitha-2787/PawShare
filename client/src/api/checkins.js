import { request } from './client.js'

// Post-adoption check-ins (server/controllers/checkInController.js). Approving an application schedules three
// ("1 week", "1 month", "3 months" after approval); an adopter can also log an ad-hoc health update any time.
// A check-in: { _id, application, animal, adopter, shelter, kind: 'scheduled'|'adhoc', label, dueDate?,
// status: 'pending'|'completed', completedAt?, healthUpdate?, isOverdue }. Lists come pending first (by due
// date), then completed newest first.

// The logged-in adopter's check-ins, with animal (name, species, breed, photos, status) and shelter (name).
// query: { status?: 'pending'|'completed'|'overdue', dueWithin?: days } (dueWithin includes overdue ones)
export async function getMyCheckIns(query, options) {
  const { checkIns } = await request('/checkins/mine', { query, ...options })
  return checkIns
}

// Check-ins for the logged-in shelter's animals, with animal and adopter (name, email, phone). Same query,
// plus animal: an animal id.
export async function getReceivedCheckIns(query, options) {
  const { checkIns } = await request('/checkins/received', { query, ...options })
  return checkIns
}

// update: { condition: 'great'|'good'|'fair'|'poor', weightKg?, eatingWell?, vetVisit?, notes?, photos?: [url] }
// → the completed check-in (not populated). Already completed is a 409.
export async function completeCheckIn(id, update) {
  const { checkIn } = await request(`/checkins/${encodeURIComponent(id)}/complete`, { method: 'POST', body: update })
  return checkIn
}

// An ad-hoc health update for an animal you adopted or are fostering → the new check-in (kind 'adhoc').
export async function logHealthUpdate(animalId, update) {
  const { checkIn } = await request('/checkins', { method: 'POST', body: { animalId, ...update } })
  return checkIn
}
