import { useId } from 'react'
import { halfStars, reviewCount } from '../../utils/shelters.js'
import './Stars.css'

// An 11×10 pixel-art star, traced along the pixel edges so the outline stays stepped.
const STAR = 'M5 0H6V1H7V3H11V4H10V5H9V7H10V10H8V9H7V8H6V7H5V8H4V9H3V10H1V7H2V5H1V4H0V3H4V1H5Z'

// fill: 0, 0.5 or 1. scale: px per pixel-art pixel. The ink outline is 2px at any scale.
export function PixelStar({ fill = 1, scale = 2 }) {
  const clipId = useId()
  return (
    <svg
      className="pstar"
      viewBox="-1 -1 13 12"
      width={13 * scale}
      height={12 * scale}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      {fill > 0 && fill < 1 && (
        <clipPath id={clipId}>
          <rect x="-1" y="-1" width={1 + 11 * fill} height="12" />
        </clipPath>
      )}
      <path className="pstar-empty" d={STAR} />
      {fill > 0 && <path className="pstar-fill" d={STAR} clipPath={fill < 1 ? `url(#${clipId})` : undefined} />}
      <path className="pstar-line" d={STAR} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Five stars for a rating (rounded to the nearest half). Decorative: say the number in text next to it.
export function Stars({ rating, scale }) {
  const shown = halfStars(rating)
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <PixelStar key={n} scale={scale} fill={shown >= n ? 1 : shown >= n - 0.5 ? 0.5 : 0} />
      ))}
    </span>
  )
}

// Stars + "4.8 (12 reviews)", or "No reviews yet".
export function RatingSummary({ rating, count, scale }) {
  if (!count) return <span className="rating none">No reviews yet</span>
  return (
    <span className="rating">
      <Stars rating={rating} scale={scale} />
      <span>
        {Number(rating).toFixed(1)}
        <span className="sr-only"> out of 5 stars</span>
        {` (${reviewCount(count)})`}
      </span>
    </span>
  )
}
