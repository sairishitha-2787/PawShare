import { request } from './client.js'

// data: { name, email, password, role: 'adopter'|'shelter', phone?, location?: { city } } → { token, user }
export function signup(data) {
  return request('/auth/signup', { method: 'POST', body: data })
}

// → { token, user }. A wrong email or password is a 401 with the server's "Invalid credentials".
export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: { email, password } })
}

// The logged-in user (needs the saved token).
export async function getMe(options) {
  const data = await request('/auth/me', options)
  return data.user
}
