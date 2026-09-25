// fetch wrapper for the PawShare API. Resolves to the parsed JSON body; on a non-2xx response it throws
// an Error carrying the server's `message` (plus .status and .data). A network failure throws with status 0.
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '')

// query: plain object → ?key=value (undefined, null and '' are skipped). body: sent as JSON.
export async function request(path, { query, body, headers, ...options } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  }
  const url = `${BASE_URL}${path}${params.size ? `?${params}` : ''}`

  let res
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
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

  if (!res.ok) {
    throw Object.assign(new Error(data?.message || `Request failed (${res.status})`), { status: res.status, data })
  }
  return data
}
