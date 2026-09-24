import './Chip.css'

export default function Chip({ pressed = false, onClick, children, ...rest }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}
