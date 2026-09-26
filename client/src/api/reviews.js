import { request } from './client.js'
import { getReviews } from './users.js'

// Reviews of shelters (server/controllers/reviewController.js): one per approved application, 1–5 whole stars.

// the Review model's maxlength
export const MAX_COMMENT = 1000

// Adopters only, for their own approved application; a second review for it is a 409. → the new review
export async function createReview({ applicationId, rating, comment }) {
  const { review } = await request('/reviews', { method: 'POST', body: { applicationId, rating, comment } })
  return review
}

// The reviewer only. → the updated review
export async function updateReview(id, { rating, comment }) {
  const { review } = await request(`/reviews/${encodeURIComponent(id)}`, { method: 'PUT', body: { rating, comment } })
  return review
}

export function deleteReview(id) {
  return request(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

const PAGE = 50

// The review for one application, or null. The server has no "my review" endpoint, so this pages through the
// shelter's reviews (newest first) and stops early once they're older than since (the approval date):
// a review can't be older than the adoption it's about.
export async function findMyReview({ shelterId, applicationId, since }, options) {
  const oldest = since ? new Date(since).getTime() : null
  for (let page = 1; ; page++) {
    const { reviews, totalPages } = await getReviews(shelterId, { page, limit: PAGE }, options)
    const mine = reviews.find((r) => String(r.application) === String(applicationId))
    if (mine) return mine
    const last = reviews[reviews.length - 1]
    if (page >= totalPages || !last || (oldest && new Date(last.createdAt).getTime() < oldest)) return null
  }
}
