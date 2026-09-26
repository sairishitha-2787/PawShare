import Window from '../ui/Window.jsx'
import Pill from '../ui/Pill.jsx'
import WeightChart from './WeightChart.jsx'
import { CONDITION_COLOR, CONDITION_LABEL, checkInTitle, formatKg } from '../../utils/checkins.js'
import { formatLong } from '../../utils/dates.js'
import './CheckIns.css'

const yesNo = (v) => (v === true ? 'Yes' : v === false ? 'No' : 'Not said')

// HEALTH.LOG: the completed check-ins and updates, newest first, with a weight chart once there are 2+ weights.
// entries: completed check-ins (groupByApplication's log). Read-only; the adopter adds to it from the diary.
export default function HealthLog({ entries, petName }) {
  return (
    <Window as="div" title="HEALTH.LOG" className="health-log" dots={false}>
      <div className="log-body">
        {entries.length === 0 ? (
          <p className="log-empty">No updates yet.</p>
        ) : (
          <>
            <WeightChart entries={entries} />
            <ol className="log-list" aria-label={`${petName}'s health updates`}>
              {entries.map((c) => {
                const u = c.healthUpdate
                return (
                  <li key={c._id} className="log-entry">
                    <div className="log-head">
                      <time dateTime={c.completedAt}>{formatLong(c.completedAt)}</time>
                      <span className="log-title">{checkInTitle(c)}</span>
                      <Pill label={CONDITION_LABEL[u.condition] || u.condition} color={CONDITION_COLOR[u.condition]} />
                    </div>
                    <dl className="log-facts">
                      <div><dt>Weight</dt><dd>{typeof u.weightKg === 'number' ? formatKg(u.weightKg) : 'Not weighed'}</dd></div>
                      <div><dt>Eating well</dt><dd>{yesNo(u.eatingWell)}</dd></div>
                      <div><dt>Vet visit</dt><dd>{yesNo(u.vetVisit)}</dd></div>
                    </dl>
                    {u.notes && <p className="log-notes">{u.notes}</p>}
                    {u.photos?.length > 0 && (
                      <ul className="log-photos" aria-label="Photos">
                        {u.photos.map((url, i) => (
                          <li key={`${i}-${url}`}>
                            <a href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt={`${petName}, photo ${i + 1} from ${formatLong(c.completedAt)}`} width="64" height="64" loading="lazy" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </div>
    </Window>
  )
}
