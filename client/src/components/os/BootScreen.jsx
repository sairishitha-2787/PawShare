import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Window from '../ui/Window.jsx'
import Button from '../ui/Button.jsx'
import { checkHealth } from '../../api/health.js'
import { API_CONFIGURED } from '../../api/client.js'
import { BLOCKS, MAX_MS, bootFrame } from '../../utils/boot.js'
import './BootScreen.css'

const RETRY_MS = 1000 // a refused or 5xx health check (the server still starting) is tried again after this

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// BOOT.EXE: a full-screen window over the app while GET /health wakes the API. Closes when the API has answered
// (at least 2.2s on screen), or after 9s with "WAKING SERVER... SLOW". SKIP, Esc and Enter close it at once.
// The app behind it is inert meanwhile. onDone is called once.
export default function BootScreen({ onDone }) {
  const [reduced] = useState(prefersReducedMotion)
  const [t, setT] = useState(0)
  // without an API (sample-pet mode) there's nothing to wait for
  const [server, setServer] = useState(API_CONFIGURED ? null : { at: 0, status: 'ok' })
  const dialogRef = useRef(null)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    document.getElementById('root').inert = false
    onDoneRef.current()
  }

  // the clock, and the health check (retried until it answers; unmounting aborts it)
  useEffect(() => {
    const start = performance.now()
    const tick = setInterval(() => setT(performance.now() - start), 100)
    if (!API_CONFIGURED) return () => clearInterval(tick)

    const ctrl = new AbortController()
    let retry
    const slow = setTimeout(() => {
      ctrl.abort()
      setServer((s) => s ?? { at: MAX_MS, status: 'slow' })
    }, MAX_MS)
    const ping = async () => {
      try {
        await checkHealth({ signal: ctrl.signal })
        clearTimeout(slow)
        setServer({ at: performance.now() - start, status: 'ok' })
      } catch {
        if (!ctrl.signal.aborted) retry = setTimeout(ping, RETRY_MS)
      }
    }
    ping()
    return () => {
      clearInterval(tick)
      clearTimeout(slow)
      clearTimeout(retry)
      ctrl.abort()
    }
  }, [])

  // focus on SKIP, the app behind made inert, Esc / Enter skip
  useEffect(() => {
    const root = document.getElementById('root')
    root.inert = true
    dialogRef.current.querySelector('.boot-skip')?.focus()
    const onKey = (e) => {
      if (e.key !== 'Escape' && e.key !== 'Enter') return
      e.preventDefault()
      finish()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      root.inert = false
    }
    // finish only reads refs, so the first one is enough
  }, [])

  const frame = bootFrame(t, server, { reduced })

  useEffect(() => {
    if (frame.done) finish()
  }, [frame.done])

  return createPortal(
    <div className="boot" ref={dialogRef} role="dialog" aria-modal="true" aria-label="PawShare OS is starting">
      <Window as="div" title="BOOT.EXE" className="boot-win">
        <div className="boot-body">
          <p className="boot-brand">PAW<span>SHARE</span> OS</p>
          <ol className="boot-lines" aria-live="polite">
            {frame.lines.map((line) => (
              <li key={line.text} className={line.visible ? undefined : 'off'}>
                {line.text}
                {line.status && ` ${line.status.toUpperCase()}`}
              </li>
            ))}
          </ol>
          <div
            className="boot-bar"
            role="progressbar"
            aria-label="Starting"
            aria-valuemin={0}
            aria-valuemax={BLOCKS}
            aria-valuenow={frame.blocks}
          >
            {Array.from({ length: BLOCKS }, (_, i) => <i key={i} className={i < frame.blocks ? 'on' : undefined} />)}
          </div>
          <div className="boot-foot">
            <Button className="boot-skip" onClick={finish}>SKIP</Button>
          </div>
        </div>
      </Window>
    </div>,
    document.body,
  )
}
