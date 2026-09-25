import { formatDay } from '../../utils/dates.js'
import { HOME_TYPE_LABEL, TYPE_LABEL } from '../../utils/applications.js'
import './Answers.css'

// Read-only application answers, shared by the wizard's last step and the application detail window,
// so both use the same labels.

// A cream box with a small heading, and an Edit link when onEdit is given.
export function Review({ title, onEdit, editLabel, heading: Heading = 'h4', children }) {
  return (
    <div className="review">
      <div className="review-head">
        <Heading>{title}</Heading>
        {onEdit && <button type="button" className="edit" onClick={onEdit} aria-label={editLabel}>Edit</button>}
      </div>
      {children}
    </div>
  )
}

const yesNo = (v) => (v === true ? 'Yes' : v === false ? 'No' : 'Not given')

// type: 'adoption' | 'foster'; fosterUntil: "YYYY-MM-DD" or the server's ISO date
export function TypeAnswers({ type, fosterUntil }) {
  return (
    <dl>
      <div><dt>Type</dt><dd>{TYPE_LABEL[type]}</dd></div>
      {type === 'foster' && <div><dt>Foster until</dt><dd>{fosterUntil ? formatDay(fosterUntil) : 'Not given'}</dd></div>}
    </dl>
  )
}

// answers: the `answers` object POST /api/applications takes (any field may be missing on older applications)
export function HomeAnswers({ answers = {} }) {
  const hours = answers.hoursAlonePerDay
  return (
    <dl>
      <div><dt>Home type</dt><dd>{HOME_TYPE_LABEL[answers.homeType] || 'Not given'}</dd></div>
      <div><dt>Yard</dt><dd>{yesNo(answers.hasYard)}</dd></div>
      <div><dt>Children</dt><dd>{yesNo(answers.hasChildren)}</dd></div>
      <div><dt>Other pets</dt><dd>{answers.otherPets || 'None given'}</dd></div>
      <div><dt>Alone per day</dt><dd>{typeof hours === 'number' ? `${hours} h` : 'Not given'}</dd></div>
      <div className="wide"><dt>Experience</dt><dd>{answers.experience || 'None given'}</dd></div>
    </dl>
  )
}
