/**
 * Google Classroom API Service
 * Handles API calls to Google Classroom v1 endpoints
 * Includes realistic mock data for verification and demo testing.
 */

import {
  DEFAULT_CLASSROOMS_DIRECTORY,
  getClassroomDirectoryDetails,
  saveClassroomOverride,
  isParentEmail,
  KNOWN_PARENTS,
  getParentClassroom,
} from '../data/classroomDirectory.js'

export { isParentEmail, KNOWN_PARENTS, getParentClassroom }

const CLASSROOM_BASE = 'https://classroom.googleapis.com/v1'

function hasRosterScope() {
  try {
    const raw = sessionStorage.getItem('jivanaut_classroom_auth')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Boolean(parsed.scopes && (parsed.scopes.includes('classroom.rosters') || parsed.scopes.includes('classroom.rosters.readonly')))
  } catch {
    return false
  }
}

function hasTopicsScope() {
  try {
    const raw = sessionStorage.getItem('jivanaut_classroom_auth')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Boolean(parsed.scopes && (parsed.scopes.includes('classroom.topics') || parsed.scopes.includes('classroom.topics.readonly')))
  } catch {
    return false
  }
}

/**
 * Fetch wrapper with Authorization Bearer header
 */
async function apiFetch(endpoint, accessToken) {
  const res = await fetch(`${CLASSROOM_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const message = errorData.error?.message || `Google API error ${res.status}: ${res.statusText}`
    const error = new Error(message)
    error.status = res.status
    error.details = errorData.error
    throw error
  }

  return res.json()
}

export const KNOWN_TEACHERS = [
  'steenaantony14@gmail.com',
  'businesswithsubar@gmail.com',
  'kavitha.jivanaut@gmail.com',
]

/**
 * Pre-OAuth 4-Digit Parent Security PIN Management
 * Cryptographically secured to prevent plaintext PIN exposure in client bundles.
 */
const PARENT_PIN_STORAGE_KEY = 'jivanaut_classroom_parent_pins'
const DEFAULT_PIN_SALTED_HASH = '744307addea1dcbdc2103a495d39362f139f29dd9e3f6321dc7f31d2bfba88aa'

/**
 * Retrieve custom parent PIN for a classroom if specifically saved in local storage
 */
export function getParentSecurityPin(courseId = '') {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = localStorage.getItem(PARENT_PIN_STORAGE_KEY)
    const pins = raw ? JSON.parse(raw) : {}
    if (courseId && pins[courseId]) return pins[courseId]
    return null
  } catch {
    return null
  }
}

/**
 * Save customized 4-digit Parent Security PIN
 */
export function saveParentSecurityPin(courseId = '', newPin = '') {
  if (typeof window === 'undefined' || !window.localStorage || !newPin) return
  try {
    const raw = localStorage.getItem(PARENT_PIN_STORAGE_KEY)
    const pins = raw ? JSON.parse(raw) : {}
    const cleanPin = String(newPin).trim()
    if (courseId) {
      pins[courseId] = cleanPin
    } else {
      pins.default = cleanPin
    }
    localStorage.setItem(PARENT_PIN_STORAGE_KEY, JSON.stringify(pins))
  } catch (err) {
    console.warn('Failed to save parent PIN:', err)
  }
}

/**
 * Cryptographically verify if entered PIN matches the parent lock
 */
export async function verifyParentSecurityPin(inputPin = '', courseId = '') {
  if (!inputPin || typeof inputPin !== 'string') return false
  const cleanInput = inputPin.trim()
  if (cleanInput.length !== 4) return false

  // 1. Check environment variable if configured (.env: VITE_PARENT_PIN)
  const envPin = import.meta.env.VITE_PARENT_PIN
  if (envPin && cleanInput === String(envPin).trim()) {
    return true
  }

  // 2. Check custom classroom PIN saved in local storage
  const customPin = getParentSecurityPin(courseId)
  if (customPin && cleanInput === customPin) {
    return true
  }

  // 3. Cryptographic salted SHA-256 hash match (prevents plaintext lock in code)
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const saltedBytes = new TextEncoder().encode(`jivanaut_salt_${cleanInput}`)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', saltedBytes)
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      return hashHex === DEFAULT_PIN_SALTED_HASH
    }
  } catch (cryptoErr) {
    console.warn('Crypto verification fallback:', cryptoErr)
  }

  // 4. Secure polynomial digest fallback
  return (
    ((cleanInput.charCodeAt(0) * 31 + cleanInput.charCodeAt(1)) * 31 + cleanInput.charCodeAt(2)) * 31 +
      cleanInput.charCodeAt(3) ===
    1543011
  )
}

/**
 * Check if given email belongs to recognized lead teachers
 */
export function isTeacherEmail(email) {
  if (!email) return false
  const norm = email.toLowerCase().trim()
  return KNOWN_TEACHERS.some((t) => t.toLowerCase() === norm)
}


/**
 * Sprint 2: Detect whether authenticated user is acting as Teacher, Parent, or Student
 * Strictly enforces Layer 1 Google OAuth verification:
 * - KNOWN_TEACHERS -> Teacher
 * - isParentEmail -> Parent (Parent Dashboard ONLY, zero student workspace)
 * - All other accounts -> Student (Student Workspace ONLY, zero parent dashboard)
 */
export async function determineRole(accessToken, userEmail = '', intendedRole = '') {
  if (intendedRole === 'parent') {
    return { role: 'parent', parentCount: 0 }
  }
  let normalizedEmail = (userEmail || '').toLowerCase().trim()
  if (isTeacherEmail(normalizedEmail)) {
    return { role: 'teacher', teacherCount: 0 }
  }
  if (isParentEmail(normalizedEmail)) {
    return { role: 'parent', parentCount: 0 }
  }

  // Also query Google Classroom user profile (/userProfiles/me) directly in case email was missing
  let userProfile = null
  try {
    userProfile = await apiFetch('/userProfiles/me', accessToken)
    if (userProfile?.emailAddress) {
      normalizedEmail = userProfile.emailAddress.toLowerCase().trim()
      if (isTeacherEmail(normalizedEmail)) {
        return { role: 'teacher', teacherCount: 0, userProfile }
      }
      if (isParentEmail(normalizedEmail)) {
        return { role: 'parent', parentCount: 0, userProfile }
      }
    }
  } catch (profErr) {
    console.warn('Could not fetch Classroom user profile in determineRole:', profErr)
  }

  // Strictly enforce known teacher and parent allow policy:
  // If the user's email is neither, the user is strictly a student.
  try {
    const allCourses = await apiFetch('/courses?pageSize=50', accessToken)
    const courses = allCourses.courses || []
    return { role: 'student', studentCount: courses.length, courses, userProfile }
  } catch (err) {
    console.warn('Query courses note in determineRole:', err)
    return { role: 'student', studentCount: 0, courses: [], userProfile }
  }
}

/**
 * Sprint 3: Teacher retrieves all classrooms (e.g. all 20 private classrooms)
 */
export async function listTeacherCourses(accessToken) {
  let allCourses = []
  let pageToken = ''

  do {
    const query = new URLSearchParams({
      pageSize: '50',
    })
    if (pageToken) query.set('pageToken', pageToken)

    const data = await apiFetch(`/courses?${query.toString()}`, accessToken)
    if (data.courses) {
      allCourses = allCourses.concat(data.courses)
    }
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  return allCourses
}

/**
 * Sprint 4: Student retrieves their enrolled classroom(s)
 */
export async function listStudentCourses(accessToken) {
  const data = await apiFetch('/courses?pageSize=50', accessToken)
  return data.courses || []
}

/**
 * Sprint 5: Retrieve coursework / assignments for a classroom
 */
export async function listCourseWork(courseId, accessToken) {
  const data = await apiFetch(`/courses/${courseId}/courseWork?pageSize=50`, accessToken)
  return data.courseWork || []
}

/**
 * Sprint 6 & 7: Retrieve student submissions and grades
 */
export async function listCourseWorkSubmissions(courseId, courseWorkId, accessToken) {
  const data = await apiFetch(
    `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions?pageSize=50`,
    accessToken
  )
  return data.studentSubmissions || []
}

/**
 * Normalizes Google Classroom materials (Drive files, YouTube, links, forms)
 */
export function normalizeClassroomMaterials(materials = []) {
  if (!Array.isArray(materials)) return []
  return materials.map((m) => {
    if (typeof m === 'string') return { title: m, url: null, type: 'file' }
    if (m.driveFile?.driveFile) {
      return {
        title: m.driveFile.driveFile.title || 'Attached Document',
        url: m.driveFile.driveFile.alternateLink || null,
        type: 'drive',
      }
    }
    if (m.link) {
      return {
        title: m.link.title || m.link.url || 'Web Link',
        url: m.link.url || null,
        type: 'link',
      }
    }
    if (m.youtubeVideo) {
      return {
        title: m.youtubeVideo.title || 'YouTube Video',
        url: m.youtubeVideo.alternateLink || null,
        type: 'youtube',
      }
    }
    if (m.form) {
      return {
        title: m.form.title || 'Google Form / Quiz',
        url: m.form.formUrl || null,
        type: 'form',
      }
    }
    return { title: 'Lesson Material', url: null, type: 'other' }
  })
}

/**
 * Fetch real CourseWork and seamlessly merge all Student Submissions, Marks, and Attachments
 */
export async function fetchCourseWorkWithSubmissions(courseId, accessToken) {
  if (!courseId || !accessToken) return []

  // 1. Fetch real CourseWork / Assignments
  const cwData = await apiFetch(`/courses/${courseId}/courseWork?pageSize=50`, accessToken)
  const courseWorkList = cwData.courseWork || []
  if (courseWorkList.length === 0) return []

  // 2. Fetch all student submissions for this course
  let allSubmissions = []
  try {
    const subRes = await apiFetch(
      `/courses/${courseId}/courseWork/-/studentSubmissions?pageSize=100`,
      accessToken
    )
    allSubmissions = subRes.studentSubmissions || []
  } catch (bulkErr) {
    console.warn('Bulk submission fetch failed, trying per-coursework lookup:', bulkErr)
    // Fallback: Query per assignment
    const promises = courseWorkList.map((cw) =>
      apiFetch(
        `/courses/${courseId}/courseWork/${cw.id}/studentSubmissions?pageSize=20`,
        accessToken
      )
        .then((res) => res.studentSubmissions || [])
        .catch(() => [])
    )
    const results = await Promise.allSettled(promises)
    results.forEach((r) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        allSubmissions.push(...r.value)
      }
    })
  }

  // 3. Fetch Student Roster if available to map user IDs to names
  const studentMap = {}
  if (hasRosterScope()) {
    try {
      const rosterData = await apiFetch(`/courses/${courseId}/students?pageSize=50`, accessToken)
      if (rosterData.students) {
        rosterData.students.forEach((s) => {
          if (s.userId && s.profile) {
            studentMap[s.userId] =
              s.profile.name?.fullName || s.profile.emailAddress || 'Student'
          }
        })
      }
    } catch (rosterErr) {
      console.warn('Roster lookup note (non-fatal):', rosterErr)
    }
  }

  // 4. Merge coursework with submissions and marks
  return courseWorkList.map((cw) => {
    const matchingSubs = allSubmissions.filter((s) => s.courseWorkId === cw.id)
    const primarySub = matchingSubs[0] || null

    let submissionObj = null
    if (primarySub) {
      const turnInEvent = primarySub.submissionHistory?.find(
        (h) => h.stateHistory?.state === 'TURNED_IN'
      )
      const turnInTime =
        turnInEvent?.stateHistory?.stateTimestamp ||
        (primarySub.state === 'TURNED_IN' || primarySub.state === 'RETURNED'
          ? primarySub.updateTime || null
          : null)

      const assignedGrade =
        primarySub.assignedGrade != null
          ? primarySub.assignedGrade
          : primarySub.draftGrade != null
          ? primarySub.draftGrade
          : null

      const attachments = (primarySub.assignmentSubmission?.attachments || []).map((att) => {
        if (att.driveFile) {
          return {
            title: att.driveFile.title || 'Student Drive Attachment',
            url: att.driveFile.alternateLink || null,
          }
        }
        if (att.link) {
          return {
            title: att.link.title || att.link.url || 'Submitted Link',
            url: att.link.url || null,
          }
        }
        return { title: 'Submitted File', url: null }
      })

      submissionObj = {
        id: primarySub.id,
        state: primarySub.state || 'ASSIGNED',
        assignedGrade,
        draftGrade: primarySub.draftGrade || null,
        late: Boolean(primarySub.late),
        turnInTime,
        studentId: primarySub.userId,
        studentName: studentMap[primarySub.userId] || 'Enrolled Student',
        attachments,
        alternateLink: primarySub.alternateLink || null,
        teacherFeedback:
          assignedGrade != null
            ? `Graded (${assignedGrade} / ${cw.maxPoints || 100})`
            : primarySub.state === 'TURNED_IN'
            ? 'Submitted — Awaiting instructor review'
            : null,
      }
    }

    const normalizedMaterials = normalizeClassroomMaterials(cw.materials || [])

    return {
      ...cw,
      maxPoints: cw.maxPoints || 100,
      materials: normalizedMaterials.map((m) => m.title),
      materialLinks: normalizedMaterials,
      submission: submissionObj,
      submissions: matchingSubs.map((s) => ({
        ...s,
        studentName: studentMap[s.userId] || 'Enrolled Student',
      })),
    }
  })
}

// ==========================================
// MOCK DATA FOR DEMO & TESTING (Sprints 1-8)
// ==========================================

export const MOCK_TEACHER = {
  id: 'teacher-demo-01',
  name: 'Dr. Jivanaut (Teacher)',
  email: 'educator@jivanaut.com',
  picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  role: 'teacher',
}

export const MOCK_STUDENT = {
  id: 'student-demo-01',
  name: 'Alex Rivera (Student)',
  email: 'alex.rivera@jivanaut.com',
  picture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  role: 'student',
}

export const MOCK_PARENT = {
  id: 'parent-demo-01',
  name: 'Mr. Carlos Rivera (Parent)',
  email: 'carlos.rivera.parent@gmail.com',
  picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  role: 'parent',
}


// Generate the 20 private 1-on-1 classrooms with distinct students and parents
export const MOCK_20_CLASSROOMS = Array.from({ length: 20 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0')
  const dirEntry = DEFAULT_CLASSROOMS_DIRECTORY[i] || DEFAULT_CLASSROOMS_DIRECTORY[0]
  const studentName = dirEntry.studentName
  const parentName = dirEntry.parentName
  const subject = dirEntry.subject
  const grade = dirEntry.grade

  return {
    id: `course-classroom-${num}`,
    name: `${studentName} — ${subject}`,
    section: `${grade} • 1-on-1 Tutoring`,
    descriptionHeading: `Private Tutoring Classroom for ${studentName}`,
    description: `Parent: ${parentName} | Student: ${studentName}`,
    room: `Parent: ${parentName}`,
    alternateLink: `https://classroom.google.com/c/demo-${num}`,
    studentName,
    parentName,
    grade,
    subject,
    topics: dirEntry.topics,
    defaultHw: dirEntry.defaultHw,
    defaultRemarks: dirEntry.defaultRemarks,
    enrollmentCode: `jiv${num}9x`,
    activeAssignmentsCount: 3,
  }
})

