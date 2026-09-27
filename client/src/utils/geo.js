// Places for "Near me" when the browser can't give a location, as GeoJSON [lng, lat] (the demo shelters' areas).
export const AREAS = [
  { key: 'koramangala', label: 'Koramangala', coords: [77.6245, 12.9352] },
  { key: 'indiranagar', label: 'Indiranagar', coords: [77.6408, 12.9784] },
  { key: 'hsr', label: 'HSR Layout', coords: [77.6389, 12.9116] },
  { key: 'bengaluru', label: 'Bengaluru centre', coords: [77.5946, 12.9716] },
]

export const RADII = [5, 10, 25]
export const DEFAULT_RADIUS = 25

// A browser location goes in the URL rounded to 3 decimals (about 100 m): close enough for distances,
// and a shared link doesn't give away the exact spot.
export const roundCoord = (n) => Math.round(n * 1000) / 1000

// ?near= is an area key or "lng,lat". → { key, label, coords: [lng, lat] }, or null if it's neither.
export function parseNear(value) {
  if (!value) return null
  const area = AREAS.find((a) => a.key === value)
  if (area) return area
  const [lng, lat] = value.split(',').map(Number)
  const valid = Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90
  return valid ? { key: `${lng},${lat}`, label: 'your location', coords: [lng, lat] } : null
}

// Great-circle distance in km between two [lng, lat] points (haversine). The API doesn't send distances.
export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// 2.43 → "2.4 km" (to 0.1 km); under 0.05 km → "under 0.1 km"
export function formatKm(km) {
  const rounded = Math.round(km * 10) / 10
  return rounded === 0 ? 'under 0.1 km' : `${rounded.toFixed(1)} km`
}

// 2.43 → "2.4 km away", 0.01 → "Under 0.1 km away"
export function formatDistance(km) {
  const s = `${formatKm(km)} away`
  return s.charAt(0).toUpperCase() + s.slice(1)
}
