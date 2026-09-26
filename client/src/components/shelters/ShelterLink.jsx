import { Link } from 'react-router-dom'
import { shelterPath } from '../../utils/shelters.js'
import './ShelterLink.css'

// A shelter's name as a link to its profile; plain text when the id isn't known (a deleted account, mock data).
export default function ShelterLink({ id, name, tab, className = 'shelter-link' }) {
  if (!id) return name
  return <Link className={className} to={shelterPath(id, tab)}>{name}</Link>
}
