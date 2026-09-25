import { useId } from 'react'
import Window from './Window.jsx'
import Button from './Button.jsx'
import './ErrorDialog.css'

export default function ErrorDialog({ message, onOk, okLabel = 'OK' }) {
  const msgId = useId()
  return (
    <Window as="div" title="ERROR" barColor="pink" dots={1} className="err" role="alertdialog" aria-labelledby={msgId}>
      <div className="body">
        <p id={msgId}>{message}</p>
        {/* an alertdialog takes focus, so OK is ready for Enter */}
        <Button onClick={onOk} autoFocus>{okLabel}</Button>
      </div>
    </Window>
  )
}
