import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import ErrorDialog from '../ui/ErrorDialog.jsx'
import LoadingWindow from '../ui/LoadingWindow.jsx'
import FormError from '../auth/FormError.jsx'
import { ThreadFace } from './ContactList.jsx'
import { MAX_MESSAGE, getMessages, markRead, otherPerson, sendMessage } from '../../api/threads.js'
import { usePolling } from '../../hooks/usePolling.js'
import { dayKey, dayLabel, mergeMessages, timeOf } from '../../utils/messages.js'
import ShelterLink from '../shelters/ShelterLink.jsx'

const PAGE = 30
const POLL_MS = 5000
// the counter shows up this close to the limit
const COUNT_FROM = MAX_MESSAGE - 200
// within this many px of the end counts as "at the bottom"
const NEAR_BOTTOM = 48

// One conversation (key it by thread id). onActivity(): something changed that the contact list and the
// unread count should see (read, sent, received). onBack: the narrow-screen "← Back". headingRef: focused
// when a conversation opens on a narrow screen.
export default function ChatPane({ thread, myId, onActivity, onBack, headingRef }) {
  const other = otherPerson(thread, myId)
  const name = other?.name || 'Deleted account'
  const pet = thread.animal
  const id = thread._id
  const composeId = useId()

  const [load, setLoad] = useState({ status: 'loading', messages: [], hasMore: false })
  const [attempt, setAttempt] = useState(0)
  const [older, setOlder] = useState({ busy: false, error: '' })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [newBelow, setNewBelow] = useState(false)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const atBottom = useRef(true)
  // what to do with the scroll position after the next render: 'bottom' | { height, top } (keep place) | null
  const pendingScroll = useRef(null)
  const latestOnActivity = useRef(onActivity)
  // the messages on screen, for the poll to compare against
  const shown = useRef(load.messages)
  useEffect(() => {
    latestOnActivity.current = onActivity
    shown.current = load.messages
  })

  // mark the other person's messages read, then let the list and the taskbar count catch up
  const read = () => markRead(id).then(() => latestOnActivity.current?.(), () => {})

  // first page (newest messages)
  useEffect(() => {
    const ctrl = new AbortController()
    getMessages(id, { limit: PAGE }, { signal: ctrl.signal })
      .then(({ messages, hasMore }) => {
        pendingScroll.current = 'bottom'
        setLoad({ status: 'ready', messages, hasMore })
        markRead(id).then(() => latestOnActivity.current?.(), () => {})
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error', messages: [], hasMore: false })
      })
    return () => ctrl.abort()
  }, [id, attempt])

  const retry = () => {
    setLoad({ status: 'loading', messages: [], hasMore: false })
    setAttempt((n) => n + 1)
  }

  useLayoutEffect(() => {
    const box = scrollRef.current
    const want = pendingScroll.current
    if (!box || !want) return
    pendingScroll.current = null
    if (want === 'bottom') {
      box.scrollTop = box.scrollHeight
      atBottom.current = true
    } else {
      // older messages went in above: keep the same message under the reader's eyes
      box.scrollTop = box.scrollHeight - want.height + want.top
    }
  }, [load.messages])

  // every 5s: the newest page, merged in. New ones from them stay in view only if the reader was at the bottom.
  usePolling(() => {
    getMessages(id, { limit: PAGE })
      .then(({ messages }) => {
        const known = new Set(shown.current.map((m) => m._id))
        const arrived = messages.filter((m) => !known.has(m._id))
        if (!arrived.length) return
        if (atBottom.current) pendingScroll.current = 'bottom'
        setLoad((l) => ({ ...l, messages: mergeMessages(l.messages, arrived) }))
        const fromThem = arrived.filter((m) => String(m.sender) !== myId)
        if (fromThem.length) {
          if (!atBottom.current) setNewBelow(true)
          read()
        }
      })
      .catch(() => {
        // offline for a moment: the next poll tries again
      })
  }, POLL_MS, load.status === 'ready')

  function onScroll() {
    const box = scrollRef.current
    atBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < NEAR_BOTTOM
    if (atBottom.current) setNewBelow(false)
  }

  function jumpDown() {
    const box = scrollRef.current
    box.scrollTo({ top: box.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    setNewBelow(false)
  }

  async function loadOlder() {
    const box = scrollRef.current
    setOlder({ busy: true, error: '' })
    try {
      const { messages, hasMore } = await getMessages(id, { before: load.messages[0]._id, limit: PAGE })
      pendingScroll.current = { height: box.scrollHeight, top: box.scrollTop }
      setLoad((l) => ({ ...l, hasMore, messages: mergeMessages(messages, l.messages) }))
      setOlder({ busy: false, error: '' })
    } catch (err) {
      setOlder({ busy: false, error: err.message })
    }
  }

  const text = draft.trim()
  const tooLong = draft.length > MAX_MESSAGE

  async function send() {
    if (!text || tooLong || sending) return
    setSending(true)
    setSendError(null)
    try {
      const message = await sendMessage(id, text)
      pendingScroll.current = 'bottom'
      setLoad((l) => ({ ...l, messages: mergeMessages(l.messages, [message]) }))
      setDraft('')
      latestOnActivity.current?.()
    } catch (err) {
      // the draft stays so nothing is lost
      setSendError(err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function onKeyDown(e) {
    // Enter sends, Shift+Enter is a new line (and Enter while an IME is composing is left alone)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section className="chat" aria-labelledby={`${composeId}-who`}>
      <header className="chat-head">
        <Button className="chat-back" onClick={onBack}>← Back</Button>
        <ThreadFace thread={thread} name={name} size={44} />
        <div className="chat-who">
          <h2 id={`${composeId}-who`} ref={headingRef} tabIndex={-1}>
            {other?.role === 'shelter' ? <ShelterLink id={other._id} name={name} /> : name}
            {other?.role === 'shelter' && other.isVerified && <span className="verified">VERIFIED</span>}
          </h2>
          {pet?._id && (
            <p className="sub">
              about <Link to={`/adopt/${encodeURIComponent(pet._id)}`}>{pet.name}</Link>
            </p>
          )}
        </div>
      </header>

      <div className="chat-scroll-wrap">
        <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
          {load.status === 'loading' && <LoadingWindow label="Opening the conversation" />}
          {load.status === 'error' && <ErrorDialog message="COULDN'T LOAD THESE MESSAGES." okLabel="Retry" onOk={retry} />}
          {load.status === 'ready' && (
            <>
              {load.hasMore && (
                <div className="older">
                  <Button onClick={loadOlder} disabled={older.busy}>{older.busy ? 'LOADING...' : 'Load older messages'}</Button>
                  {older.error && <p className="older-err" role="alert">{older.error}</p>}
                </div>
              )}
              {load.messages.length === 0 ? (
                <p className="chat-empty">{`Say hello to ${name}.`}</p>
              ) : (
                <ol className="bubbles" role="log" aria-label={`Messages with ${name}`}>
                  {load.messages.map((m, i) => {
                    // a date divider before the first message of each day
                    const prev = load.messages[i - 1]
                    const divider = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)
                    const mine = String(m.sender) === myId
                    return (
                      <Fragment key={m._id}>
                        {divider && (
                          <li className="day">
                            <span>{dayLabel(m.createdAt)}</span>
                          </li>
                        )}
                        <li className={mine ? 'bubble-row mine' : 'bubble-row'}>
                          <div className="bubble">
                            <span className="sr-only">{mine ? 'You: ' : `${name}: `}</span>
                            {m.text}
                          </div>
                          <time dateTime={m.createdAt}>{timeOf(m.createdAt)}</time>
                        </li>
                      </Fragment>
                    )
                  })}
                </ol>
              )}
            </>
          )}
        </div>
        {newBelow && (
          <button type="button" className="new-pill" onClick={jumpDown}>New messages ↓</button>
        )}
      </div>

      <form
        className="compose"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <FormError error={sendError} />
        <div className="compose-row">
          <label className="sr-only" htmlFor={composeId}>{`Message to ${name}`}</label>
          <textarea
            id={composeId}
            ref={inputRef}
            rows={2}
            value={draft}
            placeholder={`Write to ${name}...`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            aria-invalid={tooLong || undefined}
            aria-describedby={`${composeId}-hint`}
            disabled={load.status !== 'ready'}
          />
          <Button type="submit" variant="primary" disabled={!text || tooLong || sending || load.status !== 'ready'}>
            {sending ? 'SENDING...' : 'Send'}
          </Button>
        </div>
        <p id={`${composeId}-hint`} className="compose-hint">
          <span>Enter sends · Shift+Enter for a new line</span>
          {draft.length >= COUNT_FROM && (
            <span className={tooLong ? 'count over' : 'count'}>{`${draft.length} / ${MAX_MESSAGE}`}</span>
          )}
        </p>
      </form>
    </section>
  )
}
