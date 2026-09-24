import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Children are usually a <Window onClose>; its X button is marked data-autofocus and gets focus on open.
export default function Modal({ open, onClose, labelledBy, children }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement
    const dialog = dialogRef.current
    const first = dialog.querySelector('[data-autofocus]') || dialog.querySelector(FOCUSABLE) || dialog
    first.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onCloseRef.current()
      } else if (e.key === 'Tab') {
        const items = [...dialog.querySelectorAll(FOCUSABLE)]
        if (!items.length) return e.preventDefault()
        const firstItem = items[0]
        const lastItem = items[items.length - 1]
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault()
          lastItem.focus()
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault()
          firstItem.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (trigger && trigger.isConnected) trigger.focus()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
