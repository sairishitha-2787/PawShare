// /shelters/:id, optionally opened on a tab: shelterPath(id, 'reviews') → /shelters/<id>#reviews
export const shelterPath = (id, tab) => `/shelters/${encodeURIComponent(id)}${tab ? `#${tab}` : ''}`

// "1 review" / "12 reviews"
export const reviewCount = (n) => `${n} ${n === 1 ? 'review' : 'reviews'}`

// Rounded to the nearest half star, for drawing.
export const halfStars = (rating) => Math.round(Number(rating || 0) * 2) / 2

// The link in the "not verified yet" notes, which goes to VERIFY.EXE
export const verifyLinkLabel = (user) =>
  user?.verificationStatus === 'pending' ? 'See your verification request' : 'Request verification'

// The shelter's "My profile" taskbar item (null for anyone else). current: it's the page you're on.
export function profileTask(user, navigate, { current = false } = {}) {
  if (user?.role !== 'shelter') return null
  return { id: 'profile', label: 'My profile', ...(!current && { onClick: () => navigate(shelterPath(user.id)) }) }
}
