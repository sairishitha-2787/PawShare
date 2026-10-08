// The map's streets: pets fill them in order, perStreet (LOTS.length) at a time.

// The street to show when the filter changes: the current one if any pet on it matches, else the first
// street with a match. With no match anywhere it stays put (the page shows the empty-results ERROR).
export function streetWithMatch(pets, matches, current, perStreet) {
  const onStreet = (s) => pets.slice(s * perStreet, (s + 1) * perStreet)
  if (onStreet(current).some(matches)) return current
  const first = pets.findIndex(matches)
  return first === -1 ? current : Math.floor(first / perStreet)
}
