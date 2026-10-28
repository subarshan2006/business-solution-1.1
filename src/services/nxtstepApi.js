/**
 * NxtStep Backend API Client Service
 * 
 * Provides end-to-end typed/structured bindings to the Express 4 backend:
 * - Session token management (cookie & Authorization Bearer)
 * - Uniform envelope unwrapping & typed ApiError handling
 * - Authentication (Google GIS exchange, Dev Login, Profile, Logout)
 * - Teacher: Question Banks, Async Processing Jobs, Review, Tests, Results
 * - Student: Assigned Tests, Start Attempt, Autosave, Submit, Results
 * - Parent: Linked Children, Test Attempts & Performance History
 * - Admin: Users, Roles, Parent-Student Links, Asset Cleanup
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const TOKEN_KEY = 'nxtstep_session_token'
const USER_KEY = 'nxtstep_session_user'

export class ApiError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', details = [], status = 500) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.status = status
  }
}

/**
 * Token and User session state helpers
 */

/**
 * Checks whether a JWT session token is expired or structurally invalid.
 * Uses a 10-second buffer to proactively prevent requests on expiring tokens.
 */
export function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    // base64url decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (!payload.exp) return false
    return payload.exp * 1000 <= Date.now() + 10000
  } catch {
    return true
  }
}

export function getStoredSessionToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null
    if (token && isTokenExpired(token)) {
      clearSessionToken()
      return null
    }
    return token
  } catch {
    return null
  }
}

export function saveSessionToken(token, persist = true) {
  try {
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      sessionStorage.setItem(TOKEN_KEY, token)
    }
  } catch (err) {
    console.warn('Failed to store session token:', err)
  }
}

export function clearSessionToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(USER_KEY)
  } catch (err) {
    console.warn('Failed to clear session token:', err)
  }
}

export function getStoredSessionUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSessionUser(user, persist = true) {
  try {
    const serialized = JSON.stringify(user)
    if (persist) {
      localStorage.setItem(USER_KEY, serialized)
    } else {
      sessionStorage.setItem(USER_KEY, serialized)
    }
  } catch (err) {
    console.warn('Failed to store session user:', err)
  }
}

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getStoredSessionToken()

  const headers = new Headers(options.headers || {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Avoid setting Content-Type for FormData (browser sets boundary automatically)
  const isFormData = options.body instanceof FormData
  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const config = {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  }

  let response
  try {
    response = await fetch(url, config)
  } catch (networkErr) {
    throw new ApiError(
      networkErr.message || 'Network connection error. Please verify the backend is running.',
      'NETWORK_ERROR',
      [],
      0
    )
  }

  // Rate Limiting (429)
  if (response.status === 429) {
    throw new ApiError(
      'Too many requests. Please slow down and try again shortly.',
      'RATE_LIMITED',
      [],
      429
    )
  }

  // Parse JSON response
  let json
  try {
    json = await response.json()
  } catch {
    json = null
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSessionToken()
    }
    const code = json?.error?.code || 'HTTP_ERROR'
    const message = json?.error?.message || `Request failed with status ${response.status}`
    const details = json?.error?.details || []
    throw new ApiError(message, code, details, response.status)
  }

  // Standard NxtStep envelope: { success: true, data: ..., pagination?: ... }
  if (json && json.success === false) {
    throw new ApiError(
      json.error?.message || 'Operation failed',
      json.error?.code || 'UNKNOWN_ERROR',
      json.error?.details || [],
      response.status
    )
  }

  return {
    data: json?.data !== undefined ? json.data : json,
    pagination: json?.pagination || null,
  }
}

// -----------------------------------------------------------------------------
// 1. Authentication Endpoints
// -----------------------------------------------------------------------------

