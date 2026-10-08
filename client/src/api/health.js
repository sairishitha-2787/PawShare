import { request } from './client.js'

// GET /health → { status: 'ok' }. Answers as soon as the server is up (BOOT.EXE waits on it to cover Render's
// cold start). Pass an AbortController's signal to stop waiting.
export function checkHealth({ signal } = {}) {
  return request('/health', { signal })
}
