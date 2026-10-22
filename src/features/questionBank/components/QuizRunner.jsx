import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getStoredAuth,
  requestGoogleAccessToken,
  signOutGoogle,
} from '../../../services/googleAuth'
import {
  getQuestionBankById,
  isStudentAuthorized,
} from '../services/questionBankStorage'
import {
  getStudentAttempt,
  recordCompletedAttempt,
} from '../services/quizAttemptService'
import { prepareQuizQuestions } from '../utils/quizUtils'

function QuizRunner({ bankId: propBankId = null, isPreview = false, onClosePreview = null }) {
  const params = useParams()
  const navigate = useNavigate()
  const activeBankId = propBankId || params.bankId

  const [auth, setAuth] = useState(() => getStoredAuth())
  const [bank, setBank] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Quiz progression states
  // 'checking_auth' | 'access_denied' | 'already_completed' | 'start_screen' | 'in_progress' | 'completed'
  const [stage, setStage] = useState('checking_auth')

  const [preparedQuestions, setPreparedQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [studentAnswers, setStudentAnswers] = useState([]) // array of { qId, selectedOption, correctOption, isCorrect }
  const [finalScore, setFinalScore] = useState(0)
  const [completedAttemptData, setCompletedAttemptData] = useState(null)

  // 1. Load Bank metadata ONLY (do not load questions yet)
  useEffect(() => {
    if (!activeBankId) return
    const b = getQuestionBankById(activeBankId)
    setBank(b)
  }, [activeBankId])

  // 2. Perform Authorization Gate check
  useEffect(() => {
    if (!bank) return

    // If teacher preview mode
    if (isPreview) {
      const qs = prepareQuizQuestions(bank.questions, bank.settings)
      setPreparedQuestions(qs)
      setStage('start_screen')
      return
    }

    // Check if user is signed in
    if (!auth || !auth.user?.email) {
      setStage('checking_auth')
      return
    }

    const studentEmail = auth.user.email

    // Check if authorized
    const authorized = isStudentAuthorized(bank, studentEmail)
    if (!authorized) {
      setStage('access_denied')
      return
    }

    // Check if already completed and oneAttempt is enabled
    if (bank.settings?.oneAttempt) {
      const priorAttempt = getStudentAttempt(bank.id, studentEmail)
      if (priorAttempt && priorAttempt.status === 'completed') {
        setCompletedAttemptData(priorAttempt)
        setStage('already_completed')
        return
      }
    }

    // AUTHORIZED: Now load questions into memory
    const qs = prepareQuizQuestions(bank.questions, bank.settings)
    setPreparedQuestions(qs)
    setStage('start_screen')
  }, [bank, auth, isPreview])

  // Google Sign-in Handler
  const handleGoogleLogin = async () => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const newAuth = await requestGoogleAccessToken()
      setAuth(newAuth)
    } catch (err) {
      console.error('Google Sign-in failed:', err)
      setAuthError(err.message || 'Google Sign-in failed. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = () => {
    if (auth?.accessToken) {
      signOutGoogle(auth.accessToken)
    }
    setAuth(null)
    setStage('checking_auth')
  }

  // Start Quiz
  const handleStartQuiz = () => {
    setCurrentIndex(0)
    setSelectedOptionId('')
    setIsAnswerSubmitted(false)
    setStudentAnswers([])
    setStage('in_progress')
  }

  // Select Option
  const handleSelectOption = (optId) => {
    if (isAnswerSubmitted) return // Locked!
    setSelectedOptionId(optId)
  }

  // Submit Answer (Locks immediately and reveals instant feedback)
  const handleSubmitAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted) return

    const currentQ = preparedQuestions[currentIndex]
    const isCorrect = selectedOptionId.toUpperCase() === currentQ.correctOption.toUpperCase()

    const answerRecord = {
      questionId: currentQ.id,
      selectedOption: selectedOptionId,
      correctOption: currentQ.correctOption,
      isCorrect,
    }

    setStudentAnswers((prev) => [...prev, answerRecord])
    setIsAnswerSubmitted(true)
  }

  // Next Question or Finish Quiz
  const handleNextQuestion = () => {
    if (currentIndex < preparedQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedOptionId('')
      setIsAnswerSubmitted(false)
    } else {
      // Quiz finished
      handleFinishQuiz()
    }
  }

  // Finish and Record Attempt
  const handleFinishQuiz = () => {
    const correctCount = studentAnswers.filter((a) => a.isCorrect).length
    setFinalScore(correctCount)

    if (!isPreview && auth?.user?.email) {
      const saved = recordCompletedAttempt(bank.id, auth.user.email, {
        score: correctCount,
        totalQuestions: preparedQuestions.length,
        answers: studentAnswers,
        studentName: auth.user.name || auth.user.email,
      })
      setCompletedAttemptData(saved)
    }

    setStage('completed')
  }

  if (!bank) {
    return (
      <div className="qb-quiz-fullscreen-wrapper">
        <div className="qb-quiz-card">
          <div className="qb-empty-state">
            <ion-icon name="alert-circle-outline" class="qb-empty-icon"></ion-icon>
            <h3>Question Bank Not Found</h3>
            <p>The requested question bank ID does not exist or has been removed.</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/classroom')}>
              Return to Portal
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = preparedQuestions[currentIndex] || null
  const isLastQuestion = currentIndex === preparedQuestions.length - 1
  const progressPercent = preparedQuestions.length > 0
    ? Math.round(((currentIndex + (isAnswerSubmitted ? 1 : 0)) / preparedQuestions.length) * 100)
    : 0

  return (
    <div className="qb-quiz-fullscreen-wrapper">
      {/* Quiz Top Navigation Bar */}
      <header className="qb-quiz-nav">
        <div className="qb-quiz-nav-left">
          <button
            type="button"
            className="qb-quiz-back-btn"
            onClick={isPreview && onClosePreview ? onClosePreview : () => navigate('/classroom')}
          >
            <ion-icon name="arrow-back-outline"></ion-icon>
            <span>{isPreview ? 'Close Preview' : 'Back to Portal'}</span>
          </button>
          <span className="qb-quiz-subject-tag">{bank.subject || 'AP Biology'}</span>
        </div>

        <div className="qb-quiz-nav-right">
          {isPreview ? (
            <span className="qb-preview-mode-badge">
              <ion-icon name="eye-outline"></ion-icon> Teacher Preview Mode
            </span>
          ) : auth?.user?.email ? (
            <div className="qb-student-account-chip">
              <ion-icon name="person-circle-outline"></ion-icon>
              <span className="qb-account-email">{auth.user.email}</span>
              <button
                type="button"
                className="qb-switch-account-btn"
                onClick={handleSignOut}
                title="Sign out or switch Google account"
              >
                Switch
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Main Container */}
      <main className="qb-quiz-main-container">
        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN REQUIRED                                 */}
        {/* ========================================================= */}
        {stage === 'checking_auth' && (
          <div className="qb-quiz-card text-center">
            <div className="qb-card-icon-hero">
              <ion-icon name="lock-closed-outline"></ion-icon>
            </div>
            <h2 className="qb-hero-title">{bank.title}</h2>
            <p className="qb-hero-desc">
              This is a protected practice quiz. Please sign in with your student Google account to verify your access.
            </p>

            {authError && <div className="qb-alert-error" style={{ marginBottom: '16px' }}>{authError}</div>}

            <button
              type="button"
              className="btn btn-primary qb-hero-btn"
              onClick={handleGoogleLogin}
              disabled={authLoading}
            >
              <ion-icon name="logo-google"></ion-icon>
              <span>{authLoading ? 'Verifying with Google...' : 'Sign In with Google'}</span>
            </button>
            <p className="qb-auth-note">
              No Classroom permissions required. We only verify your email address against the instructor&rsquo;s authorized roster.
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ACCESS DENIED                                    */}
        {/* ========================================================= */}
        {stage === 'access_denied' && (
          <div className="qb-quiz-card text-center">
            <div className="qb-card-icon-hero danger">
              <ion-icon name="close-circle-outline"></ion-icon>
            </div>
            <h2 className="qb-hero-title">Access Denied</h2>
            <p className="qb-hero-desc">
              You are signed in as <strong>{auth?.user?.email}</strong>, but this Google account is not authorized to access <em>&ldquo;{bank.title}&rdquo;</em>.
            </p>
            <div className="qb-info-banner" style={{ textAlign: 'left', marginBottom: '24px' }}>
              <ion-icon name="information-circle-outline"></ion-icon>
              <div>
                <strong>Need access?</strong>
                <p>Please contact your instructor so they can add your Google email address to this Question Bank&rsquo;s authorized access list.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
                Switch Google Account
              </button>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/classroom')}>
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: ALREADY COMPLETED                                */}
        {/* ========================================================= */}
        {stage === 'already_completed' && (
          <div className="qb-quiz-card text-center">
            <div className="qb-card-icon-hero success">
              <ion-icon name="checkmark-done-circle-outline"></ion-icon>
            </div>
            <h2 className="qb-hero-title">Quiz Already Completed</h2>
            <p className="qb-hero-desc">
              You have already completed <em>&ldquo;{bank.title}&rdquo;</em>. Single-attempt mode is enabled for this exam.
            </p>

            {completedAttemptData && (
              <div className="qb-prior-result-box">
                <div className="qb-result-score-big">
                  {completedAttemptData.score} <span>/ {completedAttemptData.totalQuestions}</span>
                </div>
                <div className="qb-result-percent">{completedAttemptData.percentage}% Score</div>
                <p className="qb-completed-time-label">
                  Completed on {new Date(completedAttemptData.completedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            <button type="button" className="btn btn-primary" onClick={() => navigate('/classroom')}>
              Back to Dashboard
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: QUIZ START SCREEN                                */}
        {/* ========================================================= */}
        {stage === 'start_screen' && (
          <div className="qb-quiz-card">
            <span className="qb-subject-badge">{bank.subject || 'AP Biology'}</span>
            <h1 className="qb-quiz-title-start">{bank.title}</h1>
            <p className="qb-quiz-desc-start">{bank.description || 'Welcome to this interactive quiz.'}</p>

            <div className="qb-rules-list">
              <div className="qb-rule-item">
                <ion-icon name="help-circle-outline"></ion-icon>
                <div>
                  <strong>{preparedQuestions.length} Questions</strong>
                  <span>Multiple choice questions with comprehensive explanations.</span>
                </div>
              </div>
              <div className="qb-rule-item">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <div>
                  <strong>Authorized Account: {isPreview ? 'Teacher Preview' : auth?.user?.email}</strong>
                  <span>Your student authorization is confirmed.</span>
                </div>
              </div>
              {bank.settings?.oneAttempt && (
                <div className="qb-rule-item highlight-warn">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  <div>
                    <strong>One-Time Attempt</strong>
                    <span>You can submit this quiz only once. Retakes are not available once submitted.</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '28px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-primary qb-hero-btn"
                onClick={handleStartQuiz}
                disabled={preparedQuestions.length === 0}
              >
                <span>Start Quiz Now</span>
                <ion-icon name="arrow-forward-outline"></ion-icon>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: INTERACTIVE QUIZ IN PROGRESS                     */}
        {/* ========================================================= */}
        {stage === 'in_progress' && currentQ && (
          <div className="qb-quiz-card">
            {/* Progress Header */}
            <div className="qb-quiz-progress-bar-container">
              <div
                className="qb-quiz-progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="qb-quiz-q-meta">
              <span className="qb-q-counter">
                Question <strong>{currentIndex + 1}</strong> of <strong>{preparedQuestions.length}</strong>
              </span>
              <span className="qb-progress-percent">{progressPercent}% Completed</span>
            </div>

            {/* Question Text */}
            <h2 className="qb-active-question-prompt">{currentQ.question}</h2>

            {/* Multiple Choice Options List */}
            <div className="qb-quiz-options-group">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id
                const isCorrectOption = opt.id.toUpperCase() === currentQ.correctOption.toUpperCase()

                let optClass = 'qb-quiz-option-button'
                if (isSelected) optClass += ' selected'
                if (isAnswerSubmitted) {
                  optClass += ' locked'
                  if (isCorrectOption) {
                    optClass += ' option-revealed-correct'
                  } else if (isSelected && !isCorrectOption) {
                    optClass += ' option-revealed-wrong'
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={optClass}
                    onClick={() => handleSelectOption(opt.id)}
                    disabled={isAnswerSubmitted}
                  >
                    <span className="qb-opt-letter-circle">{opt.id}</span>
                    <span className="qb-opt-text-body">{opt.text}</span>
                    {isAnswerSubmitted && isCorrectOption && (
                      <ion-icon name="checkmark-circle" class="qb-opt-feedback-icon correct"></ion-icon>
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrectOption && (
                      <ion-icon name="close-circle" class="qb-opt-feedback-icon wrong"></ion-icon>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Submission / Next Controls & Instant Feedback */}
            {!isAnswerSubmitted ? (
              <div className="qb-quiz-action-row">
                <button
                  type="button"
                  className="btn btn-primary qb-submit-btn"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOptionId}
                >
                  <ion-icon name="checkmark-outline"></ion-icon>
                  <span>Submit Answer</span>
                </button>
              </div>
            ) : (
              /* Instant Feedback Banner & Explanation */
              <div className="qb-feedback-reveal-panel">
                {selectedOptionId.toUpperCase() === currentQ.correctOption.toUpperCase() ? (
                  <div className="qb-feedback-banner correct">
                    <div className="qb-banner-header">
                      <ion-icon name="checkmark-circle"></ion-icon>
                      <strong>✓ Correct!</strong>
                    </div>
                    <p>
                      Your answer: <strong>{selectedOptionId}. {currentQ.options.find(o => o.id === selectedOptionId)?.text}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="qb-feedback-banner incorrect">
                    <div className="qb-banner-header">
                      <ion-icon name="close-circle"></ion-icon>
                      <strong>✗ Incorrect</strong>
                    </div>
                    <p>
                      Your answer: <strong>{selectedOptionId}. {currentQ.options.find(o => o.id === selectedOptionId)?.text}</strong>
                    </p>
                    <p className="qb-correct-highlight">
                      Correct answer: <strong>{currentQ.correctOption}. {currentQ.options.find(o => o.id === currentQ.correctOption)?.text}</strong>
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {bank.settings?.showExplanation !== false && currentQ.explanation && (
                  <div className="qb-quiz-explanation-box">
                    <div className="qb-exp-label">
                      <ion-icon name="bulb-outline"></ion-icon>
                      <span>Explanation:</span>
                    </div>
                    <p className="qb-exp-content">{currentQ.explanation}</p>
                  </div>
                )}

                {/* Next Question Button */}
                <div className="qb-quiz-action-row" style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-primary qb-next-btn"
                    onClick={handleNextQuestion}
                  >
                    <span>{isLastQuestion ? 'Complete Quiz & View Score' : 'Next Question'}</span>
                    <ion-icon name="arrow-forward-outline"></ion-icon>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: FINAL SCORECARD RESULT                           */}
        {/* ========================================================= */}
        {stage === 'completed' && (
          <div className="qb-quiz-card text-center">
            <div className="qb-card-icon-hero success">
              <ion-icon name="ribbon-outline"></ion-icon>
            </div>
            <h2 className="qb-hero-title">Quiz Completed!</h2>
            <p className="qb-hero-desc">Great job on finishing <em>&ldquo;{bank.title}&rdquo;</em>.</p>

            <div className="qb-scorecard-box">
              <div className="qb-result-score-big">
                {finalScore} <span>/ {preparedQuestions.length}</span>
              </div>
              <div className="qb-result-percent">
                {preparedQuestions.length > 0 ? Math.round((finalScore / preparedQuestions.length) * 100) : 0}% Score
              </div>

              <div className="qb-score-breakdown-row">
                <div className="qb-breakdown-item correct">
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                  <span>{finalScore} Correct</span>
                </div>
                <div className="qb-breakdown-item wrong">
                  <ion-icon name="close-circle-outline"></ion-icon>
                  <span>{preparedQuestions.length - finalScore} Incorrect</span>
                </div>
              </div>

              <p className="qb-completed-date-stamp">
                Submitted on {new Date().toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {bank.settings?.oneAttempt && !isPreview && (
              <div className="qb-info-banner" style={{ marginBottom: '24px' }}>
                <ion-icon name="lock-closed-outline"></ion-icon>
                <span>Single-attempt mode is enabled. Your attempt has been permanently recorded.</span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary qb-hero-btn"
              onClick={isPreview && onClosePreview ? onClosePreview : () => navigate('/classroom')}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default QuizRunner
