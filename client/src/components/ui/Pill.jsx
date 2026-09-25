import { STATUS_COLOR, STATUS_LABEL } from '../../utils/pets.js'
import './Pill.css'

// A pet status pill by default; label + color make any other kind (application statuses).
export default function Pill({ status, label = STATUS_LABEL[status], color = STATUS_COLOR[status] }) {
  return (
    <span className="pill" style={{ background: color }}>
      {label.toUpperCase()}
    </span>
  )
}