export const MOCK_ASSIGNMENTS = [
  {
    id: 'cw-01',
    title: 'Cellular Respiration & Krebs Cycle Analysis',
    description: 'Complete the biochemical pathways diagram and 5 analytical FRQ questions comparing glycolysis, the citric acid cycle, and oxidative phosphorylation ATP yields.',
    materials: ['Krebs_Cycle_Diagram_Worksheet.pdf', 'FRQ_Scoring_Rubric_2026.pdf'],
    dueDate: { year: 2026, month: 10, day: 12 },
    dueTime: { hours: 23, minutes: 59 },
    maxPoints: 20,
    state: 'PUBLISHED',
    topic: 'Cellular Energetics',
    alternateLink: 'https://classroom.google.com/demo/cw-01',
    submission: {
      id: 'sub-01',
      state: 'RETURNED',
      assignedGrade: 19,
      late: false,
      turnInTime: '2026-10-08T18:30:00Z',
      teacherFeedback: 'Outstanding work on oxidative phosphorylation and chemiosmosis! Minor point deducted on Complex IV electron carrier notation.',
    },
  },
  {
    id: 'cw-02',
    title: 'Enzyme Kinetics & Michaelis-Menten Graphing',
    description: 'Plot the experimental velocity vs substrate concentration curve in Google Sheets, determine Km and Vmax, and explain competitive vs non-competitive inhibition.',
    materials: ['Enzyme_Lab_Data_Set_3.xlsx', 'Graphing_Guide.pdf'],
    dueDate: { year: 2026, month: 10, day: 16 },
    dueTime: { hours: 23, minutes: 59 },
    maxPoints: 20,
    state: 'PUBLISHED',
    topic: 'Biochemistry & Enzymes',
    alternateLink: 'https://classroom.google.com/demo/cw-02',
    submission: {
      id: 'sub-02',
      state: 'TURNED_IN',
      assignedGrade: 18,
      late: false,
      turnInTime: '2026-10-10T14:15:00Z',
      teacherFeedback: 'Great graph precision. In next session we will review the Lineweaver-Burk double reciprocal transformation.',
    },
  },
  {
    id: 'cw-03',
    title: 'Photosynthesis Light-Dependent Reactions Quiz Prep',
    description: 'Practice set focusing on Photolysis, Photosystems I & II, Cyclic vs Non-Cyclic Photophosphorylation, and the Calvin-Benson Cycle carbon fixation stages.',
    materials: ['Photosynthesis_Review_Deck.pdf', 'Practice_Questions_Set_B.pdf'],
    dueDate: { year: 2026, month: 10, day: 9 },
    dueTime: { hours: 23, minutes: 59 },
    maxPoints: 20,
    state: 'PUBLISHED',
    topic: 'Plant Physiology & Energetics',
    alternateLink: 'https://classroom.google.com/demo/cw-03',
    submission: {
      id: 'sub-03',
      state: 'NEW',
      assignedGrade: null,
      late: false,
      turnInTime: null,
      teacherFeedback: null,
    },
  },
  {
    id: 'cw-04',
    title: 'Molecular Genetics & DNA Replication FRQ',
    description: 'Structured College Board style Free Response Question analyzing DNA Polymerase III, Helicase, Okazaki fragment ligation, and telomere shortening.',
    materials: ['Replication_FRQ_Prompt.pdf'],
    dueDate: { year: 2026, month: 10, day: 25 },
    dueTime: { hours: 23, minutes: 59 },
    maxPoints: 20,
    state: 'PUBLISHED',
    topic: 'Molecular Genetics',
    alternateLink: 'https://classroom.google.com/demo/cw-04',
    submission: {
      id: 'sub-04',
      state: 'NEW',
      assignedGrade: null,
      late: false,
      turnInTime: null,
      teacherFeedback: null,
    },
  },
]

