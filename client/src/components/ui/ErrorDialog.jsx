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
        <Button onClick={onOk}>{okLabel}</Button>
      </div>
    </Window>
  )
}
