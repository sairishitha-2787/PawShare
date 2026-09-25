// Same email check as the server's User model.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// "Priya Sharma" → "Priya" (for the taskbar)
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name