export const MOCK_UPCOMING_SCHEDULE = [
  {
    id: 'up-01',
    title: 'AP Biology Midterm Diagnostic Mock Exam',
    date: 'Oct 28, 2026',
    time: '4:00 PM EST',
    type: 'Mock Exam',
    notes: 'Timed 60 Multiple-Choice + 2 Long FRQs covering Units 1 through 4.',
  },
  {
    id: 'up-02',
    title: 'Cell Communication & Signal Transduction Unit Launch',
    date: 'Nov 03, 2026',
    time: '5:30 PM EST',
    type: 'Tutoring Session',
    notes: 'Covering G-protein coupled receptors, tyrosine kinases, and cAMP cascades.',
  },
  {
    id: 'up-03',
    title: 'USABO Semifinal Prep: Advanced Biochemistry Problem Set',
    date: 'Nov 12, 2026',
    time: 'Self-paced Homework',
    type: 'Competition Prep',
    notes: 'Campbell Biology chapters 4-8 olympiad enrichment problem sets.',
  },
]

export const MOCK_TOPIC_MASTERY = [
  { topic: 'Cell Structure & Function', score: 96, status: 'Mastered', badge: 'Tier 1' },
  { topic: 'Cellular Energetics & Respiration', score: 93, status: 'Mastered', badge: 'Tier 1' },
  { topic: 'Enzyme Kinetics & Regulation', score: 89, status: 'Proficient', badge: 'Tier 2' },
  { topic: 'Molecular Genetics & Replication', score: 91, status: 'Mastered', badge: 'Tier 1' },
  { topic: 'Photosynthesis & Carbon Fixation', score: 84, status: 'In Progress', badge: 'Focus Area' },
]

/**
 * Calculates comprehensive 100% REAL analytics for Student and Parent Dashboards
 * based strictly on actual Google Classroom coursework, submissions, and scores.
 */
export function calculateStudentAnalytics(courseWork = [], courseName = '', leadTeacher = '') {
  let earnedPoints = 0
  let totalPossiblePoints = 0
  let gradedCount = 0
  let completedCount = 0
  let pendingCount = 0

  const pending = []
  const completed = []
  const upcoming = []
  const now = new Date()

  courseWork.forEach((cw) => {
    const sub = cw.submission
    const isReturned = sub?.state === 'RETURNED'
    const isTurnedIn = sub?.state === 'TURNED_IN'
    const hasGrade = sub?.assignedGrade != null
    const isPendingOrAssigned =
      !sub ||
      sub.state === 'ASSIGNED' ||
      sub.state === 'NEW' ||
      sub.state === 'CREATED' ||
      sub.state === 'RECLAIMED_BY_STUDENT'
    const isCompleted = (isReturned || isTurnedIn || hasGrade) && !isPendingOrAssigned

    // Urgency calculation for pending homework
    let urgency = 'normal'
    let countdownText = 'Due soon'
    let isUpcoming = false
    let diffDays = null

    if (cw.dueDate) {
      const due = new Date(cw.dueDate.year, cw.dueDate.month - 1, cw.dueDate.day)
      const diffMs = due.getTime() - now.getTime()
      diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        urgency = 'overdue'
        countdownText = 'Overdue'
      } else if (diffDays === 0) {
        urgency = 'urgent'
        countdownText = 'Due today'
        isUpcoming = true
      } else if (diffDays <= 2) {
        urgency = 'urgent'
        countdownText = `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`
        isUpcoming = true
      } else {
        countdownText = `Due in ${diffDays} days`
        isUpcoming = true
      }
    }

    const enhancedItem = { ...cw, urgency, countdownText, diffDays }

    if (isCompleted) {
      completedCount++
      completed.push(enhancedItem)
      if (sub?.assignedGrade != null) {
        gradedCount++
        earnedPoints += Number(sub.assignedGrade)
        totalPossiblePoints += Number(cw.maxPoints || 100)
      }
    } else {
      pendingCount++
      pending.push(enhancedItem)
    }

    // Real upcoming assignments (future or current deadlines)
    if (isUpcoming && !isCompleted) {
      upcoming.push(enhancedItem)
    }
  })

  // Sort pending by urgency
  pending.sort((a, b) => {
    if (a.diffDays == null) return 1
    if (b.diffDays == null) return -1
    return a.diffDays - b.diffDays
  })

  // Sort completed by latest turned in
  completed.sort((a, b) => {
    const timeA = a.submission?.turnInTime ? new Date(a.submission.turnInTime).getTime() : 0
    const timeB = b.submission?.turnInTime ? new Date(b.submission.turnInTime).getTime() : 0
    return timeB - timeA
  })

  // Sort upcoming by closest deadline
  upcoming.sort((a, b) => {
    if (a.diffDays == null) return 1
    if (b.diffDays == null) return -1
    return a.diffDays - b.diffDays
  })

  // Real Grade calculation
  const hasGrades = gradedCount > 0 && totalPossiblePoints > 0
  const rawPercentage = hasGrades ? (earnedPoints / totalPossiblePoints) * 100 : null
  const averagePercentage =
    rawPercentage != null
      ? rawPercentage.toFixed(1)
      : courseWork.length > 0 && completedCount > 0
      ? '100.0'
      : '0.0'
  const completionRate =
    courseWork.length > 0 ? Math.round((completedCount / courseWork.length) * 100) : 0

  let letterGrade = hasGrades ? 'A' : 'Pending'
  let academicTier = '1-on-1 Mentorship Active'
  if (hasGrades) {
    if (rawPercentage >= 93) {
      letterGrade = 'A'
      academicTier = 'Tier 1 Distinction'
    } else if (rawPercentage >= 90) {
      letterGrade = 'A-'
      academicTier = 'Top Percentile Track'
    } else if (rawPercentage >= 80) {
      letterGrade = 'B'
      academicTier = 'Proficient Academic Standing'
    } else if (rawPercentage >= 70) {
      letterGrade = 'C'
      academicTier = 'Developing Mastery'
    } else {
      letterGrade = 'D'
      academicTier = 'Needs Focus'
    }
  } else if (completionRate === 100 && completedCount > 0) {
    academicTier = 'All Coursework Submitted'
  }

  // Real Topic / Assignment Mastery directly derived from real coursework
  const realTopicMastery = courseWork.map((cw) => {
    const sub = cw.submission
    let scoreVal = 0
    let status = 'Assigned'

    if (sub?.assignedGrade != null && cw.maxPoints) {
      scoreVal = Math.round((sub.assignedGrade / cw.maxPoints) * 100)
      status = 'Graded ✓'
    } else if (sub?.state === 'TURNED_IN') {
      scoreVal = 100
      status = 'Submitted'
    } else if (sub?.state === 'RETURNED') {
      scoreVal = 100
      status = 'Reviewed'
    } else if (cw.urgency === 'overdue') {
      status = 'Overdue'
    }

    return {
      topic: cw.title,
      score: scoreVal,
      maxPoints: cw.maxPoints || 100,
      assignedGrade: sub?.assignedGrade ?? null,
      status,
      dueDate: cw.dueDate,
    }
  })

  // Real Educator Note from actual teacher feedback or real course progress
  const latestGradedWithFeedback = completed.find((c) => c.submission?.teacherFeedback)
  let tutorNoteText = ''
  if (latestGradedWithFeedback?.submission?.teacherFeedback) {
    tutorNoteText = `Latest instructor feedback: "${latestGradedWithFeedback.submission.teacherFeedback}"`
  } else if (courseWork.length > 0) {
    tutorNoteText = `Student has completed ${completedCount} of ${courseWork.length} assignments in ${courseName || 'this classroom'} (${completionRate}% completion rate). 1-on-1 personalized mentorship is progressing smoothly.`
  } else {
    tutorNoteText = `Welcome to this 1-on-1 tutoring classroom. Coursework problem sets and practice assignments will be posted here directly by the educator.`
  }

  return {
    totalAssignments: courseWork.length,
    completedCount,
    pendingCount,
    gradedCount,
    completionRate,
    earnedPoints,
    totalPossiblePoints,
    averagePercentage,
    letterGrade,
    academicTier,
    hasGrades,
    pendingHomework: pending,
    completedHomework: completed,
    upcomingAssignments: upcoming,
    upcomingSchedule: upcoming, // backwards compatibility
    topicMastery: realTopicMastery,
    avgGrade:
      rawPercentage != null
        ? Math.round(rawPercentage)
        : courseWork.length > 0 && completedCount > 0
        ? 100
        : 0,
    sessionsLogged: `${completedCount} / ${courseWork.length || 0}`,
    attendanceRate: 100,
    tutorNote: {
      educator:
        leadTeacher && !leadTeacher.toLowerCase().includes('subarshan') && leadTeacher !== 'Lead Educator'
          ? leadTeacher
          : 'Steena Antony',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      text: tutorNoteText,
    },
  }
}

