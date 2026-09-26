// Pet photo uploads: straight from the browser to Cloudinary with an unsigned upload preset, so the API only
// ever stores the resulting { url, publicId } (see "Integration notes → Photos" in the README).
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// false when the env vars are missing: the form offers "Paste image URL" instead
export const canUpload = Boolean(CLOUD_NAME && UPLOAD_PRESET)

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const SIDE = 800

// null if the file is fine, otherwise what's wrong with it
export function checkPhotoFile(file) {
  if (!file.type.startsWith('image/')) return 'That file isn’t an image.'
  if (file.size > MAX_PHOTO_BYTES) return 'Pick an image under 5 MB.'
  return null
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image couldn’t be opened.'))
    }
    img.src = url
  })
}

// Centre-crops the image to a square and scales it to 800×800, so it fills the round pin without surprises.
export async function squareImage(file) {
  const img = await loadImage(file)
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = SIDE
  canvas.height = SIDE
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIDE, SIDE)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('That image couldn’t be resized.'))), 'image/jpeg', 0.88)
  })
}

// Posts one file to Cloudinary. resourceType: 'image' | 'auto'. onProgress gets 0–1. Resolves to { url, publicId }.
// XMLHttpRequest rather than fetch, because fetch can't report upload progress.
function sendToCloudinary(file, filename, resourceType, onProgress) {
  const body = new FormData()
  body.append('file', file, filename)
  body.append('upload_preset', UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/${resourceType}/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        // not JSON: handled below
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve({ url: data.secure_url, publicId: data.public_id })
      } else {
        reject(new Error(data?.error?.message || `Upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Couldn’t reach the upload server.'))
    xhr.send(body)
  })
}

// Squares the file, then uploads it. onProgress gets 0–1. Resolves to { url, publicId }.
export async function uploadPetPhoto(file, onProgress) {
  if (!canUpload) throw new Error('Photo uploads aren’t set up. Paste an image URL instead.')
  const blob = await squareImage(file)
  return sendToCloudinary(blob, 'photo.jpg', 'image', onProgress)
}

// Verification documents: a PDF or an image, uploaded as it is.
const DOCUMENT_TYPES = ['application/pdf', 'image/']

// null if the file is fine, otherwise what's wrong with it
export function checkDocumentFile(file) {
  if (!DOCUMENT_TYPES.some((t) => file.type.startsWith(t))) return 'Pick a PDF or an image.'
  if (file.size > MAX_PHOTO_BYTES) return 'Pick a file under 5 MB.'
  return null
}

// Uploads a verification document unchanged. onProgress gets 0–1. Resolves to { url, publicId }.
export function uploadDocument(file, onProgress) {
  if (!canUpload) return Promise.reject(new Error('Uploads aren’t set up. Paste a link instead.'))
  return sendToCloudinary(file, file.name, 'auto', onProgress)
}
