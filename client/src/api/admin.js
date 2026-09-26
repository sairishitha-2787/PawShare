import { request } from './client.js'
import { getReviews } from './users.js'

// Admin-only endpoints (server/controllers/verificationController.js) plus the "everything" lists the control
// panel builds from public or admin-wide endpoints.

// Every shelter, or only those with one verification status, oldest request first. No paging on the server.
// Each: { _id, name, email, phone, location, isVerified, createdAt, verification: { status, registrationNumber?,
// about?, website?, documentUrl?, submittedAt?, reviewedAt?, note? } }
export async function getShelters(status, options) {
  const { shelters } = await request('/admin/shelters', { query: { status }, ...options })
  return shelters
}

// decision: 'approve' | 'reject' (rejecting an approved shelter revokes it). The server keeps whatever note is
// sent and clears the old one when there isn't one. → the updated shelter
export async function decideVerification(id, decision, note) {
  const { shelter } = await request(`/admin/shelters/${encodeURIComponent(id)}/verification`, {
    method: 'PATCH',
    body: { decision, ...(note && { note }) },
  })
  return shelter
}

const ALL_STATUSES = 'available,pending,adopted,fostered'
const PAGE = 50

// Every animal, any status, newest first, with owner { _id, name, ... } populated (GET /animals, page by page).
export async function getAllAnimals(options) {
  const all = []
  for (let page = 1; ; page++) {
    const { animals, totalPages } = await request('/animals', {
      query: { status: ALL_STATUSES, sort: 'newest', limit: PAGE, page },
      ...options,
    })
    all.push(...animals)
    if (page >= totalPages || animals.length === 0) return all
  }
}

// Every review of one shelter, newest first → { reviews, rating, ratingCount }
export async function getAllReviews(shelterId, options) {
  const all = []
  for (let page = 1; ; page++) {
    const { reviews, rating, ratingCount, totalPages } = await getReviews(shelterId, { page, limit: PAGE }, options)
    all.push(...reviews)
    if (page >= totalPages || reviews.length === 0) return { reviews: all, rating, ratingCount }
  }
}
