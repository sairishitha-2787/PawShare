import { formatKg } from '../../utils/checkins.js'
import { formatShort } from '../../utils/dates.js'
import './CheckIns.css'

const W = 340
const H = 160
const PAD = { top: 22, right: 18, bottom: 26, left: 44 }
const INSET = 16

// A small line chart of weight over time, oldest on the left. entries: completed check-ins with a weight.
// Needs 2+ points; renders nothing otherwise.
export default function WeightChart({ entries }) {
  const points = entries
    .filter((c) => typeof c.healthUpdate?.weightKg === 'number')
    .map((c) => ({ id: c._id, at: new Date(c.completedAt).getTime(), kg: c.healthUpdate.weightKg }))
    .sort((a, b) => a.at - b.at)
  if (points.length < 2) return null

  // y: whole kilos around the data, at least 2 kg tall so a steady weight doesn't look like a cliff
  let lo = Math.floor(Math.min(...points.map((p) => p.kg)) - 0.5)
  let hi = Math.ceil(Math.max(...points.map((p) => p.kg)) + 0.5)
  if (hi - lo < 2) {
    lo -= 1
    hi += 1
  }
  lo = Math.max(0, lo)
  const mid = (lo + hi) / 2

  // x: by date; updates on the same moment are spread evenly instead
  const first = points[0].at
  const span = points[points.length - 1].at - first
  // the points start a little right of the y axis so the first one's label doesn't sit on the line
  const x0 = PAD.left + INSET
  const innerW = W - PAD.right - x0
  const innerH = H - PAD.top - PAD.bottom
  const x = (p, i) => x0 + (span > 0 ? ((p.at - first) / span) * innerW : (i / (points.length - 1)) * innerW)
  const y = (kg) => PAD.top + (1 - (kg - lo) / (hi - lo)) * innerH
  const xy = points.map((p, i) => ({ ...p, cx: x(p, i), cy: y(p.kg) }))

  // date labels under the first and last point, and the ones between when there's room
  const labelled = points.length <= 4 ? xy : [xy[0], xy[xy.length - 1]]
  const summary = points.map((p) => `${formatKg(p.kg)} on ${formatShort(p.at)}`).join(', ')

  return (
    <figure className="weight-chart">
      <figcaption>Weight over time</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Weight over time: ${summary}`}>
        {[lo, mid, hi].map((kg) => (
          <g key={kg}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(kg)} y2={y(kg)} className="wc-grid" />
            <text x={PAD.left - 6} y={y(kg)} className="wc-axis" textAnchor="end" dominantBaseline="middle">
              {`${Number.isInteger(kg) ? kg : kg.toFixed(1)} KG`}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} className="wc-axis-line" />
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="wc-axis-line" />

        <polyline points={xy.map((p) => `${p.cx},${p.cy}`).join(' ')} className="wc-line" />
        {xy.map((p) => (
          <g key={p.id}>
            <circle cx={p.cx} cy={p.cy} r="5" className="wc-point" />
            <text x={p.cx} y={p.cy - 10} className="wc-axis" textAnchor="middle">{p.kg}</text>
          </g>
        ))}
        {labelled.map((p, i) => (
          <text
            key={p.id}
            x={p.cx}
            y={H - PAD.bottom + 16}
            className="wc-axis"
            textAnchor={i === 0 ? 'start' : i === labelled.length - 1 ? 'end' : 'middle'}
          >
            {formatShort(p.at).toUpperCase()}
          </text>
        ))}
      </svg>
    </figure>
  )
}
