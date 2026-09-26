import { request } from './client.js'

// Shelter verification requests (server/controllers/verificationController.js). Shelters only.

// the User model's maxlengths for verification fields
export const VERIFY_LIMITS = { registrationNumber: 100, about: 2000, website: 300, documentUrl: 500 }

// → { isVerified, verification: { status: 'unsubmitted'|'pending'|'approved'|'rejected', registrationNumber?,
//     about?, website?, documentUrl?, submittedAt?, reviewedAt?, note? } }
export function getMyVerification(options) {
  return request('/verification/me', options)
}

// data: { registrationNumber, about, website?, documentUrl? } → the new (pending) verification.
// A pending or approved shelter gets a 409.
export async function requestVerification(data) {
  const { verification } = await request('/verification/request', { method: 'POST', body: data })
  return verification
}
