import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Window from '../components/ui/Window.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import ErrorDialog from '../components/ui/ErrorDialog.jsx'
import LoadingWindow from '../components/ui/LoadingWindow.jsx'
import Taskbar from '../components/ui/Taskbar.jsx'
import FormError from '../components/auth/FormError.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUnread } from '../context/UnreadContext.jsx'
import { useCheckInsTask } from '../context/CheckInsContext.jsx'
import { VERIFY_LIMITS, getMyVerification, requestVerification } from '../api/verification.js'
import { canUpload, checkDocumentFile, uploadDocument } from '../api/uploads.js'
import { messagesTaskLabel } from '../utils/messages.js'
import { formatLong } from '../utils/dates.js'
import { firstName } from '../utils/auth.js'
import { isHttpUrl } from '../utils/listing.js'
import { profileTask, shelterPath } from '../utils/shelters.js'
import './VerificationPage.css'

// GET /verification/me. status: 'loading' | 'ready' | 'error'; set() swaps in the request just sent.
function useVerification() {
  const [load, setLoad] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    getMyVerification({ signal: ctrl.signal })
      .then(({ verification }) => setLoad({ status: 'ready', verification: verification || { status: 'unsubmitted' } }))
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad({ status: 'error' })
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setLoad({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])
  const set = useCallback((verification) => setLoad({ status: 'ready', verification }), [])
  return { ...load, retry, set }
}

// null if the form can be sent, otherwise { field: message }
function problemsIn(form) {
  const errors = {}
  if (!form.registrationNumber.trim()) errors.registrationNumber = 'Enter your registration number.'
  if (!form.about.trim()) errors.about = 'Tell adopters a little about your shelter.'
  if (form.website.trim() && !isHttpUrl(form.website.trim())) errors.website = 'Use a full link starting with http:// or https://.'
  if (form.documentUrl.trim() && !isHttpUrl(form.documentUrl.trim())) errors.documentUrl = 'Use a full link starting with http:// or https://.'
  return Object.keys(errors).length ? errors : null
}

// "Upload a file" for the document: sends it with the photo-upload helper and puts the link in the field.
function DocumentUpload({ onUploaded, onBusy }) {
  const fileRef = useRef(null)
  const [progress, setProgress] = useState(null) // 0–1 while uploading
  const [note, setNote] = useState('')

  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = checkDocumentFile(file)
    if (problem) return setNote(problem)
    setNote('')
    setProgress(0)
    onBusy(true)
    try {
      const { url } = await uploadDocument(file, setProgress)
      onUploaded(url)
      setNote(`Uploaded ${file.name}.`)
    } catch (err) {
      setNote(err.message)
    } finally {
      setProgress(null)
      onBusy(false)
    }
  }

  const uploading = progress !== null
  const pct = Math.round((progress ?? 0) * 100)
  return (
    <div className="doc-upload">
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="sr-only" tabIndex={-1} onChange={pick} aria-hidden="true" />
      <Button onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload a file'}</Button>
      {uploading && (
        <div className="doc-bar" role="progressbar" aria-label="Upload progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
          <span>{`${pct}%`}</span>
        </div>
      )}
      {note && <p className="field-hint" role="status">{note}</p>}
    </div>
  )
}

