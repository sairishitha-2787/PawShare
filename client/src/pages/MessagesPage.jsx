import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import ContactList from '../components/messages/ContactList.jsx'
import ChatPane from '../components/messages/ChatPane.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { useAdminTask } from '../context/AdminContext.jsx'
import { listThreads } from '../api/threads.js'
import { usePolling } from '../hooks/usePolling.js'
import { messagesTaskLabel } from '../utils/messages.js'
import { firstName } from '../utils/auth.js'
import { profileTask } from '../utils/shelters.js'
import './MessagesPage.css'

const LIST_POLL_MS = 15000
// the panes turn into one-at-a-time below this width (MessagesPage.css)
const STACKED = '(max-width: 859px)'

// The contact list: loaded once, then refreshed every 15s (and on demand) while the tab is visible.
// status: 'loading' | 'ready' | 'error'. A failed quiet refresh keeps the list it has.
// loads counts successful fetches, so a caller can wait for one that started after it asked.
function useThreads() {
  const [load, setLoad] = useState({ status: 'loading', threads: [], loads: 0 })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    listThreads({ signal: ctrl.signal })
      .then((threads) => setLoad((l) => ({ status: 'ready', threads, loads: l.loads + 1 })))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoad((l) => (l.status === 'ready' ? l : { status: 'error', threads: [], loads: l.loads }))
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setLoad((l) => ({ status: 'loading', threads: [], loads: l.loads }))
    setAttempt((n) => n + 1)
  }, [])
  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  usePolling(refresh, LIST_POLL_MS, load.status === 'ready')
  return { ...load, retry, refresh }
}

export default function MessagesPage() {
  const { user, logout } = useAuth()
  const unread = useUnread()
  const navigate = useNavigate()
  const checkInsTask = useCheckInsTask(navigate)
  const adminTask = useAdminTask(navigate)
  const location = useLocation()
  const threads = useThreads()

  // the open conversation lives in the URL: /messages/:threadId
  const openId = useMatch('/messages/:threadId')?.params.threadId
  // a thread MessageButton just started may not be in the list yet: it passes its copy along
  const passedThread = location.state?.thread
  const passed = openId && passedThread?._id === openId ? passedThread : null
  const listed = threads.threads.find((t) => t._id === openId)
  const open = openId ? listed || passed : null

  // an unknown id: fetch the list once more before saying it's missing
  const [recheck, setRecheck] = useState(null) // { id, after: loads when asked }
  const { refresh: refreshThreads, status: listStatus, loads } = threads
  if (listStatus === 'ready' && openId && !listed && !passed && recheck?.id !== openId) {
    setRecheck({ id: openId, after: loads })
  }
  useEffect(() => {
    if (recheck) refreshThreads()
  }, [recheck, refreshThreads])
  const missing = listStatus === 'ready' && openId && !open && recheck?.id === openId && loads > recheck.after

  const onActivity = useCallback(() => {
    refreshThreads()
    unread.refresh()
  }, [refreshThreads, unread])

  // narrow screens: opening a conversation focuses its header; "← Back" returns focus to its row
  const headingRef = useRef(null)
  const focusChat = useRef(false)
  const backTo = useRef(null)
  useEffect(() => {
    if (open && focusChat.current) {
      focusChat.current = false
      headingRef.current?.focus()
    }
    if (!openId && backTo.current) {
      document.querySelector(`.contact-row[data-thread-id="${CSS.escape(backTo.current)}"]`)?.focus()
      backTo.current = null
    }
  }, [open, openId])

  const openThread = (id) => {
    focusChat.current = window.matchMedia(STACKED).matches
    navigate(`/messages/${encodeURIComponent(id)}`)
  }
  const back = () => {
    backTo.current = openId
    navigate('/messages')
  }

  const emptyText =
    user.role === 'adopter'
      ? "No messages yet. Open a pet's profile to message its shelter."
      : 'No messages yet. When adopters write about your pets, their messages show up here.'

  return (
    <div className="desk messages-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <Window title="MESSENGER.EXE" className="messenger" aria-label="Messenger">
        {threads.status !== 'ready' ? (
          <div className="messenger-wait">
            {threads.status === 'loading' && <LoadingWindow label="Opening your messages" />}
            {threads.status === 'error' && (
              <ErrorDialog message="COULDN'T LOAD YOUR MESSAGES." okLabel="Retry" onOk={threads.retry} />
            )}
          </div>
        ) : (
          <div className={openId ? 'messenger-panes has-open' : 'messenger-panes'}>
            <div className="contacts-pane">
              <h2 className="pane-title">CONTACTS</h2>
              {threads.threads.length === 0 ? (
                <p className="contacts-empty">{emptyText}</p>
              ) : (
                <ContactList threads={threads.threads} myId={user.id} selectedId={openId} onOpen={openThread} />
              )}
            </div>

            <div className="chat-pane">
              {open ? (
                <ChatPane key={open._id} thread={open} myId={user.id} onActivity={onActivity} onBack={back} headingRef={headingRef} />
              ) : missing ? (
                <div className="chat-missing">
                  <p>WE COULDN&apos;T FIND THAT CONVERSATION.</p>
                  <Button onClick={() => navigate('/messages', { replace: true })}>OK</Button>
                </div>
              ) : openId ? (
                <div className="messenger-wait"><LoadingWindow label="Opening the conversation" /></div>
              ) : (
                <p className="chat-hint">Pick a conversation to read it.</p>
              )}
            </div>
          </div>
        )}
      </Window>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt'), hideOnSmall: true },
          ...(user.role === 'adopter'
            ? [{ id: 'apps', label: 'Applications', onClick: () => navigate('/applications'), hideOnSmall: true }]
            : [{ id: 'inbox', label: 'Inbox', onClick: () => navigate('/shelter/applications'), hideOnSmall: true }]),
          profileTask(user, navigate),
          adminTask,
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread.count) },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />
    </div>
  )
}
