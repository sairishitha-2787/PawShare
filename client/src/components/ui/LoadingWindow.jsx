import Window from './Window.jsx'
import './LoadingWindow.css'

// "LOADING..." window with a stepped pixel progress bar. Centered over the nearest positioned ancestor, like ErrorDialog.
export default function LoadingWindow({ label = 'Fetching pets from the shelters' }) {
  return (
    <Window as="div" title="LOADING..." className="loading" role="status">
      <div className="body">
        <p>{label}</p>
        <div className="pbar" aria-hidden="true"><i /></div>
      </div>
    </Window>
  )
}
