import Window from '../ui/Window.jsx'
import './FormError.css'

// The server's error for a form (e.g. "Invalid credentials"), in a small pink ERROR window. Renders nothing without one.
export default function FormError({ error }) {
  if (!error) return null
  const details = (error.data?.errors || []).filter((e) => e && e !== error.message)
  return (
    <Window as="div" title="ERROR" barColor="pink" dots={1} className="form-err" role="alert">
      <div className="body">
        <p>{error.message}</p>
        {details.length > 0 && (
          <ul>{details.map((d) => <li key={d}>{d}</li>)}</ul>
        )}
      </div>
    </Window>
  )
}