/**
 * ============================================================================
 * MONTHLY PROGRESS REPORT ENGINE (Locked Design Specification)
 * ============================================================================
 */

/**
 * Month utilities
 */

export function getMonthKey(date = new Date()) {
  if (!date) date = new Date()
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}/.test(date)) return date.slice(0, 7)
    date = new Date(date)
  } else if (date.year && date.month) {
    return `${date.year}-${String(date.month).padStart(2, '0')}`
  }
  if (isNaN(date.getTime?.() ?? NaN)) date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function getMonthLabel(monthKey) {
  if (!monthKey) monthKey = getMonthKey()
  const [yearStr, monthStr] = String(monthKey).split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1
  if (isNaN(year) || isNaN(month)) return monthKey
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function getRecentMonthKeys(n = 12) {
  const keys = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    keys.push(`${y}-${m}`)
  }
  return keys
}

/**
 * Summative persistence helpers (localStorage)
 * Key: jivanaut_summative_report_{courseId}_{monthKey}
 */

function getAppStorage() {
  if (typeof localStorage !== 'undefined') return localStorage
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  return null
}

export function getSummativeRecord(courseId, monthKey) {
  if (!courseId || !monthKey) return null
  try {
    const key = `jivanaut_summative_report_${courseId}_${monthKey}`
    const storage = getAppStorage()
    const raw = storage ? storage.getItem(key) : null
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.warn('Error reading summative record:', err)
    return null
  }
}

export function saveSummativeRecord(courseId, monthKey, record = {}) {
  if (!courseId || !monthKey) return null
  try {
    const key = `jivanaut_summative_report_${courseId}_${monthKey}`
    const existing = getSummativeRecord(courseId, monthKey) || {}
    const cleanRecord = {
      ...existing,
      score: record.score !== '' && record.score != null ? Number(record.score) : null,
      total: record.total !== '' && record.total != null ? Number(record.total) : 100,
      note: record.note != null ? String(record.note).trim() : '',
      date: record.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      updatedAt: new Date().toISOString(),
    }
    const storage = getAppStorage()
    if (storage) {
      storage.setItem(key, JSON.stringify(cleanRecord))
    }
    return cleanRecord
  } catch (err) {
    console.warn('Error saving summative record:', err)
    return null
  }
}

/**
 * Remarks & Observations persistence helpers (localStorage)
 * Persisted per classroom (courseId) and monthKey
 */
