/**
 * Quiz Attempt Service
 * Manages tracking and persistence of student quiz attempts.
 * Supports one-time attempt enforcement, result recording, and teacher audit reports.
 */

const ATTEMPTS_STORAGE_KEY = 'nxtstep_quiz_attempts'
const STUDENT_RESULTS_PREFIX = 'nxtstep_student_results_'

/**
 * Retrieve all attempt records
 */
export function getAllAttempts() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to parse attempts from storage:', err)
    return []
  }
}

/**
 * Retrieve all marks and attempts stored strictly under a student's verified email partition
 */
export function getStudentEmailPartitionResults(studentEmail) {
  if (!studentEmail) return []
  const cleanEmail = String(studentEmail).trim().toLowerCase()
  try {
    const studentPartitionKey = `${STUDENT_RESULTS_PREFIX}${cleanEmail}`
    const raw = localStorage.getItem(studentPartitionKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('Error reading student email partition:', e)
  }
  // Fallback to filtering master attempts by verified student email
  const attempts = getAllAttempts()
  return attempts.filter((a) => a.studentEmail === cleanEmail)
}

/**
 * Get a specific student's attempt for a question bank
 */
export function getStudentAttempt(bankId, studentEmail) {
  if (!bankId || !studentEmail) return null
  const cleanEmail = String(studentEmail).trim().toLowerCase()
  
  // 1. Check isolated email partition first
  try {
    const partitionKey = `${STUDENT_RESULTS_PREFIX}${cleanEmail}`
    const raw = localStorage.getItem(partitionKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const found = parsed.find((a) => a.bankId === bankId && a.studentEmail === cleanEmail)
        if (found) return found
      }
    }
  } catch (e) {
    console.warn('Partition lookup error:', e)
  }

  // 2. Fallback to master attempts list
  const attempts = getAllAttempts()
  return attempts.find((a) => a.bankId === bankId && a.studentEmail === cleanEmail) || null
}

/**
 * Check if student has already completed an attempt
 */
export function hasCompletedAttempt(bankId, studentEmail) {
  const attempt = getStudentAttempt(bankId, studentEmail)
  return Boolean(attempt && attempt.status === 'completed')
}

/**
 * Save / Record a student's completed quiz attempt strictly under student email
 */
export function recordCompletedAttempt(bankId, studentEmail, {
  score = 0,
  totalQuestions = 0,
  answers = [],
  studentName = '',
  fullscreenViolations = 0,
} = {}) {
  if (!bankId || !studentEmail) return null

  const cleanEmail = String(studentEmail).trim().toLowerCase()
  const attempts = getAllAttempts()
  const now = new Date().toISOString()
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

  const newAttempt = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bankId,
    studentEmail: cleanEmail,
    studentName: studentName || cleanEmail.split('@')[0],
    status: 'completed',
    score,
    totalQuestions,
    percentage,
    completedAt: now,
    answers,
    fullscreenViolations: Number(fullscreenViolations) || 0,
    verifiedEmailOwner: cleanEmail,
  }

  // 1. Strictly store under student's personal email partition key
  try {
    const studentPartitionKey = `${STUDENT_RESULTS_PREFIX}${cleanEmail}`
    const existingRaw = localStorage.getItem(studentPartitionKey)
    const studentAttempts = existingRaw ? JSON.parse(existingRaw) : []
    const idx = studentAttempts.findIndex((a) => a.bankId === bankId)
    let updatedStudentAttempts
    if (idx >= 0) {
      updatedStudentAttempts = [...studentAttempts]
      updatedStudentAttempts[idx] = newAttempt
    } else {
      updatedStudentAttempts = [newAttempt, ...studentAttempts]
    }
    localStorage.setItem(studentPartitionKey, JSON.stringify(updatedStudentAttempts))
  } catch (err) {
    console.warn('Failed to save to student email partition:', err)
  }

  // 2. Store in master list for teacher auditing
  const existingIndex = attempts.findIndex((a) => a.bankId === bankId && a.studentEmail === cleanEmail)
  let updated
  if (existingIndex >= 0) {
    updated = [...attempts]
    updated[existingIndex] = newAttempt
  } else {
    updated = [newAttempt, ...attempts]
  }

  try {
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save attempt to localStorage:', err)
  }

  return newAttempt
}

/**
 * List all attempts for a given Question Bank (for teacher dashboard)
 */
export function listBankAttempts(bankId) {
  if (!bankId) return []
  const attempts = getAllAttempts()
  return attempts.filter((a) => a.bankId === bankId)
}

/**
 * Reset / Clear a student's attempt (Teacher action to grant retake)
 */
export function resetStudentAttempt(bankId, studentEmail) {
  if (!bankId || !studentEmail) return false
  const cleanEmail = String(studentEmail).trim().toLowerCase()
  
  // 1. Remove from student partition
  try {
    const studentPartitionKey = `${STUDENT_RESULTS_PREFIX}${cleanEmail}`
    const existingRaw = localStorage.getItem(studentPartitionKey)
    if (existingRaw) {
      const studentAttempts = JSON.parse(existingRaw)
      const filtered = studentAttempts.filter((a) => a.bankId !== bankId)
      localStorage.setItem(studentPartitionKey, JSON.stringify(filtered))
    }
  } catch (e) {
    console.warn('Partition reset error:', e)
  }

  // 2. Remove from master attempts
  const attempts = getAllAttempts()
  const filtered = attempts.filter((a) => !(a.bankId === bankId && a.studentEmail === cleanEmail))
  try {
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (err) {
    console.error('Failed to reset attempt:', err)
    return false
  }
}

/**
 * Build CSV string of all attempts for a Question Bank
 */
export function exportAttemptsToCsv(bankId, _bankTitle = 'Question Bank') {
  const attempts = listBankAttempts(bankId)
  const header = ['Student Email', 'Student Name', 'Status', 'Score', 'Total Questions', 'Percentage', 'Completed At']
  const rows = attempts.map((a) => [
    `"${a.studentEmail}"`,
    `"${a.studentName || ''}"`,
    `"${a.status}"`,
    a.score,
    a.totalQuestions,
    `"${a.percentage}%"`,
    `"${a.completedAt}"`,
  ])

  const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
  return csvContent
}