export const authApi = {
  /**
   * Exchange Google OAuth GIS Access Token
   */
  async googleLogin(accessToken) {
    const res = await request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ accessToken, token: accessToken }),
    })
    if (res.data?.token) {
      saveSessionToken(res.data.token)
    }
    if (res.data?.user) {
      saveSessionUser(res.data.user)
    }
    return res.data
  },

  /**
   * Fast Development Login (Requires ALLOW_DEV_AUTH=true on backend)
   */
  async devLogin({ email, role, name }) {
    const res = await request('/api/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ email, role, name }),
    })
    if (res.data?.token) {
      saveSessionToken(res.data.token)
    }
    if (res.data?.user) {
      saveSessionUser(res.data.user)
    }
    return res.data
  },

  /**
   * Fetch authenticated user profile
   */
  async getMe() {
    const res = await request('/api/auth/me', { method: 'GET' })
    if (res.data?.user) {
      saveSessionUser(res.data.user)
    }
    return res.data?.user || res.data
  },

  /**
   * Terminate user session
   */
  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' })
    } finally {
      clearSessionToken()
    }
  },
}

/**
 * Ensures an active, unexpired session token is available.
 * If missing or expired, attempts to acquire one via devLogin with provided or fallback credentials.
 */
export async function ensureActiveSession(fallbackUser = {}) {
  const token = getStoredSessionToken()
  if (token && !isTokenExpired(token)) {
    return token
  }

  const email = fallbackUser.email || 'teacher@nxtstep.com'
  const name = fallbackUser.name || 'Lead Teacher'
  const role = fallbackUser.role || 'TEACHER'

  const devRes = await authApi.devLogin({ email, role, name })
  return devRes?.token || null
}

// -----------------------------------------------------------------------------
// 2. Question Banks & Background Processing Jobs (Teacher)
// -----------------------------------------------------------------------------

