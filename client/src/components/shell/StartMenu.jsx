import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// The taskbar's "start" button and its menu, which opens upwards. groups: [[{ id, label, to?, onSelect?, current?,
// badge? }]], drawn with a line between groups. header: a line at the top (the user's name).
// Keyboard: Enter/Space/ArrowUp open it on the first item, arrows/Home/End move, Esc closes and returns to start,
// Tab closes it and moves on. A click outside closes it.
export default function StartMenu({ groups, header }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  const items = () => [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])]
  const close = (refocus) => {
    setOpen(false)
    if (refocus) btnRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    menuRef.current.scrollIntoView?.({ block: 'nearest' })
    items()[0]?.focus()
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const onMenuKey = (e) => {
    const list = items()
    const at = list.indexOf(document.activeElement)
    const go = (i) => {
      e.preventDefault()
      list[(i + list.length) % list.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowUp') go(at - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(list.length - 1)
    else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') close(false)
  }

  const onButtonKey = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className="start-wrap" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="start start-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKey}
      >
        start
      </button>
      {open && (
        <div className="start-menu" id={menuId} ref={menuRef} role="menu" aria-label="Start" onKeyDown={onMenuKey}>
          <div className="start-head" aria-hidden="true">
            <b>PAW<span>SHARE</span> OS</b>
            {header && <small>{header}</small>}
          </div>
          {groups.filter((g) => g.length).map((group, i) => (
            <div key={group[0].id} className="start-group" role="none">
              {i > 0 && <hr role="separator" />}
              {group.map((item) => {
                const inner = (
                  <>
                    <span>{item.label}</span>
                    {item.badge > 0 && <b className="start-badge">{item.badge}</b>}
                  </>
                )
                const props = {
                  role: 'menuitem',
                  tabIndex: -1,
                  className: 'start-item',
                  'aria-current': item.current ? 'page' : undefined,
                }
                return item.to ? (
                  <Link key={item.id} to={item.to} {...props} onClick={() => close(false)}>{inner}</Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    {...props}
                    onClick={() => {
                      close(false)
                      item.onSelect()
                    }}
                  >
                    {inner}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
