// fetch wrapper for the PawShare API. Resolves to the parsed JSON body; on a non-2xx response it throws
// an Error carrying the server's `message` (plus .status and .data). A network failure throws with status 0.
// A saved login token is sent as `Authorization: Bearer <token>`; a 401 on such a request clears it.
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '')
const TOKEN_KEY = 'pawshare-token'

// localStorage can throw (private mode, blocked storage): then the token just isn't kept.
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage blocked: nothing to save or clear
  }
}

// Called after a 401 has cleared the token, so the app can forget the user. Returns an unsubscribe function.
const unauthorizedListeners = new Set()
export function onUnauthorized(fn) {
  unauthorizedListeners.add(fn)
  return () => unauthorizedListeners.delete(fn)
}

// query: plain object → ?key=value (undefined, null and '' are skipped). body: sent as JSON.
export async function request(path, { query, body, headers, ...options } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  }
  const url = `${BASE_URL}${path}${params.size ? `?${params}` : ''}`
  const token = getToken()

  let res
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw Object.assign(new Error("Couldn't reach the server"), { status: 0, cause: err })
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // not JSON (a proxy error page, say): fall through with data = null
  }

  // expired or revoked token (a wrong password on login is also a 401, but no token was sent then)
  if (res.status === 401 && token) {
    setToken(null)
    unauthorizedListeners.forEach((fn) => fn())
  }
  if (!res.ok) {
    throw Object.assign(new Error(data?.message || `Request failed (${res.status})`), { status: res.status, data })
  }
  return data
}
