import { useEffect, useState } from 'react'
import './Taskbar.css'

const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// items: [{ id, label, hideOnSmall, onClick }] – hideOnSmall tabs drop out below 520px; an item with onClick
// is a button. "start" is a label only.
export default function Taskbar({ items = [] }) {
  const [time, setTime] = useState(timeNow)

  useEffect(() => {
    const id = setInterval(() => setTime(timeNow()), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="taskbar">
      <span className="start">start</span>
      {items.map((item) => {
        const cls = item.hideOnSmall ? 'task hide-s' : 'task'
        return item.onClick ? (
          <button key={item.id ?? item.label} type="button" className={`${cls} task-btn`} onClick={item.onClick}>{item.label}</button>
        ) : (
          <span key={item.id ?? item.label} className={cls}>{item.label}</span>
        )
      })}
      <span className="clock">{time}</span>
    </footer>
  )
}
