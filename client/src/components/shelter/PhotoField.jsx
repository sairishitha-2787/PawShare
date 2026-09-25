import { useId, useRef, useState } from 'react'
import Button from '../ui/Button.jsx'
import { canUpload, checkPhotoFile, uploadPetPhoto } from '../../api/uploads.js'
import { MAX, isHttpUrl } from '../../utils/listing.js'
import '../ui/Field.css'

// The listing's photos ([{ url, publicId? }]); the first is the main photo, which goes on the map pin.
// Uploads go to Cloudinary (squared to 800×800 first); without the Cloudinary env vars it takes a pasted URL.
// onBusy(true/false) lets the form hold off saving while an upload is running.
export default function PhotoField({ photos, onChange, onBusy, error }) {
  const id = useId()
  const fileRef = useRef(null)
  const [progress, setProgress] = useState(null) // 0–1 while uploading
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const full = photos.length >= MAX.photos

  const add = (photo) => onChange([...photos, photo])
  const remove = (i) => onChange(photos.filter((_, j) => j !== i))
  const makeMain = (i) => onChange([photos[i], ...photos.filter((_, j) => j !== i)])

  async function pickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // so picking the same file again still fires onChange
    if (!file) return
    const problem = checkPhotoFile(file)
    if (problem) return setNote(problem)
    setNote('')
    setProgress(0)
    onBusy?.(true)
    try {
      add(await uploadPetPhoto(file, setProgress))
    } catch (err) {
      setNote(err.message)
    } finally {
      setProgress(null)
      onBusy?.(false)
    }
  }

  function addUrl() {
    const u = url.trim()
    if (!isHttpUrl(u)) return setNote('Paste a full image link starting with http:// or https://.')
    if (u.length > 500) return setNote('That link is too long (500 characters at most).')
    if (photos.some((p) => p.url === u)) return setNote('That photo is already here.')
    add({ url: u })
    setUrl('')
    setNote('')
  }

  const uploading = progress !== null
  const pct = Math.round((progress ?? 0) * 100)
  const message = error || note

  return (
    <div className="field photo-field">
      <span className="field-label" id={`${id}-label`}>{`Photos (${photos.length} of ${MAX.photos})`}</span>

      {photos.length > 0 && (
        <ul className="thumbs" aria-labelledby={`${id}-label`}>
          {photos.map((p, i) => (
            <li key={p.url} className="thumb">
              <img src={p.url} alt={i === 0 ? 'Main photo' : `Photo ${i + 1}`} width="64" height="64" />
              {i === 0 ? (
                <span className="main-tag">Main photo</span>
              ) : (
                <Button onClick={() => makeMain(i)} aria-label={`Make photo ${i + 1} the main photo`}>Make main</Button>
              )}
              <Button onClick={() => remove(i)} aria-label={`Remove ${i === 0 ? 'the main photo' : `photo ${i + 1}`}`}>Remove</Button>
            </li>
          ))}
        </ul>
      )}

      {canUpload ? (
        <div className="photo-add">
          <input
            ref={fileRef}
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={pickFile}
            disabled={full || uploading}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={full || uploading}>
            {uploading ? 'Uploading...' : 'Upload a photo'}
          </Button>
          {uploading && (
            <div className="upbar" role="progressbar" aria-label="Upload progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${pct}%` }} />
              <span>{`${pct}%`}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="photo-add">
          <label className="field-label" htmlFor={id}>Paste image URL</label>
          <div className="tag-add">
            <input
              id={id}
              type="url"
              value={url}
              placeholder="https://..."
              disabled={full}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addUrl()
                }
              }}
            />
            <Button onClick={addUrl} disabled={full || !url.trim()}>Add photo</Button>
          </div>
        </div>
      )}

      <p className={message ? 'field-err' : 'field-hint'} role={note ? 'alert' : undefined}>
        {message ||
          (full
            ? `That's the limit of ${MAX.photos} photos.`
            : canUpload
              ? 'Images only, up to 5 MB. They are cropped to a square so they fit the round pin.'
              : 'Uploads aren’t set up here, so paste a link to an image. Square photos fit the pin best.')}
      </p>
    </div>
  )
}
