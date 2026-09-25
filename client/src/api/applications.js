import { request } from './client.js'

// data: { animalId, type: 'adoption'|'foster', message?, answers?, fosterUntil? } → the new application.
// Adopters only (a shelter gets a 403). A second active application for the same animal is a 409.
export async function applyFor(data) {
  const { application } = await request('/applications', { method: 'POST', body: data })
  return application
}

// The logged-in adopter's applications, newest first, with animal and shelter populated. query: { status? }
export async function getMyApplications(query, options) {
  const { applications } = await request('/applications/mine', { query, ...options })
  return applications
}

// pending and approved applications block a new one for the same animal (same rule as the server)
export const isActive = (application) => application.status === 'pending' || application.status === 'approved'
