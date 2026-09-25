// Application statuses, in chip order (server/models/Application.js). The pill always carries the word too.
export const APP_STATUSES = ['pending', 'approved', 'rejected', 'withdrawn']
export const APP_STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', withdrawn: 'Withdrawn' }
export const APP_STATUS_COLOR = { pending: '#FFD873', approved: '#A8D8B9', rejected: '#FF9EBB', withdrawn: '#B8A6E0' }

export const TYPE_LABEL = { adoption: 'Adopt', foster: 'Foster' }

// the adopter's answers, labelled as in the wizard's summary step
export const HOME_TYPE_LABEL = { house: 'House', apartment: 'Apartment', other: 'Other' }

// taskbar label; n is null until the count is known
export const applicationsTaskLabel = (n) => (n == null ? 'Applications' : `Applications (${n} pending)`)
// the shelter's version
export const inboxTaskLabel = (n) => (n == null ? 'Inbox' : `Inbox (${n} pending)`)

// "wants to adopt Mochi" / "wants to foster Mochi"
export const wantsTo = (type, petName) => `wants to ${type === 'foster' ? 'foster' : 'adopt'} ${petName}`

// a received application's applicant (populated), or a stand-in if the account is gone
export const applicantName = (application) => application.applicant?.name || 'Unknown applicant'
