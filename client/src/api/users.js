import { request } from './client.js'

// Public profiles (server/controllers/userController.js).

// { id, name, role, isVerified, rating, ratingCount, location { city, state }, memberSince }; shelters also have
// stats { availableCount, placedCount }, about and website. Throws (status 404) if there's no such user.
export async function getProfile(id, options) {
  const { profile } = await request(`/users/${encodeURIComponent(id)}`, options)
  return profile
}

// A shelter's reviews, newest first, each with reviewer { _id, name } and the application id it's for
// → { reviews, rating, ratingCount, page, total, totalPages }. limit: 1–50 (server default 10).
export function getReviews(id, { page = 1, limit } = {}, options) {
  return request(`/users/${encodeURIComponent(id)}/reviews`, { query: { page, limit }, ...options })
}

// A shelter's placements (public), newest first: [{ _id (the application), type, decidedAt, animal }].
export async function getAdoptionHistory(id, options) {
  const { history } = await request(`/users/${encodeURIComponent(id)}/adoption-history`, options)
  return history
}

// PUT /users/me: fields { name?, phone?, location? } → the updated user. The server replaces location as a whole
// object, so send it complete (keep country and coordinates). Throws a 400 with errors[] if a field is invalid.
export async function updateMe(fields) {
  const { user } = await request('/users/me', { method: 'PUT', body: fields })
  return user
}
