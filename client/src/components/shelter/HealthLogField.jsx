import Window from '../ui/Window.jsx'
import Field from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'
import { emptyRecord } from '../../utils/listing.js'

// HEALTH.LOG: the listing's health records (server healthRecords: date, title, vetName, notes), one row each.
export default function HealthLogField({ records, onChange, errors }) {
  const update = (key, field) => (e) =>
    onChange(records.map((r) => (r.key === key ? { ...r, [field]: e.target.value } : r)))
  const remove = (key) => onChange(records.filter((r) => r.key !== key))
  const err = (key, field) => errors[`health.${key}.${field}`]

  return (
    <Window as="div" title="HEALTH.LOG" barColor="mint" className="health-log">
      {records.length === 0 ? (
        <p className="log-empty">No records yet. Add vaccinations, check-ups, surgeries or medicines.</p>
      ) : (
        <ol className="log-rows">
          {records.map((r, i) => (
            <li key={r.key} className="log-row">
              <div className="log-row-head">
                <span>{`RECORD ${i + 1}`}</span>
                <Button onClick={() => remove(r.key)} aria-label={`Remove record ${i + 1}${r.title ? ` (${r.title})` : ''}`}>
                  Remove
                </Button>
              </div>
              <div className="log-grid">
                <Field label="Date" type="date" value={r.date} max="9999-12-31" onChange={update(r.key, 'date')} />
                <Field
                  label="What was it"
                  value={r.title}
                  placeholder="Rabies vaccine"
                  onChange={update(r.key, 'title')}
                  error={err(r.key, 'title')}
                />
                <Field
                  label="Vet (optional)"
                  value={r.vetName}
                  onChange={update(r.key, 'vetName')}
                  error={err(r.key, 'vetName')}
                />
              </div>
              <Field
                label="Notes (optional)"
                as="textarea"
                rows={2}
                className="log-notes"
                value={r.notes}
                onChange={update(r.key, 'notes')}
                error={err(r.key, 'notes')}
              />
            </li>
          ))}
        </ol>
      )}
      <div className="log-foot">
        <Button onClick={() => onChange([...records, emptyRecord()])}>Add record</Button>
      </div>
    </Window>
  )
}
