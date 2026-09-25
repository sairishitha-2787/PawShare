import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { getToken, onUnauthorized, setToken as saveToken } from '../api/client.js'

const AuthContext = createContext(null)

// The logged-in user. The token lives in localStorage ("pawshare-token", handled by api/client.js) so a
// refresh keeps you logged in; on start a saved token is checked with getMe(). loading is true until then.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const logout = useCallback(() => {
    saveToken(null)
    setToken(null)
    setUser(null)
  }, [])

  // check the saved token once; if it's expired or the server says no, log out quietly
  useEffect(() => {
    if (!getToken()) return
    const ctrl = new AbortController()
    authApi
      .getMe({ signal: ctrl.signal })
      .then(setUser)
      .catch((err) => {
        if (err.name !== 'AbortError') logout()
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [logout])

  // any request that comes back 401 has already cleared the token; forget the user too
  useEffect(() => onUnauthorized(logout), [logout])

  const startSession = useCallback(({ token, user }) => {
    saveToken(token)
    setToken(token)
    setUser(user)
    return user
  }, [])

  const login = useCallback((email, password) => authApi.login(email, password).then(startSession), [startSession])
  const signup = useCallback((data) => authApi.signup(data).then(startSession), [startSession])

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout }),
    [user, token, loading, login, signup, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
