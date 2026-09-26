// CONTROL_PANEL.EXE helpers.

// A shelter's verification status ('unsubmitted' if it has never sent a request)
export const verifyStatusOf = (shelter) => shelter.verification?.status || 'unsubmitted'

// chip order in the Verification section
export const VERIFY_STATUSES = ['pending', 'approved', 'rejected', 'unsubmitted']
export const VERIFY_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', unsubmitted: 'Not submitted' }
export const VERIFY_COLOR = { pending: '#FFD873', approved: '#A8D8B9', rejected: '#FF9EBB', unsubmitted: '#E7DEFA' }

// the sections, in icon order: /admin/<id>
export const SECTIONS = ['verification', 'reviews', 'listings']
export const SECTION_TITLE = { verification: 'Shelter verification', reviews: 'Reviews', listings: 'Listings' }

// "Shelter verification (2 waiting)" / "Shelter verification" while the count loads
export const verificationLabel = (waiting) =>
  waiting === null ? 'Shelter verification' : `Shelter verification (${waiting} waiting)`

// "1 listing" / "12 listings"
export const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`
