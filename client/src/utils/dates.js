// All dates are shown en-IN style: "25 Sept 2026".
const DAY_MONTH = { day: 'numeric', month: 'short' }
const DAY_MONTH_YEAR = { ...DAY_MONTH, year: 'numeric' }

// A calendar date with no time of day ("2026-10-12", or the UTC-midnight ISO string the server stores it as)
// → "12 Oct 2026". Read as a local date; new Date("2026-10-12") would be UTC midnight and can land on the 11th.
export function formatDay(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', DAY_MONTH_YEAR)
}

// A moment (createdAt, decidedAt) → "25 Sept", with the year only when it isn't this year.
export function formatShort(date) {
  const d = new Date(date)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('en-IN', sameYear ? DAY_MONTH : DAY_MONTH_YEAR)
}

// A moment → "25 Sept 2026"
export function formatLong(date) {
  return new Date(date).toLocaleDateString('en-IN', DAY_MONTH_YEAR)
}

// A moment → "Aug 2026"
export function formatMonth(date) {
  return new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}
