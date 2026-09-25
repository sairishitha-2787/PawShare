import { request } from './client.js'
import { petLook } from './animals.js'

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

// Applications for the logged-in shelter's animals (all of them for an admin), newest first, with animal and
// applicant (name, email, phone, city) populated. query: { status?, animal? }
export async function getReceivedApplications(query, options) {
  const { applications } = await request('/applications/received', { query, ...options })
  return applications
}

// The shelter's decision: status 'approved' | 'rejected', note optional → the updated application (not populated).
// Approving also rejects every other pending application for the pet and marks it adopted/fostered.
// Anything no longer pending is a 409.
export async function decideApplication(id, status, note) {
  const { application } = await request(`/applications/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status, ...(note && { note }) },
  })
  return application
}

// pending and approved applications block a new one for the same animal (same rule as the server)
export const isActive = (application) => application.status === 'pending' || application.status === 'approved'

// Withdraws one of the adopter's own pending applications → the updated application (not populated).
// Anything no longer pending is a 409 "Application is already <status>".
export async function withdrawApplication(id) {
  const { application } = await request(`/applications/${encodeURIComponent(id)}/withdraw`, { method: 'PATCH' })
  return application
}

// The populated animal of an application as something PetFace can draw (a deleted animal gets a stand-in).
export function applicationPet(application) {
  const { animal } = application
  if (animal?._id) return { ...petLook(animal), area: animal.location?.city || '' }
  return { ...petLook({ _id: application._id, name: 'Unknown pet', species: 'other' }), area: '' }
}

// withdrawn or rejected, and the pet is still taking applications (the server's rule for a new one)
export const canApplyAgain = (application) =>
  !isActive(application) && ['available', 'pending'].includes(application.animal?.status)