export const questionBankApi = {
  /**
   * Upload an Exam Paper PDF for asynchronous OCR & Vision structuring
   */
  async uploadPdf({ file, title, subject, description }) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    if (subject) formData.append('subject', subject)
    if (description) formData.append('description', description)

    const res = await request('/api/question-banks/upload', {
      method: 'POST',
      body: formData,
    })
    return res.data // { questionBankId, jobId, status: "QUEUED", totalPages }
  },

  /**
   * Poll processing job progress
   */
  async getProcessingJob(jobId) {
    const res = await request(`/api/processing-jobs/${encodeURIComponent(jobId)}`, {
      method: 'GET',
    })
    return res.data
  },

  /**
   * Cancel ongoing processing job
   */
  async cancelProcessingJob(jobId) {
    const res = await request(`/api/processing-jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Retry failed processing job
   */
  async retryProcessingJob(jobId) {
    const res = await request(`/api/processing-jobs/${encodeURIComponent(jobId)}/retry`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * List all question banks for current teacher
   */
  async listQuestionBanks() {
    const res = await request('/api/question-banks', { method: 'GET' })
    return res.data
  },

  /**
   * Get single question bank details
   */
  async getQuestionBank(id) {
    const res = await request(`/api/question-banks/${encodeURIComponent(id)}`, {
      method: 'GET',
    })
    return res.data
  },

  /**
   * Advance entire question bank status to APPROVED
   */
  async approveQuestionBank(id) {
    const res = await request(`/api/question-banks/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Assign students directly to a question bank / quiz
   */
  async assignStudents(id, { studentEmails = [], studentIds = [], attemptDurationMinutes, timeLimitMinutes, ...settings } = {}) {
    const res = await request(`/api/question-banks/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        studentEmails,
        studentIds,
        attemptDurationMinutes,
        timeLimitMinutes,
        ...settings,
      }),
    })
    return res.data
  },
}

// -----------------------------------------------------------------------------
// 3. Question Review, Editing & Approval (Teacher)
// -----------------------------------------------------------------------------

export const questionReviewApi = {
  /**
   * List questions in bank with pagination and review filters
   */
  async listQuestions(bankId, { status, needsReview, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (needsReview !== undefined && needsReview !== null && needsReview !== '') {
      params.set('needsReview', String(needsReview))
    }
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await request(`/api/question-banks/${encodeURIComponent(bankId)}/questions?${params.toString()}`, {
      method: 'GET',
    })
    return res // returns { data, pagination }
  },

  /**
   * Fetch single question with full options and images
   */
  async getQuestion(id) {
    const res = await request(`/api/questions/${encodeURIComponent(id)}`, {
      method: 'GET',
    })
    return res.data
  },

  /**
   * Edit question prompt, correct option, explanation, or needsReview flag
   */
  async updateQuestion(id, patch) {
    const res = await request(`/api/questions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    return res.data
  },

  /**
   * Edit an individual option of a question
   */
  async updateOption(questionId, optionId, patch) {
    const res = await request(`/api/questions/${encodeURIComponent(questionId)}/options/${encodeURIComponent(optionId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    return res.data
  },

  /**
   * Approve a question for tests
   */
  async approveQuestion(id) {
    const res = await request(`/api/questions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Reject a question with optional reason
   */
  async rejectQuestion(id, reason = '') {
    const res = await request(`/api/questions/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    return res.data
  },

  /**
   * Replace question image (diagram/formula)
   */
  async replaceQuestionImage(id, file) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await request(`/api/questions/${encodeURIComponent(id)}/replace-image`, {
      method: 'POST',
      body: formData,
    })
    return res.data
  },
}

// -----------------------------------------------------------------------------
// 4. Test Creation, Management & Results (Teacher)
// -----------------------------------------------------------------------------

export const testManagementApi = {
  /**
   * Create a new draft test
   */
  async createTest({
    title,
    description = '',
    questionBankId,
    startTime,
    endTime,
    attemptDurationMinutes,
    questionIds,
    studentIds,
    studentEmails,
    randomizeQuestions = false,
    randomizeOptions = false,
    showResults = true,
    showExplanations = true,
    publishImmediately = false,
  }) {
    const res = await request('/api/tests', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        questionBankId,
        startTime,
        endTime,
        attemptDurationMinutes,
        questionIds,
        studentIds,
        studentEmails,
        randomizeQuestions,
        randomizeOptions,
        showResults,
        showExplanations,
        publishImmediately,
      }),
    })
    return res.data
  },

  /**
   * List tests created by teacher
   */
  async listTests() {
    const res = await request('/api/tests', { method: 'GET' })
    return res.data
  },

  /**
   * Inspect single test
   */
  async getTest(id) {
    const res = await request(`/api/tests/${encodeURIComponent(id)}`, { method: 'GET' })
    return res.data
  },

  /**
   * Publish test
   */
  async publishTest(id) {
    const res = await request(`/api/tests/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Unpublish test
   */
  async unpublishTest(id) {
    const res = await request(`/api/tests/${encodeURIComponent(id)}/unpublish`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Archive test
   */
  async archiveTest(id) {
    const res = await request(`/api/tests/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Assign additional students to a test
   */
  async assignStudents(id, { studentEmails = [], studentIds = [] } = {}) {
    const payload = Array.isArray(arguments[1])
      ? { studentIds: arguments[1] }
      : { studentEmails, studentIds }
    const res = await request(`/api/tests/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  /**
   * Get class-level aggregated results and roster for a test
   */
  async getTestResults(testId) {
    const res = await request(`/api/teacher/results/tests/${encodeURIComponent(testId)}`, {
      method: 'GET',
    })
    return res.data
  },

  /**
   * Get detailed student attempt results for teacher review
   */
  async getAttemptDetails(attemptId) {
    const res = await request(`/api/teacher/results/attempts/${encodeURIComponent(attemptId)}`, {
      method: 'GET',
    })
    return res.data
  },
}

// -----------------------------------------------------------------------------
// 5. Student Workflows & Test Taking
// -----------------------------------------------------------------------------

export const studentApi = {
  /**
   * List assigned published tests for logged-in student
   */
  async getAssignedTests() {
    const res = await request('/api/student/tests', { method: 'GET' })
    return res.data
  },

  /**
   * Start or resume a test attempt (Strict DTO whitelist - correctOption stripped)
   */
  async startAttempt(testId) {
    const res = await request(`/api/student/tests/${encodeURIComponent(testId)}/start`, {
      method: 'POST',
    })
    return res.data
  },

  /**
   * Autosave or submit intermediate answers during a test
   */
  async saveAnswers(testId, answers) {
    const res = await request(`/api/student/tests/${encodeURIComponent(testId)}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    })
    return res.data
  },

  /**
   * Submit final test attempt
   */
  async submitAttempt(testId, answers = null) {
    const payload = answers ? { answers } : {}
    const res = await request(`/api/student/tests/${encodeURIComponent(testId)}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data
  },

  /**
   * View score & post-test explanations (if enabled by teacher)
   */
  async getTestResult(testId) {
    const res = await request(`/api/student/tests/${encodeURIComponent(testId)}/result`, {
      method: 'GET',
    })
    return res.data
  },
}

// -----------------------------------------------------------------------------
// 6. Parent Workflows & Performance History
// -----------------------------------------------------------------------------

export const parentApi = {
  /**
   * List children linked to the authenticated parent
   */
  async getLinkedStudents() {
    const res = await request('/api/parent/students', { method: 'GET' })
    return res.data
  },

  /**
   * Get test attempts history for a linked child
   */
  async getChildAttempts(studentId) {
    const res = await request(`/api/parent/students/${encodeURIComponent(studentId)}/attempts`, {
      method: 'GET',
    })
    return res.data
  },

  /**
   * Get detailed breakdown of a single attempt by child
   */
  async getChildAttemptDetail(studentId, attemptId) {
    const res = await request(
      `/api/parent/students/${encodeURIComponent(studentId)}/attempts/${encodeURIComponent(attemptId)}`,
      { method: 'GET' }
    )
    return res.data
  },
}

// -----------------------------------------------------------------------------
// 7. Teacher Student Roster & Connection Management
// -----------------------------------------------------------------------------

export const teacherStudentApi = {
  /**
   * List all students connected to authenticated teacher
   */
  async listStudents() {
    const res = await request('/api/teacher/students', { method: 'GET' })
    return res.data
  },

  /**
   * Add student(s) to teacher roster by ID or email
   */
  async addStudents({ studentId, studentEmail, studentIds, studentEmails } = {}) {
    const res = await request('/api/teacher/students', {
      method: 'POST',
      body: JSON.stringify({ studentId, studentEmail, studentIds, studentEmails }),
    })
    return res.data
  },

  /**
   * Remove student from teacher roster
   */
  async removeStudent(studentId) {
    const res = await request(`/api/teacher/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
    })
    return res.data
  },

  /**
   * List all teachers connected to authenticated student
   */
  async listTeachers() {
    const res = await request('/api/student/teachers', { method: 'GET' })
    return res.data
  },
}

// -----------------------------------------------------------------------------
// 7. Admin Workflows & System Monitoring
// -----------------------------------------------------------------------------

export const adminApi = {
  /**
   * List users with optional role & active status filter
   */
  async listUsers({ role = '', isActive = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams()
    if (role) params.set('role', role)
    if (isActive !== '' && isActive !== undefined) params.set('isActive', String(isActive))
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await request(`/api/admin/users?${params.toString()}`, { method: 'GET' })
    return res
  },

  /**
   * Update user role (TEACHER, STUDENT, PARENT, ADMIN)
   */
  async updateUserRole(userId, role) {
    const res = await request(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    return res.data
  },

  /**
   * Deactivate or activate user account
   */
  async updateUserStatus(userId, isActive) {
    const res = await request(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
    return res.data
  },

  /**
   * Link parent account to student profile
   */
  async linkParentToStudent(parentId, studentId) {
    const res = await request(`/api/admin/parents/${encodeURIComponent(parentId)}/link-student`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    })
    return res.data
  },

  /**
   * Unlink parent account from student profile
   */
  async unlinkParentFromStudent(parentId, studentId) {
    const res = await request(
      `/api/admin/parents/${encodeURIComponent(parentId)}/link-student/${encodeURIComponent(studentId)}`,
      { method: 'DELETE' }
    )
    return res.data
  },

  /**
   * Trigger immediate asset retention cleanup
   */
  async triggerCleanup() {
    const res = await request('/api/admin/cleanup/trigger', { method: 'POST' })
    return res.data
  },

  /**
   * Inspect background cleanup worker status
   */
  async getCleanupStatus() {
    const res = await request('/api/admin/cleanup/status', { method: 'GET' })
    return res.data
  },
}

export default {
  auth: authApi,
  questionBanks: questionBankApi,
  questions: questionReviewApi,
  tests: testManagementApi,
  student: studentApi,
  parent: parentApi,
  admin: adminApi,
  teacherStudents: teacherStudentApi,
}