function RequestForm({ previous, onSent }) {
  const [form, setForm] = useState(() => ({
    registrationNumber: previous?.registrationNumber || '',
    about: previous?.about || '',
    website: previous?.website || '',
    documentUrl: previous?.documentUrl || '',
  }))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const formRef = useRef(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const problems = problemsIn(form)
    setErrors(problems || {})
    if (problems) {
      // focus the first field that needs fixing
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    setError(null)
    try {
      const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      // optional fields are left out when empty (an empty string would fail the server's URL check)
      const body = Object.fromEntries(Object.entries(trimmed).filter(([, v]) => v))
      onSent(await requestVerification(body))
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  const aboutLeft = VERIFY_LIMITS.about - form.about.length

  return (
    <form ref={formRef} className="verify-form" onSubmit={submit} noValidate>
      <Field
        label="Registration number"
        value={form.registrationNumber}
        onChange={set('registrationNumber')}
        maxLength={VERIFY_LIMITS.registrationNumber}
        error={errors.registrationNumber}
        hint="From your trust, society or NGO registration certificate."
        autoComplete="off"
      />
      <Field
        as="textarea"
        label="About your shelter"
        value={form.about}
        onChange={set('about')}
        maxLength={VERIFY_LIMITS.about}
        rows={5}
        error={errors.about}
        hint={`Shown on your public profile. ${aboutLeft} ${aboutLeft === 1 ? 'character' : 'characters'} left.`}
      />
      <Field
        type="url"
        label="Website (optional)"
        value={form.website}
        onChange={set('website')}
        maxLength={VERIFY_LIMITS.website}
        error={errors.website}
        placeholder="https://"
        hint="Shown on your public profile."
      />
      <div className="doc-field">
        <Field
          type="url"
          label="Document (optional)"
          value={form.documentUrl}
          onChange={set('documentUrl')}
          maxLength={VERIFY_LIMITS.documentUrl}
          error={errors.documentUrl}
          placeholder="https://"
          hint={
            canUpload
              ? 'A link to your registration certificate, or upload a PDF or image (up to 5 MB). Only admins see it.'
              : 'A link to your registration certificate. Only admins see it.'
          }
        />
        {canUpload && (
          <DocumentUpload onUploaded={(url) => setForm((f) => ({ ...f, documentUrl: url }))} onBusy={setUploading} />
        )}
      </div>

      <FormError error={error} />

      <div className="verify-actions">
        <Button variant="primary" type="submit" disabled={busy || uploading}>
          {busy ? 'SENDING...' : 'Send for review'}
        </Button>
      </div>
    </form>
  )
}

function Status({ verification, userId, onSent }) {
  const noteRef = useRef(null)
  const [justSent, setJustSent] = useState(false)

  // after sending, the form is gone: focus goes to the new status
  useEffect(() => {
    if (justSent) noteRef.current?.focus()
  }, [justSent])

  const { status } = verification

  if (status === 'approved') {
    return (
      <div className="verify-body">
        <p className="verify-note mint">Your shelter is verified.</p>
        <p>Adopters see a VERIFIED badge on your profile, and you can list animals.</p>
        <div className="verify-actions start">
          <Link className="btn" to={shelterPath(userId)}>View your profile</Link>
          <Link className="btn primary" to="/shelter/animals">My pets</Link>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="verify-body">
        <p ref={noteRef} className="verify-note sun" tabIndex={-1} role={justSent ? 'status' : undefined}>
          Waiting for an admin to review your request.
        </p>
        <dl className="verify-sent">
          {verification.submittedAt && (
            <div><dt>SENT</dt><dd>{formatLong(verification.submittedAt)}</dd></div>
          )}
          <div><dt>REGISTRATION NUMBER</dt><dd>{verification.registrationNumber}</dd></div>
          {verification.website && <div><dt>WEBSITE</dt><dd>{verification.website}</dd></div>}
          {verification.documentUrl && (
            <div><dt>DOCUMENT</dt><dd><a href={verification.documentUrl} target="_blank" rel="noopener noreferrer">Open the document</a></dd></div>
          )}
        </dl>
        <p className="verify-small">You can keep answering applications meanwhile. Listing animals opens up once you&apos;re verified.</p>
      </div>
    )
  }

  // unsubmitted or rejected: the form (a rejected request's details are filled in again)
  return (
    <div className="verify-body">
      {status === 'rejected' ? (
        <div className="verify-note pink">
          <p>An admin didn&apos;t approve your last request.</p>
          {verification.note && <p className="verify-admin">{`Note from the admin: ${verification.note}`}</p>}
          <p className="verify-small">Fix the details below and send it again.</p>
        </div>
      ) : (
        <p>
          Verified shelters get a VERIFIED badge on their profile and can list animals. An admin checks each request,
          usually within a few days.
        </p>
      )}
      <RequestForm
        previous={status === 'rejected' ? verification : null}
        onSent={(v) => {
          setJustSent(true)
          onSent(v)
        }}
      />
    </div>
  )
}

function Verify() {
  const { user, logout, refreshUser } = useAuth()
  const { count: unread } = useUnread()
  const navigate = useNavigate()
  const checkInsTask = useCheckInsTask(navigate)
  const load = useVerification()

  // the login copy of the user may be old: an admin may have decided since
  useEffect(() => {
    const ctrl = new AbortController()
    refreshUser({ signal: ctrl.signal })
    return () => ctrl.abort()
  }, [refreshUser])

  return (
    <div className="desk verify-desk">
      <header className="brand">
        <h1>PAW<span>SHARE</span> OS</h1>
      </header>

      <Window title="VERIFY.EXE" barColor="mint" className="verify" aria-label="Shelter verification">
        {load.status === 'ready' ? (
          <Status verification={load.verification} userId={user.id} onSent={load.set} />
        ) : (
          <div className="verify-waiting">
            {load.status === 'loading' && <LoadingWindow label="Checking your verification" />}
            {load.status === 'error' && <ErrorDialog message="COULDN'T LOAD YOUR VERIFICATION." okLabel="Retry" onOk={load.retry} />}
          </div>
        )}
      </Window>

      <Taskbar
        items={[
          { id: 'hood', label: 'Neighborhood.exe', onClick: () => navigate('/adopt'), hideOnSmall: true },
          { id: 'mypets', label: 'My pets', onClick: () => navigate('/shelter/animals'), hideOnSmall: true },
          { id: 'inbox', label: 'Inbox', onClick: () => navigate('/shelter/applications'), hideOnSmall: true },
          profileTask(user, navigate),
          checkInsTask,
          { id: 'msgs', label: messagesTaskLabel(unread), onClick: () => navigate('/messages') },
          { id: 'me', label: `${firstName(user.name)} · ${user.role}`, hideOnSmall: true },
          { id: 'logout', label: 'Log out', onClick: logout },
        ]}
      />
    </div>
  )
}

// /shelter/verification (behind RequireAuth): VERIFY.EXE, shelters only.
export default function VerificationPage() {
  const { user } = useAuth()
  if (user.role !== 'shelter') return <Navigate to="/" replace />
  return <Verify />
}
