import { STATUS_COLOR, STATUS_LABEL } from '../../utils/pets.js'
import './Pill.css'

export default function Pill({ status }) {
  return (
    <span className="pill" style={{ background: STATUS_COLOR[status] }}>
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  )
}
