import { useState, useEffect } from 'react'
import { studentApi, getStoredSessionUser } from '../../../services/nxtstepApi'

function StudentQuizList({ auth, onLaunchQuiz, onSignIn, studentEmail: propStudentEmail, onStartQuiz }) {
  const [assignedTests, setAssignedTests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const tests = await studentApi.getAssignedTests()
      if (Array.isArray(tests)) {
        setAssignedTests(tests)
      } else {
        setAssignedTests([])
      }
    } catch (err) {
      console.warn('Failed to load assigned tests from backend:', err)
      setError(err.message || 'Unable to load assigned quizzes from server.')
      setAssignedTests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBackendTests()
  }, [studentEmail])

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
      ) : assignedTests.length === 0 ? (
        <div className="qb-student-empty-card">
          <ion-icon name="book-outline" class="qb-empty-icon"></ion-icon>
          <h3>No Quizzes Assigned</h3>
          <p>
            You are signed in as <strong>{studentEmail}</strong>. No quizzes are currently assigned to your account.
          </p>
          <span className="qb-hint-badge">
            When your teacher assigns a quiz to your email address, it will automatically appear here.
          </span>
          {error && (
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#EF4444' }}>
              Note: {error}
            </p>
          )}
        </div>
      ) : (
        <div className="qb-grid">
          {assignedTests.map((t) => {
            const quizId = t.testId || t.assignmentId
            const isSubmitted = t.studentStatus === 'SUBMITTED'
            const isStarted = t.studentStatus === 'STARTED'
            const isPast = Boolean(t.isPast)
            const duration = t.attemptDurationMinutes || 60
            const qCount = t.questionCount || 0

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

                <div className="qb-meta-row">
                  <div className="qb-meta-item">
                    <ion-icon name="help-circle-outline"></ion-icon>
                    <span>{qCount} Questions</span>
                  </div>
                  <div className="qb-meta-item">
                    <ion-icon name="timer-outline"></ion-icon>
                    <span>{duration} Minutes</span>
                  </div>
                  <div className="qb-meta-item">
                    <ion-icon name="lock-closed-outline"></ion-icon>
                    <span>{t.maxAttempts ? `${t.maxAttempts} Attempt` : '1 Attempt'}</span>
                  </div>
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
                  ) : isPast ? (
                    <button
                      type="button"
                      className="btn btn-secondary qb-full-btn"
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    >
                      <ion-icon name="lock-closed-outline"></ion-icon>
                      <span>Quiz Window Closed</span>
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
