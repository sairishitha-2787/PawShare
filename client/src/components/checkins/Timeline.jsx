import { stopState } from '../../utils/checkins.js'
import { INK } from '../../utils/pets.js'
import './CheckIns.css'

// The scheduled check-ins as stops on a dashed line (1 WEEK · 1 MONTH · 3 MONTHS): done = mint with a tick,
// due soon = sun, overdue = pink, later = paper. Each stop also says it in words.
export default function Timeline({ checkIns }) {
  if (checkIns.length === 0) return null
  return (
    <ol className="timeline" style={{ '--stops': checkIns.length }} aria-label="Scheduled check-ins">
      {checkIns.map((c) => {
        const { state, text } = stopState(c)
        return (
          <li key={c._id} className={`stop ${state}`}>
            <span className="stop-dot" aria-hidden="true">
              {state === 'done' && (
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="stop-words">
              <span className="stop-name">{c.label}</span>
              <span className="stop-text">{text}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