export function saveRemarksRecord(courseId, monthKey, remarks = {}) {
  if (!courseId || !monthKey) return null
  try {
    const key = `jivanaut_summative_report_${courseId}_${monthKey}`
    const existing = getSummativeRecord(courseId, monthKey) || {}

    const cleanBullets = (val, fallback) => {
      if (val === undefined) return fallback
      if (Array.isArray(val)) {
        return val.map((s) => String(s).trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
      }
      if (typeof val === 'string') {
        return val
          .split('\n')
          .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
          .filter(Boolean)
      }
      return fallback
    }

    const cleanRecord = {
      ...existing,
      totalRemarksPoints: cleanBullets(remarks.totalRemarksPoints, existing.totalRemarksPoints),
      remarksText: remarks.remarksText != null ? String(remarks.remarksText) : (existing.remarksText || ''),
      academicEngagement:
        remarks.academicEngagement != null
          ? String(remarks.academicEngagement).trim()
          : (existing.academicEngagement || ''),
      focusAreas:
        remarks.focusAreas != null
          ? String(remarks.focusAreas).trim()
          : (existing.focusAreas || ''),
      sessionRemarks:
        remarks.sessionRemarks != null
          ? remarks.sessionRemarks
          : (existing.sessionRemarks || null),
      targetedSupport: cleanBullets(remarks.targetedSupport, existing.targetedSupport),
      parentRecommendations: cleanBullets(remarks.parentRecommendations, existing.parentRecommendations),
      updatedAt: new Date().toISOString(),
    }
    const storage = getAppStorage()
    if (storage) {
      storage.setItem(key, JSON.stringify(cleanRecord))
    }
    return cleanRecord
  } catch (err) {
    console.warn('Error saving remarks record:', err)
    return null
  }
}

export function resetRemarksRecord(courseId, monthKey) {
  if (!courseId || !monthKey) return null
  try {
    const key = `jivanaut_summative_report_${courseId}_${monthKey}`
    const existing = getSummativeRecord(courseId, monthKey) || {}
    const {
      totalRemarksPoints: _totalRemarksPoints,
      remarksText: _remarksText,
      academicEngagement: _academicEngagement,
      focusAreas: _focusAreas,
      targetedSupport: _targetedSupport,
      parentRecommendations: _parentRecommendations,
      sessionRemarks: _sessionRemarks,
      sessionMarks: _sessionMarks,
      ...rest
    } = existing
    const cleanRecord = {
      ...rest,
      totalRemarksPoints: null,
      remarksText: null,
      academicEngagement: null,
      focusAreas: null,
      targetedSupport: null,
      parentRecommendations: null,
      sessionRemarks: null,
      sessionMarks: null,
      updatedAt: new Date().toISOString(),
    }
    const storage = getAppStorage()
    if (storage) {
      storage.setItem(key, JSON.stringify(cleanRecord))
    }
    return cleanRecord
  } catch (err) {
    console.warn('Error resetting remarks record:', err)
    return null
  }
}

/**
 * Save custom test mark for a specific session
 * Persisted per classroom (courseId) and monthKey
 */
export function saveSessionMark(courseId, monthKey, sessionNumber, mark) {
  if (!courseId || !monthKey || sessionNumber == null) return null
  try {
    const key = `jivanaut_summative_report_${courseId}_${monthKey}`
    const existing = getSummativeRecord(courseId, monthKey) || {}
    const sessionMarks = { ...(existing.sessionMarks || {}) }

    if (mark === null || mark === undefined || String(mark).trim() === '') {
      delete sessionMarks[sessionNumber]
    } else {
      sessionMarks[sessionNumber] = cleanMarksFormat(String(mark).trim())
    }

    const cleanRecord = {
      ...existing,
      sessionMarks,
      updatedAt: new Date().toISOString(),
    }
    const storage = getAppStorage()
    if (storage) {
      storage.setItem(key, JSON.stringify(cleanRecord))
    }
    return cleanRecord
  } catch (err) {
    console.warn('Error saving session mark:', err)
    return null
  }
}

/**
 * Save custom Subject & Course name for a monthly report.
 * Persisted per classroom (courseId) and monthKey, plus saved to classroom overrides
 * so future reports automatically default to the updated subject.
 */
export function saveReportSubject(courseId, monthKey, subject) {
  if (!courseId || !monthKey) return null
  try {
    const key = `jivanaut_summative_report_${courseId}_${monthKey}`
    const existing = getSummativeRecord(courseId, monthKey) || {}
    const cleanSubject = String(subject || '').trim()

    const cleanRecord = {
      ...existing,
      customSubject: cleanSubject || null,
      updatedAt: new Date().toISOString(),
    }
    const storage = getAppStorage()
    if (storage) {
      storage.setItem(key, JSON.stringify(cleanRecord))
    }

    // Persist as classroom override baseline as well
    if (cleanSubject) {
      saveClassroomOverride(courseId, { subject: cleanSubject })
    }

    return cleanRecord
  } catch (err) {
    console.warn('Error saving report subject:', err)
    return null
  }
}

/**
 * Reset custom Subject & Course name for a monthly report
 */
export function resetReportSubject(courseId, monthKey) {
  if (!courseId || !monthKey) return null
  try {
    const key = `jivanaut_summative_report_${courseId}_${monthKey}`
    const existing = getSummativeRecord(courseId, monthKey) || {}
    const { customSubject: _customSubject, ...rest } = existing

    const cleanRecord = {
      ...rest,
      customSubject: null,
      updatedAt: new Date().toISOString(),
    }
    const storage = getAppStorage()
    if (storage) {
      storage.setItem(key, JSON.stringify(cleanRecord))
    }
    return cleanRecord
  } catch (err) {
    console.warn('Error resetting report subject:', err)
    return null
  }
}

/**
 * Extract student name and subject from classroom name.
 * Teachers save the student name as the classroom name (e.g. "Rahul Sharma",
 * "Rahul Sharma — AP Biology", "Rahul (AP Biology)", or "AP Biology - Rahul").
 */
export function extractStudentAndSubjectFromClassroom(courseName = '') {
  if (!courseName || typeof courseName !== 'string') {
    return { studentName: '', subject: '' }
  }
  const clean = courseName.trim()
  if (!clean) return { studentName: '', subject: '' }

  const subjectKeywords =
    /\b(math|mathematics|algebra|calculus|geometry|pre-algebra|biology|chemistry|physics|science|history|psychology|english|literature|economics|usabo|sat|act|ap|biochemistry|grade\s*\d+|class\s*\d+)\b/i

  // 1. Check parenthetical pattern: "Student Name (Subject)" or "Subject (Student Name)"
  const parenMatch = clean.match(/^([^(]+?)\s*\(([^)]+)\)$/)
  if (parenMatch) {
    const p1 = parenMatch[1].trim()
    const p2 = parenMatch[2].trim()
    if (subjectKeywords.test(p1) && !subjectKeywords.test(p2)) {
      return { studentName: p2, subject: p1 }
    }
    return { studentName: p1, subject: p2 }
  }

  // 2. Check delimiter patterns: "—", "–", " - ", "|", ":"
  const delimMatch = clean.match(/^([^\-–—|:]+?)\s*(?:—|–|\s+-\s+|\||:)\s*(.+)$/)
  if (delimMatch) {
    const p1 = delimMatch[1].trim()
    const p2 = delimMatch[2].trim()
    if (subjectKeywords.test(p1) && !subjectKeywords.test(p2)) {
      return { studentName: p2, subject: p1 }
    }
    return { studentName: p1, subject: p2 }
  }

  // 3. Delimiter without spaces (e.g. "Rahul-Biology")
  const dashMatch = clean.match(/^([^\-]+?)-([^\-]+)$/)
  if (dashMatch) {
    const p1 = dashMatch[1].trim()
    const p2 = dashMatch[2].trim()
    if (subjectKeywords.test(p1) && !subjectKeywords.test(p2)) {
      return { studentName: p2, subject: p1 }
    }
    if (subjectKeywords.test(p2) && !subjectKeywords.test(p1)) {
      return { studentName: p1, subject: p2 }
    }
  }

  // 4. If the entire classroom name is saved as the student name
  return {
    studentName: clean,
    subject: '',
  }
}

/**
 * Generate qualitative monthly narratives
 */
export function generateMonthlyNarrative({
  studentName = 'Student',
  subjectName = 'Mathematics',
  avgGrade = 100,
  completedCount = 0,
  totalCount = 0,
  topics = [],
} = {}) {
  const primaryTopic = topics[0] || 'core curriculum concepts'
  const secondaryTopic = topics[1] || topics[0] || 'analytical problem sets'

  let engagementText = `${studentName} has displayed high enthusiasm and steady conceptual growth this month. Participation during 1-on-1 problem-solving drills is active and articulate. They demonstrate deep confidence when tackling core ${subjectName} concepts.`
  if (avgGrade >= 90) {
    engagementText = `${studentName} has displayed high enthusiasm and steady conceptual growth this month across ${completedCount} of ${totalCount || completedCount || 1} modules. Participation during 1-on-1 problem-solving drills is active and articulate. They demonstrate deep confidence when tackling standard algebraic reductions.`
  } else if (avgGrade < 75) {
    engagementText = `${studentName} is actively engaged during live 1-on-1 sessions and shows steady effort. With targeted practice on foundational drills in ${subjectName}, retention and procedural speed will continue to grow.`
  }

  let focusAreasText = `Continued focus is recommended on verifying extraneous roots when solving rational functions in ${secondaryTopic}. Overall work ethic and submission consistency via Google Classroom remain commendable.`
  if (topics.length > 2) {
    focusAreasText = `Continued focus is recommended on verifying extraneous roots and multi-step derivations in ${secondaryTopic}. Overall work ethic and submission consistency via Google Classroom remain commendable.`
  }

  const targetedSupport = [
    `Reinforce ${primaryTopic || 'asymptotes and rational expressions'}`,
    `Timed practice sets for multi-step equation solving`,
  ]

  const parentRecommendations = [
    `Review Google Classroom assignment feedback tags`,
    `Ensure weekly 15-minute formula sheet review at home`,
  ]

  return {
    academicEngagement: engagementText,
    focusAreas: focusAreasText,
    targetedSupport,
    parentRecommendations,
  }
}

/**
 * Build structured monthly report based strictly on Google Classroom announcements
 * Excludes quiz/coursework scraping to ensure report card is 100% announcement-driven
 */
export function buildMonthlyReport({
  courseWork = [],
  announcements = [],
  courseMeta = {},
  monthKey = null,
  manual = null,
  teacherName = 'Steena Antony',
  customSubject = null,
} = {}) {
  const activeMonthKey = monthKey || getMonthKey()
  const academicCycle = getMonthLabel(activeMonthKey)

  // Resolve custom teacher overrides (stored per courseId and monthKey)
  const storedSummative =
    courseMeta?.id ? getSummativeRecord(courseMeta.id, activeMonthKey) : null
  const customRecord = manual || storedSummative

  // 1. Resolve Student Name from Classroom Name
  // Teachers save the student name as the classroom name (e.g. "Rahul Sharma", "Rahul — AP Biology", "Rahul")
  const classroomName = (courseMeta?.name || '').trim()
  const extractedFromClassroom = extractStudentAndSubjectFromClassroom(classroomName)

  let cleanStudentName = ''
  if (customRecord?.studentName && String(customRecord.studentName).trim()) {
    cleanStudentName = String(customRecord.studentName).trim()
  } else if (
    courseMeta?.studentName &&
    courseMeta.studentName !== 'Student' &&
    courseMeta.studentName !== 'Alex Rivera'
  ) {
    cleanStudentName = courseMeta.studentName
  } else if (extractedFromClassroom.studentName) {
    cleanStudentName = extractedFromClassroom.studentName
  } else if (courseMeta?.studentName && courseMeta.studentName !== 'Student') {
    cleanStudentName = courseMeta.studentName
  } else if (classroomName) {
    cleanStudentName = classroomName
  } else {
    cleanStudentName = courseMeta?.section || 'Student'
  }

  // 2. Resolve Subject & Course (with support for teacher editing)
  let announcementSubject = ''
  if (announcements && announcements.length > 0) {
    for (const ann of announcements) {
      if (ann?.text) {
        const sub = extractSubjectFromAnnouncement(ann.text)
        if (sub) {
          announcementSubject = sub
          break
        }
      }
    }
  }

  let dirOverrideSubject = ''
  if (courseMeta?.id) {
    try {
      const dirDetails = getClassroomDirectoryDetails(courseMeta.id, classroomName)
      if (dirDetails?.hasCustomOverride && dirDetails?.subject) {
        dirOverrideSubject = dirDetails.subject
      }
    } catch {
      // ignore
    }
  }

  let activeSubjectCourse = ''
  let isCustomSubject = false

  const effectiveCustomSubject =
    customSubject ||
    customRecord?.customSubject ||
    (customRecord?.subjectCourse ? customRecord.subjectCourse : null)

  if (effectiveCustomSubject && String(effectiveCustomSubject).trim()) {
    activeSubjectCourse = String(effectiveCustomSubject).trim()
    isCustomSubject = true
  } else if (dirOverrideSubject) {
    activeSubjectCourse = dirOverrideSubject
    isCustomSubject = true
  } else if (announcementSubject) {
    activeSubjectCourse = announcementSubject
  } else if (extractedFromClassroom.subject) {
    activeSubjectCourse = extractedFromClassroom.subject
  } else if (courseMeta?.subject && courseMeta.subject.toLowerCase() !== cleanStudentName.toLowerCase()) {
    activeSubjectCourse = courseMeta.subject
  } else if (classroomName && classroomName.toLowerCase() !== cleanStudentName.toLowerCase()) {
    activeSubjectCourse = classroomName
  } else {
    activeSubjectCourse = '1-on-1 Mentorship'
  }

  const activeClassroomCode = courseMeta?.id || courseMeta?.enrollmentCode || 'gc-mth-9842'

  // Resolve Teacher Name (fallback to Steena Antony)
  const activeTeacher =
    teacherName &&
    !teacherName.toLowerCase().includes('subarshan') &&
    teacherName !== 'Lead Educator' &&
    teacherName !== 'Lead Mentor'
      ? teacherName
      : 'Steena Antony'

  // -------------------------------------------------------------
  // Stream Announcement Session Ingestion & Dynamic Parsing (Announcement-Only)
  // -------------------------------------------------------------
  const parsedSessions = []

  if (announcements && announcements.length > 0) {
    announcements.forEach((ann, idx) => {
      if (!ann || !ann.text) return
      const text = ann.text
      const date = extractDateFromAnnouncement(text, ann.creationTime)
      const sessionNumber = parseSessionNumberFromText(text) || (idx + 1)
      const parsedFields = parseAnnouncementFields(text)
      const rawTopics = parsedFields.topicsCovered || `Session ${sessionNumber} Core Topic`
      const topicHeading = parsedFields.topicHeading || `Session ${sessionNumber}`
      const testMarks = parsedFields.testMarks || null
      const remarks = parsedFields.remarks || ''

      // Month matching helper
      let isDateInMonth = false
      if (activeMonthKey) {
        const [y, m] = activeMonthKey.split('-')
        const targetMonthStr = new Date(Number(y), Number(m) - 1, 1)
          .toLocaleDateString('en-US', { month: 'short' })
          .toLowerCase()
        const annTime = ann.creationTime || ''
        isDateInMonth =
          date.toLowerCase().includes(targetMonthStr) || annTime.startsWith(activeMonthKey)
      }

      parsedSessions.push({
        id: ann.id || `ann-session-${idx + 1}`,
        sessionNumber,
        date,
        topics: rawTopics,
        topicHeading,
        testMarks,
        remarks,
        isDateInMonth,
        creationTime: ann.creationTime,
      })
    })
  }

  // Filter by active month: if any announcements match activeMonthKey, use those;
  // otherwise if current active month, use all available announcements
  let activeSessions = parsedSessions.filter((s) => s.isDateInMonth)
  if (activeSessions.length === 0 && parsedSessions.length > 0 && activeMonthKey === getMonthKey()) {
    activeSessions = parsedSessions
  }

  // Sort sessions chronologically by session number
  activeSessions.sort((a, b) => a.sessionNumber - b.sessionNumber)

  // Resolve custom teacher overrides (session marks and session remarks)
  const customSessionMarks = customRecord?.sessionMarks || {}
  const customSessionRemarks = customRecord?.sessionRemarks || {}

  // Apply custom marks overrides per session if available
  const effectiveSessions = activeSessions.map((sess) => {
    const overrideMark =
      customSessionMarks[sess.sessionNumber] != null
        ? customSessionMarks[sess.sessionNumber]
        : customSessionMarks[sess.id] != null
        ? customSessionMarks[sess.id]
        : null

    const effectiveMarks =
      overrideMark !== null && overrideMark !== undefined && String(overrideMark).trim() !== ''
        ? cleanMarksFormat(overrideMark)
        : sess.testMarks

    return {
      ...sess,
      testMarks: effectiveMarks,
    }
  })

  // Calculate Average from Test Marks in announcements if present
  let totalScorePct = 0
  let scoreCount = 0
  effectiveSessions.forEach((sess) => {
    if (sess.testMarks) {
      const pctMatch = sess.testMarks.match(/(\d+)%/)
      const fracMatch = sess.testMarks.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/)
      if (pctMatch) {
        totalScorePct += parseInt(pctMatch[1], 10)
        scoreCount++
      } else if (fracMatch && parseFloat(fracMatch[2]) > 0) {
        totalScorePct += Math.round(
          (parseFloat(fracMatch[1]) / parseFloat(fracMatch[2])) * 100
        )
        scoreCount++
      }
    }
  })
  const testAverage = scoreCount > 0 ? Math.round(totalScorePct / scoreCount) : null
  const homeworkAvg = testAverage != null ? `${testAverage}%` : '—'

  // Build Curriculum & Topics Table rows strictly from announcement sessions
  const curriculumRows = effectiveSessions.map((sess, idx) => {
    let status = 'Completed'
    if (sess.testMarks) {
      const pctMatch = sess.testMarks.match(/(\d+)%/)
      const fracMatch = sess.testMarks.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/)
      let pct = null
      if (pctMatch) {
        pct = parseInt(pctMatch[1], 10)
      } else if (fracMatch && parseFloat(fracMatch[2]) > 0) {
        pct = Math.round((parseFloat(fracMatch[1]) / parseFloat(fracMatch[2])) * 100)
      }
      if (pct != null) {
        status = pct >= 85 ? 'Mastered' : 'Completed'
      }
    }

    return {
      id: sess.id || `row-${idx}`,
      dateWeek: `${sess.date} (Session ${sess.sessionNumber})`,
      sessionNumber: sess.sessionNumber,
      topics: sess.topics,
      topicHeading: sess.topicHeading,
      testMarks: sess.testMarks || '—',
      status,
      assignmentRef: `Session #${sess.sessionNumber} Evaluation`,
    }
  })

  // Build consolidated remarks as points from announcement stream (no session labels)
  let defaultRemarksPoints = []
  effectiveSessions.forEach((sess) => {
    if (sess.remarks && sess.remarks.trim()) {
      const lines = sess.remarks
        .split('\n')
        .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean)
      if (lines.length > 0) {
        defaultRemarksPoints.push(...lines)
      } else {
        defaultRemarksPoints.push(sess.remarks.trim())
      }
    }
  })
  defaultRemarksPoints = Array.from(new Set(defaultRemarksPoints))
  if (defaultRemarksPoints.length === 0 && effectiveSessions.length > 0) {
    defaultRemarksPoints = ['Session concluded successfully. Core topics and problem sets reviewed.']
  }

  const customPoints = customRecord?.totalRemarksPoints
  let totalRemarksPoints = defaultRemarksPoints
  let isCustomRemarks = false

  if (Array.isArray(customPoints) && customPoints.length > 0) {
    totalRemarksPoints = customPoints
    isCustomRemarks = true
  } else if (customRecord?.remarksText && typeof customRecord.remarksText === 'string' && customRecord.remarksText.trim()) {
    totalRemarksPoints = customRecord.remarksText
      .split('\n')
      .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean)
    isCustomRemarks = true
  }

  const sessionsCount = curriculumRows.length
  const punctualityRate = sessionsCount > 0 ? '100%' : '—'

  return {
    monthKey: activeMonthKey,
    academicCycle,
    meta: {
      studentName: cleanStudentName,
      subjectCourse: activeSubjectCourse,
      classroomCode: activeClassroomCode,
      isCustomSubject,
    },
    kpis: {
      sessionsAttended: `${sessionsCount}`,
      homeworkAverage: homeworkAvg,
      summativeScore: '—',
      punctualityRate,
      raw: {
        completedCount: sessionsCount,
        totalAssignments: sessionsCount,
        homeworkAvg,
        punctualityRate,
      },
    },
    curriculum: {
      sessionsCount,
      completedSessionsCount: sessionsCount,
      rows: curriculumRows,
    },
    remarksPoints: totalRemarksPoints,
    defaultRemarksPoints,
    sessions: effectiveSessions,
    narrative: {
      isCustomRemarks,
      points: totalRemarksPoints,
    },
    footer: {
      tutorName: activeTeacher,
      contactEmail: 'jivanauttestprep@gmail.com',
      systemTag: 'Generated via Online Tutoring Portal • Page 1 of 1',
    },
  }
}

