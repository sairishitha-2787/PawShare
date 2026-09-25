import { getMyApplications } from '../api/applications.js'
import { useApplicationList } from './useApplicationList.js'

// The logged-in adopter's applications (newest first, as the server sends them). See useApplicationList.
export const useMyApplications = (enabled = true) => useApplicationList(getMyApplications, enabled)
