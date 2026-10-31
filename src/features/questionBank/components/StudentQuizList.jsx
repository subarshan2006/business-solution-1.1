import { useState, useEffect } from 'react'
import { studentApi, getStoredSessionUser } from '../../../services/nxtstepApi'
import { getQuestionBanks } from '../services/questionBankStorage'
import { listBankAttempts } from '../services/quizAttemptService'

function formatRemainingCountdown(endTime, currentMs) {
  if (!endTime) return null
  const endMs = new Date(endTime).getTime()
  if (isNaN(endMs)) return null
  const diffMs = endMs - currentMs
  if (diffMs <= 0) return null

  const totalSecs = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSecs / 3600)
  const minutes = Math.floor((totalSecs % 3600) / 60)
  const seconds = totalSecs % 60

  if (hours >= 2) {
    return `${hours}h remaining`
  }
  if (hours === 1) {
    return minutes > 0 ? `1h ${minutes}m remaining` : `1h remaining`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`
  }
  return `${seconds}s remaining`
}

function StudentQuizList({ auth, onLaunchQuiz, onSignIn, studentEmail: propStudentEmail, onStartQuiz }) {
  const [assignedTests, setAssignedTests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Dynamic real-time timer ticker
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timerId)
  }, [])

  const sessionUser = getStoredSessionUser()
  const studentEmail = (
    propStudentEmail ||
    (auth?.user?.email && auth.user.email !== 'Google Classroom Account' ? auth.user.email : '') ||
    (sessionUser?.email && sessionUser.email !== 'Google Classroom Account' ? sessionUser.email : '') ||
    auth?.user?.email ||
    ''
  ).trim().toLowerCase()

  const handleLaunch = onStartQuiz || onLaunchQuiz

  const loadBackendTests = async () => {
    if (!studentEmail) {
      setAssignedTests([])
      return
    }

    setLoading(true)
    setError('')
    try {
      let combined = []

      // 1. Fetch assigned tests from backend
      try {
        const tests = await studentApi.getAssignedTests()
        if (Array.isArray(tests)) {
          combined = [...tests]
        }
      } catch (err) {
        console.warn('Backend getAssignedTests note:', err)
      }

      // 2. Merge local authorized question banks (if published and student is authorized)
      try {
        const localBanks = getQuestionBanks()
        if (Array.isArray(localBanks)) {
          localBanks.forEach((b) => {
            if (!b.published) return
            const authorized = Array.isArray(b.authorizedStudents)
              ? b.authorizedStudents.map((s) => String(s).toLowerCase().trim())
              : []
            if (!authorized.includes(studentEmail)) return

            // Check if already in combined list
            const exists = combined.some(
              (t) => t.testId === b.id || t.assignmentId === b.id || t.title === b.title
            )
            if (!exists) {
              const quizEndingHours = Number(b.settings?.quizEndingHours || 3)
              const createdMs = b.createdAt ? new Date(b.createdAt).getTime() : Date.now()
              const endIso = new Date(createdMs + quizEndingHours * 60 * 60 * 1000).toISOString()

              // Check if completed locally
              const localAttempts = listBankAttempts(b.id)
              const myAttempt = localAttempts.find(
                (a) => a.studentEmail?.toLowerCase() === studentEmail
              )

              combined.push({
                testId: b.id,
                assignmentId: b.id,
                title: b.title,
                description: b.description,
                subject: b.subject || 'AP Biology',
                startTime: b.createdAt || new Date().toISOString(),
                endTime: endIso,
                attemptDurationMinutes: b.settings?.timeLimitMinutes || 20,
                maxAttempts: b.settings?.oneAttempt ? 1 : 1,
                questionCount: Array.isArray(b.questions) ? b.questions.length : 0,
                studentStatus: myAttempt ? 'SUBMITTED' : 'READY',
                isLocalBank: true,
              })
            }
          })
        }
      } catch (storageErr) {
        console.warn('Local question bank merge note:', storageErr)
      }

      setAssignedTests(combined)
    } catch (err) {
      console.warn('Failed to load assigned tests:', err)
      setError(err.message || 'Unable to load assigned quizzes.')
      setAssignedTests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBackendTests()
  }, [studentEmail])

  // Vanish expired quizzes: Exclude quizzes past endTime or marked isPast
  const visibleQuizzes = assignedTests.filter((t) => {
    if (t.isPast) return false
    if (t.endTime) {
      const endMs = new Date(t.endTime).getTime()
      if (!isNaN(endMs) && endMs <= currentTime) {
        return false // Automatically vanishes when window timing expires
      }
    }
    return true
  })

  if (!auth || !studentEmail) {
    return (
      <div className="qb-student-empty-card">
        <ion-icon name="lock-closed-outline" class="qb-empty-icon"></ion-icon>
        <h3>Sign In to Access Practice Quizzes</h3>
        <p>Please sign in with your student account to see the interactive quizzes assigned to you.</p>
        {onSignIn && (
          <button type="button" className="btn btn-primary" onClick={onSignIn}>
            <ion-icon name="logo-google"></ion-icon>
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="qb-student-quiz-container">
      <div className="qb-student-header">
        <div>
          <h2 className="qb-title">My Practice Quizzes</h2>
          <p className="qb-subtitle">
            Interactive quizzes assigned directly to your student email (<strong>{studentEmail}</strong>).
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadBackendTests}
          disabled={loading}
          style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}
          title="Refresh assigned quizzes from backend"
        >
          <ion-icon name="refresh-outline"></ion-icon>
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="qb-student-empty-card" style={{ padding: '48px 24px' }}>
          <ion-icon name="sync-outline" class="qb-empty-icon" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
          <h3>Loading Assigned Quizzes...</h3>
          <p>Connecting to server to retrieve quizzes assigned to <strong>{studentEmail}</strong>.</p>
        </div>
      ) : visibleQuizzes.length === 0 ? (
        <div className="qb-student-empty-card">
          <ion-icon name="book-outline" class="qb-empty-icon"></ion-icon>
          <h3>No Quizzes Assigned</h3>
          <p>
            You are signed in as <strong>{studentEmail}</strong>. No quizzes are currently assigned or active quiz windows have concluded.
          </p>
          <span className="qb-hint-badge">
            When your teacher assigns a quiz to your email address, it will automatically appear here with a live countdown timer.
          </span>
          {error && (
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#EF4444' }}>
              Note: {error}
            </p>
          )}
        </div>
      ) : (
        <div className="qb-grid">
          {visibleQuizzes.map((t) => {
            const quizId = t.testId || t.assignmentId
            const isSubmitted = t.studentStatus === 'SUBMITTED'
            const isStarted = t.studentStatus === 'STARTED'
            const duration = t.attemptDurationMinutes || 60
            const qCount = t.questionCount || 0
            const remainingCountdown = formatRemainingCountdown(t.endTime, currentTime)

            return (
              <div key={quizId} className="qb-card qb-student-card">
                <div className="qb-card-header">
                  <span className="qb-subject-badge">{t.subject || 'Proctored Exam'}</span>
                  <span className={`qb-attempt-badge ${isSubmitted ? 'completed' : isStarted ? 'started' : 'pending'}`}>
                    {isSubmitted ? '✓ Completed' : isStarted ? '● In Progress' : '● Ready to Take'}
                  </span>
                </div>

                <h3 className="qb-card-title">{t.title}</h3>
                <p className="qb-card-desc">
                  {t.description || `${qCount} Questions • ${duration} min timer`}
                </p>

                {/* Dynamic Real-time Countdown Timer Badge */}
                {remainingCountdown && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#FBBF24',
                      fontWeight: 600,
                      fontSize: '12px',
                      marginBottom: '12px',
                      width: 'fit-content',
                    }}
                    title="Active Quiz Window Countdown"
                  >
                    <ion-icon name="time-outline" style={{ fontSize: '15px' }}></ion-icon>
                    <span>{remainingCountdown}</span>
                  </div>
                )}

                <div className="qb-meta-row">
                  <div className="qb-meta-item">
                    <ion-icon name="help-circle-outline"></ion-icon>
                    <span>{qCount} Questions</span>
                  </div>
                  <div className="qb-meta-item">
                    <ion-icon name="timer-outline"></ion-icon>
                    <span>{duration} Minutes</span>
                  </div>
                  {remainingCountdown && (
                    <div className="qb-meta-item" style={{ color: '#FBBF24', fontWeight: 600 }}>
                      <ion-icon name="hourglass-outline"></ion-icon>
                      <span>{remainingCountdown}</span>
                    </div>
                  )}
                  {t.teacher && (
                    <div className="qb-meta-item" style={{ color: '#38bdf8' }}>
                      <ion-icon name="person-outline"></ion-icon>
                      <span>Teacher: {t.teacher.name || t.teacher.email}</span>
                    </div>
                  )}
                </div>

                <div className="qb-student-card-actions">
                  {isSubmitted ? (
                    <button
                      type="button"
                      className="btn btn-secondary qb-full-btn"
                      onClick={() => handleLaunch && handleLaunch(quizId)}
                    >
                      <ion-icon name="eye-outline"></ion-icon>
                      <span>View Results</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary qb-full-btn"
                      onClick={() => handleLaunch && handleLaunch(quizId)}
                    >
                      <ion-icon name="play-outline"></ion-icon>
                      <span>{isStarted ? 'Resume Quiz' : 'Start Quiz'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentQuizList
