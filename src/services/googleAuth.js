/**
 * Google Identity Services (GIS) OAuth 2.0 Client Helper
 * Pure frontend token flow (PKCE / implicit user consent)
 * No client secret used or needed.
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Initial minimum scopes
export const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
].join(' ')

// Full scopes when teacher/student views coursework & submissions
export const EXTENDED_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
].join(' ')

const AUTH_STORAGE_KEY = 'nxtstep_classroom_auth'

/**
 * Get current stored auth state from sessionStorage
 */
export function getStoredAuth() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Check if token expired
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch (err) {
    console.error('Failed to parse stored auth:', err)
    return null
  }
}

/**
 * Save auth state to sessionStorage
 */
export function saveAuth(auth) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch (err) {
    console.error('Failed to save auth:', err)
  }
}

/**
 * Clear auth state
 */
export function clearAuth() {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear auth:', err)
  }
}

/**
 * Checks if the Google Identity Services script has loaded
 */
export function isGsiLoaded() {
  return typeof window !== 'undefined' && window.google?.accounts?.oauth2 != null
}

/**
 * Waits for Google Identity Services script to become available
 */
export function waitForGsi(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (isGsiLoaded()) return resolve()

    const startTime = Date.now()
    const timer = setInterval(() => {
      if (isGsiLoaded()) {
        clearInterval(timer)
        resolve()
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(timer)
        reject(new Error('Google Identity Services SDK timed out. Please check your network connection.'))
      }
    }, 100)
  })
}

/**
 * Request an access token using GIS token client
 */
export async function requestGoogleAccessToken({ scopes = DEFAULT_SCOPES } = {}) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('MISSING_CLIENT_ID')
  }

  await waitForGsi()

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: scopes,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error))
          }

          const accessToken = tokenResponse.access_token
          const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600
          const expiresAt = Date.now() + (expiresIn - 60) * 1000 // 60s buffer

          let user = {
            id: 'google-user',
            email: 'Google Classroom Account',
            name: 'Google User',
            picture: null,
          }

          try {
            // Fetch Google user profile
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            if (profileRes.ok) {
              const profile = await profileRes.json()
              user = {
                id: profile.sub || 'user',
                email: profile.email || 'Google Classroom Account',
                name: profile.name || 'Google User',
                picture: profile.picture || null,
              }
            }
          } catch (profileErr) {
            console.warn('Profile fetch warning (non-fatal):', profileErr)
          }

          const authData = {
            accessToken,
            expiresAt,
            user,
            scopes,
            isMock: false,
          }

          saveAuth(authData)
          resolve(authData)
        },
      })

      tokenClient.requestAccessToken()
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Revoke or logout
 */
export function signOutGoogle(accessToken) {
  if (accessToken && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        // Revoked successfully
      })
    } catch (e) {
      console.warn('Revoke error (safe to ignore on client):', e)
    }
  }
  clearAuth()
}
