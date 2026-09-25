import { getReceivedApplications } from '../api/applications.js'
import { useApplicationList } from './useApplicationList.js'

// Applications for the logged-in shelter's animals (every application for an admin), newest first,
// with animal and applicant populated. See useApplicationList.
export const useReceivedApplications = (enabled = true) => useApplicationList(getReceivedApplications, enabled)
