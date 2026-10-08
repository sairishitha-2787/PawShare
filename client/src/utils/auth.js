// Same email check as the server's User model.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// "Priya Sharma" → "Priya" (for the taskbar)
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name

// The name the taskbar and the desktop greet you by: a shelter's full name, a person's first name
export const displayName = (user) => (user.role === 'shelter' ? user.name : firstName(user.name))
