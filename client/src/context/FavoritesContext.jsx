import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'pawshare-favs'
const FavoritesContext = createContext(null)

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
    return new Set(Array.isArray(saved) ? saved : [])
  } catch {
    return new Set()
  }
}

// Set of favorite pet ids, kept in localStorage so it survives a refresh.
export function FavoritesProvider({ children }) {
  const [favs, setFavs] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...favs]))
    } catch {
      // storage blocked (private mode etc.): favorites just won't persist
    }
  }, [favs])

  const toggleFav = useCallback((id) => {
    setFavs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const value = useMemo(() => ({ favs, isFav: (id) => favs.has(id), toggleFav }), [favs, toggleFav])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>')
  return ctx
}
