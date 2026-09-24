import { useEffect, useState } from 'react'
import './Taskbar.css'

const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// items: [{ id, label, hideOnSmall }] – hideOnSmall tabs drop out below 520px. "start" is a label only.
export default function Taskbar({ items = [] }) {
  const [time, setTime] = useState(timeNow)

  useEffect(() => {
    const id = setInterval(() => setTime(timeNow()), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="taskbar">
      <span className="start">start</span>
      {items.map((item) => (
        <span key={item.id ?? item.label} className={item.hideOnSmall ? 'task hide-s' : 'task'}>{item.label}</span>
      ))}
      <span className="clock">{time}</span>
    </footer>
  )
}