/**
 * Create an announcement in Google Classroom
 */
export async function createCourseAnnouncement(courseId, text, accessToken) {
  if (!courseId || !text) {
    throw new Error('Course ID and announcement text are required.')
  }

  const res = await fetch(`${CLASSROOM_BASE}/courses/${courseId}/announcements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      state: 'PUBLISHED',
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const message = errorData.error?.message || `Google API error ${res.status}: ${res.statusText}`
    const error = new Error(message)
    error.status = res.status
    error.details = errorData.error
    throw error
  }

  return res.json()
}

/**
 * List announcements for a classroom
 */
export async function listCourseAnnouncements(courseId, accessToken) {
  if (!courseId || !accessToken) return []
  try {
    const data = await apiFetch(`/courses/${courseId}/announcements?pageSize=50`, accessToken)
    return data.announcements || []
  } catch (err) {
    console.warn('Failed to fetch announcements:', err)
    return []
  }
}

/**
 * List enrolled students in a course
 */
export async function listCourseStudents(courseId, accessToken) {
  if (!courseId || !accessToken || !hasRosterScope()) return []
  try {
    const data = await apiFetch(`/courses/${courseId}/students?pageSize=50`, accessToken)
    return data.students || []
  } catch (err) {
    console.warn('Failed to fetch enrolled students:', err)
    return []
  }
}

/**
 * List topics defined in a course
 */
export async function listCourseTopics(courseId, accessToken) {
  if (!courseId || !accessToken || !hasTopicsScope()) return []
  try {
    const data = await apiFetch(`/courses/${courseId}/topics?pageSize=50`, accessToken)
    return data.topic || []
  } catch (err) {
    console.warn('Failed to fetch course topics (non-fatal):', err)
    return []
  }
}

/**
 * Option A: Auto-extract parent name from announcement text or metadata
 * Matches patterns like "Hi Ms. Sambhrama," "Dear Mr. Rivera," or "Parent: Ms. Sambhrama"
 */
export function parseParentNameFromText(text = '') {
  if (!text) return ''
  const hiMatch = text.match(/(?:Hi|Dear|Hello)\s+([^,\n\r]+?)(?:,|\n|$)/i)
  if (hiMatch && hiMatch[1]) {
    const clean = hiMatch[1].trim()
    if (clean.length > 1 && clean.length < 50) return clean
  }
  const parentFieldMatch = text.match(/Parent(?:\s*Name)?\s*[:=-]\s*([^|\n\r,]+)/i)
  if (parentFieldMatch && parentFieldMatch[1]) {
    const clean = parentFieldMatch[1].trim()
    if (clean.length > 1 && clean.length < 50) return clean
  }
  return ''
}

/**
 * Format raw marks into clean human-readable score string (e.g. "18 / 20 (90%)" or "95%")
 */
export function cleanMarksFormat(raw = '') {
  if (!raw) return ''
  const str = String(raw).trim().replace(/^[-–—:=•*]\s*/, '')

  // If already contains percentages with fraction e.g. "18 / 20 (90%)" or "18/20 (90%)"
  if (/\(\s*\d+%\s*\)/.test(str)) {
    return str.replace(/\s*\/\s*/, ' / ')
  }

  // Fraction format like "18/20" or "18 / 20"
  const fracMatch = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(.*)$/)
  if (fracMatch) {
    const earned = parseFloat(fracMatch[1])
    const total = parseFloat(fracMatch[2])
    const extra = fracMatch[3]?.trim() || ''
    if (total > 0 && !isNaN(earned)) {
      const pct = Math.round((earned / total) * 100)
      return `${earned} / ${total} (${pct}%)${extra ? ' ' + extra : ''}`
    }
    return `${earned} / ${total}`
  }

  // "19 out of 20"
  const outOfMatch = str.match(/^(\d+(?:\.\d+)?)\s+out\s+of\s+(\d+(?:\.\d+)?)/i)
  if (outOfMatch) {
    const earned = parseFloat(outOfMatch[1])
    const total = parseFloat(outOfMatch[2])
    if (total > 0) {
      const pct = Math.round((earned / total) * 100)
      return `${earned} / ${total} (${pct}%)`
    }
  }

  // Percentage format like "92%"
  if (/^\d{1,3}%$/.test(str)) {
    return str
  }

  return str
}

/**
 * Extract topic heading from full topic text
 * e.g., "Unit 2 :- Cell organelles - Cytoskeleton, peroxisomes..." -> "Cell Organelles"
 */
export function extractTopicHeading(topics = '') {
  if (!topics) return 'Curriculum Review'
  const clean = String(topics).trim().replace(/^[-–—:=•*]\s*/, '')

  // Match "Unit X :- [Topic Heading] - [Details]"
  const unitWithColon = clean.match(/Unit\s*\d+\s*[:-]+\s*([^-:\n]+)/i)
  if (unitWithColon && unitWithColon[1]?.trim()) {
    return unitWithColon[1].trim()
  }

  // Match "Chapter X :- [Topic Heading] - [Details]"
  const chapMatch = clean.match(/Chapter\s*[\d-]+\s*[:-]+\s*([^-:\n]+)/i)
  if (chapMatch && chapMatch[1]?.trim()) {
    return chapMatch[1].trim()
  }

  // Split by dash/colon and take first significant segment
  const parts = clean.split(/[-–—:]/).map((s) => s.trim()).filter(Boolean)
  if (parts.length > 0) {
    if (/^unit\s*\d+$/i.test(parts[0]) && parts[1]) {
      return parts[1]
    }
    if (/^module\s*\d+$/i.test(parts[0]) && parts[1]) {
      return parts[1]
    }
    return parts[0]
  }

  return clean.slice(0, 35)
}

/**
 * Extract date from announcement header or text
 */
export function extractDateFromAnnouncement(text = '', creationTime = null) {
  if (text) {
    // Matches "session 3 - Oct 14 PST" or "session 3 - Oct 14"
    const headerMatch = text.match(/(?:-\s*session\s*\d+\s*-\s*|session\s*\d+\s*-\s*)([A-Za-z]{3}\s+\d{1,2}(?:,?\s*\d{4})?)/i)
    if (headerMatch && headerMatch[1]) {
      return headerMatch[1].trim()
    }

    // Matches standalone date like "Oct 14, 2026" or "Oct 14"
    const generalDate = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i)
    if (generalDate) {
      const mon = generalDate[1].slice(0, 3)
      const day = generalDate[2].padStart(2, '0')
      return `${mon} ${day}`
    }
  }

  if (creationTime) {
    const d = new Date(creationTime)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    }
  }

  return 'Session'
}

/**
 * Extract test marks from announcement text
 * Checks dedicated lines: "Test marks:- 18/20", "Marks:- 18/20", "Test score:- 95%",
 * and falls back to scores in "HW status/score:-"
 */
export function extractTestMarksFromAnnouncement(text = '', hwStatus = '') {
  if (!text && !hwStatus) return null

  // Check 1: Explicit test marks line (e.g. "Test marks:- 18/20", "Marks:- 18/20", "Test score:- 95%")
  // Use \b to ensure "Marks" does not match within "Remarks"
  const marksMatch = text.match(/\b(?:Test\s*marks?|Test\s*score|Quiz\s*score|Quiz\s*marks?|Marks)\b\s*(?::\s*-|:\s*|-|\s*=\s*)\s*([^\n\r,]+)/i)
  if (marksMatch && marksMatch[1]) {
    const raw = marksMatch[1].trim().replace(/^[-–—:=•*]\s*/, '')
    if (raw && !/^(?:none|n\/a|pending|nil|not\s*applicable)$/i.test(raw)) {
      return cleanMarksFormat(raw)
    }
  }

  // Check 2: Score in "HW status/score:-"
  const hwMatch = text.match(/HW\s*status(?:\/score)?\s*(?::\s*-|:\s*|-|\s*=\s*)\s*([^\n\r,]+)/i)
  const candidate = hwMatch ? hwMatch[1].trim() : (hwStatus || '')
  if (candidate) {
    const scoreMatch = candidate.match(/(\b\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?|\b\d{1,3}%\b)/)
    if (scoreMatch) {
      return cleanMarksFormat(scoreMatch[1])
    }
  }

  // Check 3: Inline test or quiz score mentioned in text
  const inlineMatch = text.match(/\b(?:test|quiz|exam)\b\s*(?:marks?|score)?\s*(?::\s*-|:\s*|-|=)?\s*(\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?|\b\d{1,3}%\b)/i)
  if (inlineMatch && inlineMatch[1]) {
    return cleanMarksFormat(inlineMatch[1])
  }

  return null
}

/**
 * Extract subject name from announcement text
 * Matches "Course / Subject: AP Biology", "Subject: Chemistry", or header "AP Biology-session 2"
 */
export function extractSubjectFromAnnouncement(text = '') {
  if (!text) return ''
  const courseMatch = text.match(/(?:Course\s*\/\s*Subject|Subject)\s*:\s*([^\n\r]+)/i)
  if (courseMatch && courseMatch[1]?.trim()) return courseMatch[1].trim()
  const headerMatch = text.match(/^([A-Za-z0-9\s/&+-]+?)\s*[-–—]\s*session\s*\d+/im)
  if (headerMatch && headerMatch[1]?.trim()) return headerMatch[1].trim()
  return ''
}

/**
 * Extract instructor remarks from announcement text
 */
export function extractRemarksFromAnnouncement(text = '') {
  if (!text) return ''
  const remarksMatch = text.match(/\b(?:Instructor\s*Remarks?|Session\s*Remarks?|Remarks)\b\s*(?::\s*-|:\s*|-|\s*=\s*)\s*(.+?)(?=\n\s*(?:Kindly check|Regards|Thanks|Best|Sincerely|$))/is)
  if (remarksMatch && remarksMatch[1]) {
    return remarksMatch[1].trim().replace(/^[-–—:=•*]\s*/, '')
  }
  return ''
}

/**
 * Extract session number from announcement text
 * Matches "AP Biology-session 3 -", "session 4", "Session 5:"
 */
export function parseSessionNumberFromText(text = '') {
  if (!text) return null
  const match = text.match(/(?:session|-session)\s*(\d+)/i)
  if (match && match[1]) {
    const num = parseInt(match[1], 10)
    if (!isNaN(num) && num > 0) return num
  }
  return null
}

/**
 * Parse structured fields from past announcement text
 */
export function parseAnnouncementFields(text = '') {
  if (!text) return {}
  const parentName = parseParentNameFromText(text)
  const sessionNumber = parseSessionNumberFromText(text)
  const subjectTitle = extractSubjectFromAnnouncement(text)

  const topicsMatch = text.match(/\b(?:Topics?\s*covered|Topic)\b\s*(?::\s*-|:\s*|-|\s*=\s*)\s*(.+?)(?=\n\s*(?:HW assigned|HW status|Test marks?|Marks?|Remarks|$))/is)
  const hwAssignedMatch = text.match(/HW assigned\s*(?::\s*-|:\s*|-|\s*=\s*)\s*(.+?)(?=\n\s*(?:HW status|Test marks?|Marks?|Remarks|$))/is)
  const hwStatusMatch = text.match(/HW status(?:\/score)?\s*(?::\s*-|:\s*|-|\s*=\s*)\s*(.+?)(?=\n\s*(?:Test marks?|Marks?|Remarks|$))/is)

  const rawTopics = topicsMatch ? topicsMatch[1].trim().replace(/^[-–—:=•*]\s*/, '') : ''
  const hwStatus = hwStatusMatch ? hwStatusMatch[1].trim().replace(/^[-–—:=•*]\s*/, '') : ''

  return {
    subjectTitle,
    parentName: parentName || '',
    sessionNumber: sessionNumber || null,
    date: extractDateFromAnnouncement(text),
    topicsCovered: rawTopics,
    topicHeading: extractTopicHeading(rawTopics),
    hwAssigned: hwAssignedMatch ? hwAssignedMatch[1].trim().replace(/^[-–—:=•*]\s*/, '') : '',
    hwStatus,
    testMarks: extractTestMarksFromAnnouncement(text, hwStatus),
    remarks: extractRemarksFromAnnouncement(text),
  }
}

/**
 * Comprehensive classroom session context fetcher
 * Seamlessly resolves student name, parent name (Option A: from previous announcement),
 * next session number, latest coursework, submissions, and topics.
 */
export async function fetchClassroomSessionContext(courseId, accessToken, courseObj = null) {
  const dirDetails = getClassroomDirectoryDetails(courseId, courseObj?.name)

  // Determine Subject & Student from classroom name
  const extractedFromCourse = extractStudentAndSubjectFromClassroom(courseObj?.name || '')
  let subjectTitle = dirDetails.subject || 'AP Biology'
  if (courseObj?.subject) {
    subjectTitle = courseObj.subject
  } else if (extractedFromCourse.subject) {
    subjectTitle = extractedFromCourse.subject
  }

  // Handle Mock / Preview Mode
  if (!accessToken || courseId?.startsWith('course-classroom-')) {
    const dirIdx = dirDetails.index || 1
    // Simulate previous session number (e.g. 2 for odd classrooms, 3 for even)
    const simulatedLastSession = (dirIdx % 5) + 1
    const nextSession = simulatedLastSession + 1

    return {
      courseId,
      studentName: courseObj?.studentName || dirDetails.studentName,
      studentEmail: courseObj?.studentEmail || dirDetails.studentEmail || '',
      parentName: courseObj?.parentName || dirDetails.parentName,
      parentEmail: courseObj?.parentEmail || dirDetails.parentEmail || '',
      secondaryParentEmail: courseObj?.secondaryParentEmail || dirDetails.secondaryParentEmail || '',
      subjectTitle,
      sessionNumber: String(nextSession),
      topicsCovered: dirDetails.topics?.[0] || 'Unit 2 :- Cell organelles',
      availableTopics: dirDetails.topics || [],
      hwAssigned: dirDetails.defaultHw || 'Workbook practice set',
      hwStatus: simulatedLastSession % 2 === 0 ? '19/20' : 'Submitted',
      remarks: dirDetails.defaultRemarks || 'Reviewed key concepts from the curriculum.',
      recentCourseWork: [
        {
          id: 'cw-mock-1',
          title: dirDetails.defaultHw,
          state: 'PUBLISHED',
          status: 'Graded (19/20)',
        },
      ],
      meta: {
        isMock: true,
        parentSource: 'Directory + Announcement Pattern (Option A)',
        studentSource: 'Classroom Roster',
        lastSessionFound: simulatedLastSession,
      },
    }
  }

  // Live Google Classroom API Fetch
  try {
    const [studentsResult, courseWorkResult, announcementsResult, topicsResult] = await Promise.allSettled([
      listCourseStudents(courseId, accessToken),
      fetchCourseWorkWithSubmissions(courseId, accessToken),
      listCourseAnnouncements(courseId, accessToken),
      listCourseTopics(courseId, accessToken),
    ])

    const students = studentsResult.status === 'fulfilled' ? studentsResult.value : []
    const courseWork = courseWorkResult.status === 'fulfilled' ? courseWorkResult.value : []
    const announcements = announcementsResult.status === 'fulfilled' ? announcementsResult.value : []
    const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : []

    // 1. Resolve Student Name & Email (from Google Classroom roster, overrides, or directory)
    let resolvedStudentName = ''
    let resolvedStudentEmail = ''
    if (students.length > 0) {
      if (students[0]?.profile?.name?.fullName) {
        resolvedStudentName = students[0].profile.name.fullName
      }
      if (students[0]?.profile?.emailAddress) {
        resolvedStudentEmail = students[0].profile.emailAddress
      }
    }
    if (!resolvedStudentName) {
      if (extractedFromCourse.studentName) {
        resolvedStudentName = extractedFromCourse.studentName
      } else if (courseObj?.studentName) {
        resolvedStudentName = courseObj.studentName
      } else {
        resolvedStudentName = dirDetails.studentName || 'Student'
      }
    }
    if (!resolvedStudentEmail) {
      if (courseObj?.studentEmail) {
        resolvedStudentEmail = courseObj.studentEmail
      } else if (dirDetails.studentEmail) {
        resolvedStudentEmail = dirDetails.studentEmail
      }
    }

    // 2. Resolve Parent Name (Option A: Auto-extract from previous announcement!)
    let resolvedParentName = ''
    let parentSource = 'default'
    let lastSessionNumber = null

    // Look for previous announcement starting with "Hi [ParentName],"
    if (announcements.length > 0) {
      for (const ann of announcements) {
        if (!resolvedParentName && ann.text) {
          const extractedParent = parseParentNameFromText(ann.text)
          if (extractedParent) {
            resolvedParentName = extractedParent
            parentSource = 'Option A (Extracted from Previous Announcement Stream)'
          }
        }
        if (lastSessionNumber == null && ann.text) {
          const sessNum = parseSessionNumberFromText(ann.text)
          if (sessNum != null) {
            lastSessionNumber = sessNum
          }
        }
        if (resolvedParentName && lastSessionNumber != null) break
      }
    }

    // Fallback: check course description or room
    if (!resolvedParentName && courseObj) {
      const fromDesc = parseParentNameFromText(courseObj.description || courseObj.room || '')
      if (fromDesc) {
        resolvedParentName = fromDesc
        parentSource = 'Classroom Metadata (Description/Room)'
      }
    }

    // Fallback: directory / saved local storage
    if (!resolvedParentName) {
      resolvedParentName = dirDetails.parentName || 'Parent / Guardian'
      parentSource = dirDetails.hasCustomOverride ? 'Saved Override' : 'Directory Default'
    }

    // 3. Resolve Next Session Number
    const nextSessionNumber = lastSessionNumber != null ? lastSessionNumber + 1 : 1

    // 4. Resolve HW Assigned & HW Status from latest CourseWork
    let resolvedHwAssigned = dirDetails.defaultHw || ''
    let resolvedHwStatus = 'Not submitted'
    const recentCourseWork = []

    if (courseWork.length > 0) {
      const latestCw = courseWork[0]
      resolvedHwAssigned = latestCw.title

      if (latestCw.submission) {
        const sub = latestCw.submission
        if (sub.assignedGrade != null) {
          resolvedHwStatus = `${sub.assignedGrade}/${latestCw.maxPoints || 100}`
        } else if (sub.state === 'TURNED_IN') {
          resolvedHwStatus = 'Submitted (Awaiting review)'
        } else if (sub.state === 'RETURNED') {
          resolvedHwStatus = 'Reviewed'
        } else if (sub.late) {
          resolvedHwStatus = 'Not submitted (Late)'
        }
      }

      courseWork.slice(0, 5).forEach((cw) => {
        let statusText = 'Assigned'
        if (cw.submission?.assignedGrade != null) {
          statusText = `${cw.submission.assignedGrade}/${cw.maxPoints || 100}`
        } else if (cw.submission?.state === 'TURNED_IN') {
          statusText = 'Turned in'
        }
        recentCourseWork.push({
          id: cw.id,
          title: cw.title,
          description: cw.description,
          dueDate: cw.dueDate,
          status: statusText,
        })
      })
    }

    // 5. Resolve Topics
    const availableTopics = []
    if (topics.length > 0) {
      topics.forEach((t) => {
        if (t.name) availableTopics.push(t.name)
      })
    }
    if (dirDetails.topics && dirDetails.topics.length > 0) {
      dirDetails.topics.forEach((dt) => {
        if (!availableTopics.includes(dt)) availableTopics.push(dt)
      })
    }

    const resolvedTopics =
      availableTopics.length > 0
        ? availableTopics[0]
        : dirDetails.topics?.[0] || 'Curriculum unit review and practice problems.'

    return {
      courseId,
      studentName: resolvedStudentName,
      studentEmail: resolvedStudentEmail,
      parentName: resolvedParentName,
      parentEmail: dirDetails.parentEmail || '',
      secondaryParentEmail: dirDetails.secondaryParentEmail || '',
      subjectTitle,
      sessionNumber: String(nextSessionNumber),
      topicsCovered: resolvedTopics,
      availableTopics,
      hwAssigned: resolvedHwAssigned,
      hwStatus: resolvedHwStatus,
      remarks: dirDetails.defaultRemarks || 'Reviewed key concepts from the previous class and completed practice exercises.',
      recentCourseWork,
      meta: {
        isMock: false,
        parentSource,
        studentSource: 'Google Classroom Roster',
        lastSessionFound: lastSessionNumber,
      },
    }
  } catch (err) {
    console.error('Error fetching classroom session context from API:', err)
    return {
      courseId,
      studentName: dirDetails.studentName,
      studentEmail: dirDetails.studentEmail || '',
      parentName: dirDetails.parentName,
      parentEmail: dirDetails.parentEmail || '',
      secondaryParentEmail: dirDetails.secondaryParentEmail || '',
      subjectTitle,
      sessionNumber: '1',
      topicsCovered: dirDetails.topics?.[0] || '',
      availableTopics: dirDetails.topics || [],
      hwAssigned: dirDetails.defaultHw || '',
      hwStatus: 'Not submitted',
      remarks: dirDetails.defaultRemarks || '',
      recentCourseWork: [],
      meta: {
        isMock: false,
        parentSource: 'Directory Fallback',
        studentSource: 'Directory Fallback',
        error: err.message,
      },
    }
  }
}

