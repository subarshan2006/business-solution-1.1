import { useState, useEffect } from 'react'
import {
  getQuestionBanks,
  isStudentAuthorized,
  isQuizExpired,
} from '../services/questionBankStorage'
import {
  getStudentAttempt,
} from '../services/quizAttemptService'
import { studentApi, getStoredSessionUser } from '../../../services/nxtstepApi'

function StudentQuizList({ auth, onLaunchQuiz, onSignIn, studentEmail: propStudentEmail, onStartQuiz }) {
  const [assignedBanks, setAssignedBanks] = useState([])
  const [backendTests, setBackendTests] = useState([])

  const sessionUser = getStoredSessionUser()
  const studentEmail = (
    propStudentEmail ||
    (auth?.user?.email && auth.user.email !== 'Google Classroom Account' ? auth.user.email : '') ||
    (sessionUser?.email && sessionUser.email !== 'Google Classroom Account' ? sessionUser.email : '') ||
    auth?.user?.email ||
    ''
  ).trim().toLowerCase()

  const handleLaunch = onStartQuiz || onLaunchQuiz

  useEffect(() => {
    async function loadBackendTests() {
      try {
        const tests = await studentApi.getAssignedTests()
        if (Array.isArray(tests)) {
          setBackendTests(tests)
        }
      } catch {
        // Silent fallback to local storage question banks
      }
    }
    loadBackendTests()
  }, [studentEmail])

  useEffect(() => {
    if (!studentEmail) {
      setAssignedBanks([])
      return
    }

    const allBanks = getQuestionBanks()
    const authorized = allBanks.filter(
      (b) => (b.published || isStudentAuthorized(b, studentEmail)) && isStudentAuthorized(b, studentEmail)
    )

    const listWithAttempts = authorized.map((b) => {
      const att = getStudentAttempt(b.id, studentEmail)
      const isExp = isQuizExpired(b)
      return {
        ...b,
        attempt: att || null,
        isCompleted: Boolean(att && att.status === 'completed'),
        isExpired: isExp,
      }
    })

    setAssignedBanks(listWithAttempts)
  }, [studentEmail])

  if (!auth || !studentEmail) {
    return (
      <div className="qb-student-empty-card">
        <ion-icon name="lock-closed-outline" class="qb-empty-icon"></ion-icon>
        <h3>Sign In to Access Practice Quizzes</h3>
        <p>Please sign in with your student Google account to see the interactive quizzes assigned to you.</p>
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
      </div>

      {assignedBanks.length === 0 && backendTests.length === 0 ? (
        <div className="qb-student-empty-card">
          <ion-icon name="book-outline" class="qb-empty-icon"></ion-icon>
          <h3>No Practice Quizzes Assigned</h3>
          <p>
            You are signed in as <strong>{studentEmail}</strong>. Your instructor has not assigned any active quizzes to this email yet.
          </p>
          <span className="qb-hint-badge">
            Contact your instructor to add your email address to the Question Bank.
          </span>
        </div>
      ) : (
        <>
          {assignedBanks.length > 0 && (
            <div className="qb-grid">
              {assignedBanks.map((bank) => {
                const questionCount = Array.isArray(bank.questions) ? bank.questions.length : 0
                const attempt = bank.attempt

                return (
                  <div key={bank.id} className="qb-card qb-student-card">
                    <div className="qb-card-header">
                      <span className="qb-subject-badge">{bank.subject || 'AP Biology'}</span>
                      {bank.isCompleted ? (
                        <span className="qb-attempt-badge completed">
                          ✓ Completed ({attempt.score}/{attempt.totalQuestions})
                        </span>
                      ) : bank.isExpired ? (
                        <span className="qb-attempt-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
                          3h Window Expired
                        </span>
                      ) : (
                        <span className="qb-attempt-badge pending">
                          ● Ready to Take
                        </span>
                      )}
                    </div>

                    <h3 className="qb-card-title">{bank.title}</h3>
                    <p className="qb-card-desc">{bank.description || 'Targeted practice quiz.'}</p>

                    <div className="qb-meta-row">
                      <div className="qb-meta-item">
                        <ion-icon name="help-circle-outline"></ion-icon>
                        <span>{questionCount} Questions</span>
                      </div>
                      <div className="qb-meta-item">
                        <ion-icon name="timer-outline"></ion-icon>
                        <span>{bank.settings?.timeLimitMinutes ? `${bank.settings.timeLimitMinutes}m` : 'Untimed'}</span>
                      </div>
                      <div className="qb-meta-item" title="After 3 hours, question diagrams auto-delete permanently">
                        <ion-icon name="trash-bin-outline" style={{ color: 'var(--mint, #FF5C5C)' }}></ion-icon>
                        <span>{bank.settings?.quizEndingHours || 3}h Window</span>
                      </div>
                      {bank.settings?.oneAttempt && (
                        <div className="qb-meta-item">
                          <ion-icon name="lock-closed-outline"></ion-icon>
                          <span>1 Attempt</span>
                        </div>
                      )}
                    </div>

                    {bank.isCompleted && attempt && (
                      <div className="qb-student-score-summary">
                        <div className="qb-student-score-num">
                          Score: <strong>{attempt.score} / {attempt.totalQuestions}</strong> ({attempt.percentage}%)
                        </div>
                        <div className="qb-student-score-date">
                          Finished {new Date(attempt.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    <div className="qb-student-card-actions">
                      {bank.isCompleted ? (
                        <button
                          type="button"
                          className="btn btn-secondary qb-full-btn"
                          onClick={() => handleLaunch && handleLaunch(bank.id)}
                        >
                          <ion-icon name="eye-outline"></ion-icon>
                          <span>View Results</span>
                        </button>
                      ) : bank.isExpired ? (
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
                          onClick={() => handleLaunch && handleLaunch(bank.id)}
                        >
                          <ion-icon name="play-outline"></ion-icon>
                          <span>Start Quiz</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Backend Assigned Tests Section */}
          {backendTests.length > 0 && (
            <div style={{ marginTop: assignedBanks.length > 0 ? '36px' : '0' }}>
              <h3 className="h3" style={{ marginBottom: '16px', color: '#ffb347' }}>
                🎯 Active Practice Quizzes Assigned by Instructor
              </h3>
              <div className="qb-grid">
                {backendTests.map((t) => (
                  <div key={t.testId || t.assignmentId} className="qb-card qb-student-card">
                    <div className="qb-card-header">
                      <span className="qb-subject-badge">{t.subject || 'Proctored Exam'}</span>
                      <span className={`qb-attempt-badge ${t.studentStatus === 'SUBMITTED' ? 'completed' : 'pending'}`}>
                        {t.studentStatus}
                      </span>
                    </div>
                    <h3 className="qb-card-title">{t.title}</h3>
                    <p className="qb-card-desc">{t.description || `${t.questionCount || 0} Questions • ${t.attemptDurationMinutes || 60} min timer`}</p>
                    <div className="qb-meta-row">
                      <div className="qb-meta-item">
                        <ion-icon name="timer-outline"></ion-icon>
                        <span>{t.attemptDurationMinutes} Minutes</span>
                      </div>
                      <div className="qb-meta-item">
                        <ion-icon name="lock-closed-outline"></ion-icon>
                        <span>One-Attempt Proctored</span>
                      </div>
                      {t.teacher && (
                        <div className="qb-meta-item" style={{ color: '#38bdf8' }}>
                          <ion-icon name="person-outline"></ion-icon>
                          <span>Teacher: {t.teacher.name || t.teacher.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="qb-student-card-actions">
                      {t.studentStatus === 'SUBMITTED' ? (
                        <button
                          type="button"
                          className="btn btn-secondary qb-full-btn"
                          onClick={() => handleLaunch && handleLaunch(t.testId || t.assignmentId)}
                        >
                          <ion-icon name="eye-outline"></ion-icon>
                          <span>View Results</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary qb-full-btn"
                          onClick={() => handleLaunch && handleLaunch(t.testId || t.assignmentId)}
                        >
                          <ion-icon name="play-outline"></ion-icon>
                          <span>Start Quiz</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StudentQuizList
