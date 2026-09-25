import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import FormError from '../components/auth/FormError.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { EMAIL_RE } from '../utils/auth.js'
import './AuthPage.css'

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your email.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = "That doesn't look like an email address."
  if (!password) errors.password = 'Enter your password.'
  return errors
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  // logged in (just now, or already): go back to the page that sent us here
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
      await login(form.email.trim(), form.password)
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
      <Window title="LOGIN.EXE" className="auth">
        <form onSubmit={submit} noValidate>
          <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          <FormError error={serverError} />
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'LOGGING IN...' : 'Log in'}</Button>
          <p className="switch">
            New here? <Link to="/signup" state={location.state}>Create an account</Link>
          </p>
        </form>
      </Window>
    </div>
  )
}
