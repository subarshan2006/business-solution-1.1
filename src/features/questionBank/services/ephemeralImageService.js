/**
 * Ephemeral Image Service
 * Manages strictly in-memory Blob URLs for quiz question diagrams.
 * When the quiz closes or times out, all active Blob URLs are immediately revoked
 * and wiped from browser RAM so students cannot download or retain proprietary question diagrams.
 */

const activeBlobs = new Set()

/**
 * Convert a base64 or data URL into an in-memory ephemeral Blob URL
 */
export function createEphemeralBlob(input) {
  if (!input || typeof input !== 'string') return input

  // If already an ephemeral blob or relative URL, return or track
  if (input.startsWith('blob:')) {
    activeBlobs.add(input)
    return input
  }

  // If not base64, return as is (e.g. relative assets path)
  if (!input.startsWith('data:image')) {
    return input
  }

  try {
    const parts = input.split(';base64,')
    const contentType = parts[0].split(':')[1] || 'image/png'
    const raw = window.atob(parts[1])
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }

    const blob = new Blob([uInt8Array], { type: contentType })
    const blobUrl = URL.createObjectURL(blob)
    activeBlobs.add(blobUrl)
    return blobUrl
  } catch (err) {
    console.warn('Failed to convert base64 to ephemeral blob:', err)
    return input
  }
}

/**
 * Revoke a single ephemeral blob URL
 */
export function revokeEphemeralBlob(url) {
  if (!url || typeof url !== 'string') return
  if (url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url)
      activeBlobs.delete(url)
    } catch (e) {
      console.warn('Revoke error:', e)
    }
  }
}

/**
 * Purge ALL ephemeral images from browser memory
 * Immediately destroys all image URLs created for the quiz session
 */
export function purgeAllEphemeralImages() {
  activeBlobs.forEach((url) => {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // Ignored
    }
  })
  activeBlobs.clear()
}
