import PetFace from '../pets/PetFace.jsx'
import { petLook } from '../../api/animals.js'
import { otherPerson } from '../../api/threads.js'
import { listTime } from '../../utils/messages.js'

// the pet's face (or photo); a thread without a pet shows the person's initial instead
export function ThreadFace({ thread, name, size = 40 }) {
  if (thread.animal?._id) return <PetFace pet={petLook(thread.animal)} size={size} />
  return (
    <span className="initial" style={{ width: size, height: size }} aria-hidden="true">
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  )
}

function preview(thread, myId) {
  const last = thread.lastMessage
  if (!last?.text) return 'No messages yet'
  return String(last.sender) === myId ? `You: ${last.text}` : last.text
}

// CONTACTS: one row per thread, most recent first (the server's order). Selected row: selectedId.
export default function ContactList({ threads, myId, selectedId, onOpen }) {
  return (
    <ul className="contacts" aria-label="Conversations">
      {threads.map((t) => {
        const other = otherPerson(t, myId)
        const name = other?.name || 'Deleted account'
        const unread = t.unreadCount || 0
        const selected = t._id === selectedId
        const cls = ['contact-row', unread > 0 && 'unread', selected && 'selected'].filter(Boolean).join(' ')
        const when = t.lastMessage?.at || t.createdAt
        return (
          <li key={t._id}>
            <button
              type="button"
              className={cls}
              data-thread-id={t._id}
              aria-current={selected || undefined}
              aria-label={`${name}${t.animal?.name ? `, about ${t.animal.name}` : ''}${unread ? `, ${unread} unread` : ''}`}
              onClick={() => onOpen(t._id)}
            >
              <ThreadFace thread={t} name={name} />
              <span className="contact-main">
                <span className="contact-top">
                  <span className="contact-name">{name}</span>
                  {t.animal?.name && <span className="contact-pet">{t.animal.name}</span>}
                </span>
                <span className="contact-preview">{preview(t, myId)}</span>
              </span>
              <span className="contact-side">
                {when && <time dateTime={new Date(when).toISOString()}>{listTime(when)}</time>}
                {unread > 0 && <span className="badge">{unread > 99 ? '99+' : unread}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
