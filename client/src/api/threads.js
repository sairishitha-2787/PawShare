import { request } from './client.js'

// Messaging (server/controllers/threadController.js). Nothing is pushed: the messenger polls.
// A thread is one conversation between two people about one animal (or "general" without one).

// the Message model's maxlength
export const MAX_MESSAGE = 2000

// Your threads, most recent activity first, each with otherParticipant { _id, name, role, isVerified },
// animal { _id, name, species, photos, status } (or null), lastMessage { text, sender, at } and unreadCount.
export async function listThreads(options) {
  const { threads } = await request('/threads', options)
  return threads
}

// Total unread messages from other people, for the taskbar.
export async function unreadCount(options) {
  const { count } = await request('/threads/unread-count', options)
  return count
}

// { animalId } talks to the animal's shelter; { recipientId } to a person; both = that person, about that animal.
// Returns the existing thread if there is one. The response has participants but no otherParticipant.
export async function startThread(data) {
  const { thread } = await request('/threads', { method: 'POST', body: data })
  return thread
}

// The newest `limit` messages (or the ones before message id `before`), oldest first → { messages, hasMore }.
export function getMessages(id, { before, limit } = {}, options) {
  return request(`/threads/${encodeURIComponent(id)}/messages`, { query: { before, limit }, ...options })
}

export async function sendMessage(id, text) {
  const { message } = await request(`/threads/${encodeURIComponent(id)}/messages`, { method: 'POST', body: { text } })
  return message
}

// Marks the other person's messages in the thread as read → { marked }.
export function markRead(id) {
  return request(`/threads/${encodeURIComponent(id)}/read`, { method: 'PATCH' })
}

// the person on the other end of a thread (the list sends otherParticipant; startThread doesn't)
export function otherPerson(thread, myId) {
  return thread.otherParticipant || thread.participants?.find((p) => (p._id || p) !== myId) || null
}
