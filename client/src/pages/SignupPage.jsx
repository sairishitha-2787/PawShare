import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import ChoiceField from '../components/ui/ChoiceField.jsx'
import FormError from '../components/auth/FormError.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { EMAIL_RE } from '../utils/auth.js'
import './AuthPage.css'

const ROLES = [
  { value: 'adopter', label: 'Looking to adopt or foster' },
  { value: 'shelter', label: 'A shelter or caregiver' },
]

function validate({ name, email, password, phone }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Enter your name.'
  if (!email.trim()) errors.email = 'Enter your email.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = "That doesn't look like an email address."
  if (password.length < 8) errors.password = 'Use at least 8 characters.'
  // bcrypt only reads 72 bytes, so the server rejects anything longer
  else if (new TextEncoder().encode(password).length > 72) errors.password = 'Use 72 characters or fewer.'
  if (phone.trim() && !/^\+?[\d\s-]{7,20}$/.test(phone.trim())) errors.phone = 'Use digits only, e.g. 98450 12345.'
  return errors
}

export default function SignupPage() {
  const { user, signup } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'adopter', city: 'Bengaluru', phone: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  // signed up (or already logged in): back to where they came from, else the Adopt page
  if (user) return <Navigate to={location.state?.from || '/adopt'} replace />

  // editing a field clears its error; the rest stay until the next submit
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => (errs[key] ? { ...errs, [key]: undefined } : errs))
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setServerError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        ...(form.city.trim() && { location: { city: form.city.trim() } }),
      })
    } catch (err) {
      setServerError(err)
      setBusy(false)
    }
  }

  return (
    <div className="desk auth-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>
      <Window title="NEW_USER.EXE" className="auth">
        <form onSubmit={submit} noValidate>
          <Field label="Name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
          <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="At least 8 characters."
          />

          <ChoiceField label="I am..." options={ROLES} value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} />
          {form.role === 'shelter' && (
            <p className="note">Shelters need admin verification before they can list animals.</p>
          )}

          <Field label="City" autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} />
          <Field
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
          />

          <FormError error={serverError} />
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'CREATING ACCOUNT...' : 'Create account'}</Button>
          <p className="switch">
            Already have an account? <Link to="/login" state={location.state}>Log in</Link>
          </p>
        </form>
      </Window>
    </div>
  )
}
