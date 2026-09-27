import { useState } from 'react'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import FormError from '../components/auth/FormError.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { updateMe } from '../api/users.js'
import './AccountPage.css'

const formFor = (user) => ({
  name: user.name || '',
  phone: user.phone || '',
  city: user.location?.city || '',
  state: user.location?.state || '',
})

// The server's limits (server/models/User.js), plus the signup form's phone check
function validate({ name, phone, city, state }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Enter your name.'
  else if (name.trim().length > 100) errors.name = 'Use 100 characters or fewer.'
  if (phone.trim() && !/^\+?[\d\s-]{7,20}$/.test(phone.trim())) errors.phone = 'Use digits only, e.g. 98450 12345.'
  if (city.trim().length > 100) errors.city = 'Use 100 characters or fewer.'
  if (state.trim().length > 100) errors.state = 'Use 100 characters or fewer.'
  return errors
}

// /account (behind RequireAuth): SETTINGS.EXE, PUT /users/me. Email can't be changed.
export default function AccountPage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState(() => formFor(user))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  // editing a field clears its error and the "Saved." note
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => (errs[key] ? { ...errs, [key]: undefined } : errs))
    setSaved(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setServerError(null)
    setSaved(false)
    if (Object.keys(found).length) return

    const city = form.city.trim()
    const state = form.state.trim()
    const body = { name: form.name.trim(), phone: form.phone.trim() }
    // the server replaces location whole, so keep the country and map coordinates that are already there
    if (city !== (user.location?.city || '') || state !== (user.location?.state || '')) {
      body.location = { ...user.location, city, state }
    }
    setBusy(true)
    try {
      const next = await updateMe(body)
      updateUser(next)
      setForm(formFor(next))
      setSaved(true)
    } catch (err) {
      setServerError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="desk settings-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title="SETTINGS.EXE" className="settings" aria-label="Account settings">
        <form onSubmit={submit} noValidate>
          <Field label="Name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
          <Field label="Email" type="email" value={user.email || ''} readOnly hint="Your login email can't be changed here." />
          <Field
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
            maxLength={20}
          />
          <div className="settings-row">
            <Field label="City" autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} maxLength={100} />
            <Field label="State" autoComplete="address-level1" value={form.state} onChange={set('state')} error={errors.state} maxLength={100} />
          </div>
          <FormError error={serverError} />
          <div className="settings-foot">
            <Button type="submit" variant="primary" disabled={busy}>{busy ? 'SAVING...' : 'Save changes'}</Button>
            {saved && <p className="settings-saved" role="status">Saved.</p>}
          </div>
        </form>
      </Window>
    </div>
  )
}
