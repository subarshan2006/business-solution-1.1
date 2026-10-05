/**
 * Google Classroom API Service
 * Handles API calls to Google Classroom v1 endpoints
 * Includes realistic mock data for verification and demo testing.
 */

const CLASSROOM_BASE = 'https://classroom.googleapis.com/v1'

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
  'subarshan195@gmail.com',
]

/**
 * Sprint 2: Detect whether authenticated user is acting as Teacher or Student
 */
export async function determineRole(accessToken, userEmail = '') {
  const normalizedEmail = (userEmail || '').toLowerCase().trim()
  if (normalizedEmail && KNOWN_TEACHERS.includes(normalizedEmail)) {
    return { role: 'teacher', teacherCount: 0 }
  }

  try {
    // Fetch all courses user is associated with (broad query without restrictive filters)
    const allCourses = await apiFetch('/courses?pageSize=50', accessToken)
    const courses = allCourses.courses || []

    if (courses.length > 0) {
      const hasTeacherFolder = courses.some((c) => c.teacherFolder != null || c.ownerId === 'me')
      if (hasTeacherFolder) {
        return { role: 'teacher', teacherCount: courses.length, courses }
      }
      return { role: 'student', studentCount: courses.length, courses }
    }

    return { role: 'teacher', studentCount: 0, courses: [] }
  } catch (err) {
    console.error('Error determining role from Google Classroom:', err)
    if (normalizedEmail && KNOWN_TEACHERS.includes(normalizedEmail)) {
      return { role: 'teacher', teacherCount: 0 }
    }
    throw err
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
  const data = await apiFetch(`/courses/${courseId}/courseWork?pageSize=20`, accessToken)
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

// ==========================================
// MOCK DATA FOR DEMO & TESTING (Sprints 1-8)
// ==========================================

export const MOCK_TEACHER = {
  id: 'teacher-demo-01',
  name: 'Dr. Jivanaut (Teacher)',
  email: 'educator@nxtsteptutoring.com',
  picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  role: 'teacher',
}

export const MOCK_STUDENT = {
  id: 'student-demo-01',
  name: 'Alex Rivera (Student)',
  email: 'alex.rivera@nxtsteptutoring.com',
  picture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  role: 'student',
}

// Generate the 20 private 1-on-1 classrooms as defined in architecture
export const MOCK_20_CLASSROOMS = Array.from({ length: 20 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0')
  const subjects = ['AP Biology', 'AP Environmental Science', 'AP Psychology', 'USABO Prep', 'Biochemistry']
  const grades = ['Grade 10', 'Grade 11', 'Grade 12']
  const subject = subjects[i % subjects.length]
  const grade = grades[i % grades.length]
  const studentName = `Student ${num}`

  return {
    id: `course-classroom-${num}`,
    name: `${studentName} — ${subject}`,
    section: `${grade} • 1-on-1 Tutoring`,
    descriptionHeading: `Private Tutoring Classroom for ${studentName}`,
    alternateLink: `https://classroom.google.com/c/demo-${num}`,
    studentName,
    grade,
    subject,
    enrollmentCode: `nxt${num}9x`,
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
 * Calculates comprehensive analytics for Student and Parent Dashboards
 */
export function calculateStudentAnalytics(courseWork = MOCK_ASSIGNMENTS) {
  let earnedPoints = 0
  let totalPossiblePoints = 0
  let completedCount = 0
  let pendingCount = 0

  const pending = []
  const completed = []

  courseWork.forEach((cw) => {
    const isReturned = cw.submission?.state === 'RETURNED'
    const isTurnedIn = cw.submission?.state === 'TURNED_IN'

    // Urgency calculation for pending homework
    let urgency = 'normal'
    let countdownText = 'Due soon'

    if (cw.dueDate) {
      const now = new Date()
      const due = new Date(cw.dueDate.year, cw.dueDate.month - 1, cw.dueDate.day)
      const diffMs = due.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        urgency = 'overdue'
        countdownText = 'Overdue'
      } else if (diffDays <= 2) {
        urgency = 'urgent'
        countdownText = `Due in ${diffDays === 0 ? 'today' : diffDays + ' day' + (diffDays > 1 ? 's' : '')}`
      } else {
        countdownText = `Due in ${diffDays} days`
      }
    }

    const enhancedItem = { ...cw, urgency, countdownText }

    if (isReturned || isTurnedIn) {
      completedCount++
      completed.push(enhancedItem)
      if (cw.submission?.assignedGrade != null) {
        earnedPoints += cw.submission.assignedGrade
        totalPossiblePoints += cw.maxPoints || 20
      }
    } else {
      pendingCount++
      pending.push(enhancedItem)
    }
  })

  // If no grades yet, provide default representation
  const rawPercentage = totalPossiblePoints > 0 ? (earnedPoints / totalPossiblePoints) * 100 : 92.5
  const averagePercentage = rawPercentage.toFixed(1)
  const completionRate = courseWork.length > 0 ? Math.round((completedCount / courseWork.length) * 100) : 100

  let letterGrade = 'A'
  if (rawPercentage < 80) letterGrade = 'C'
  else if (rawPercentage < 90) letterGrade = 'B'
  else if (rawPercentage >= 95) letterGrade = 'A+'

  return {
    totalAssignments: courseWork.length,
    completedCount,
    pendingCount,
    completionRate,
    earnedPoints,
    totalPossiblePoints,
    averagePercentage,
    letterGrade,
    pendingHomework: pending,
    completedHomework: completed,
    upcomingSchedule: MOCK_UPCOMING_SCHEDULE,
    topicMastery: MOCK_TOPIC_MASTERY,
    sessionsLogged: 16,
    attendanceRate: 100,
    tutorNote: {
      educator: 'Dr. Jivanaut, M.Sc., B.Ed.',
      date: 'Current Academic Term',
      text: 'Demonstrating exceptional analytical reasoning and conceptual grasp across AP Biology units. Cellular respiration diagrams and FRQ justifications are at College Board top percentile standards. In our upcoming sessions, we will fortify the Calvin Cycle photolysis mechanics to maintain straight A+ standing.',
    },
  }
}

