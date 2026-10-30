import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getStoredAuth,
  requestGoogleAccessToken,
  signOutGoogle,
} from '../../../services/googleAuth'
import {
  getQuestionBankById,
  isStudentAuthorized,
  isQuizExpired,
  purgeExpiredQuizAssets,
} from '../services/questionBankStorage'
import {
  getStudentAttempt,
  recordCompletedAttempt,
} from '../services/quizAttemptService'
import { prepareQuizQuestions } from '../utils/quizUtils'
import {
  createEphemeralBlob,
  resolveAssetUrl,
  purgeAllEphemeralImages,
} from '../services/ephemeralImageService'
import WatermarkedDiagramCanvas from './WatermarkedDiagramCanvas'
import ThemeToggle from '../../../components/ThemeToggle'
import { studentApi, getStoredSessionUser } from '../../../services/nxtstepApi'

function QuizRunner({ bankId: propBankId = null, isPreview = false, onClosePreview = null }) {
  const params = useParams()
  const navigate = useNavigate()
  const activeBankId = propBankId || params.bankId

  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark'
  })

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  const [auth, setAuth] = useState(() => getStoredAuth())
  const [bank, setBank] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isStartingAttempt, setIsStartingAttempt] = useState(false)

  // Quiz progression stages:
  // 'checking_auth' | 'access_denied' | 'already_completed' | 'start_screen' | 'in_progress' | 'completed'
  const [stage, setStage] = useState('checking_auth')

  const [preparedQuestions, setPreparedQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [studentAnswers, setStudentAnswers] = useState([]) // array of { questionId, selectedOption, correctOption, isCorrect }
  const [finalScore, setFinalScore] = useState(0)
  const [completedAttemptData, setCompletedAttemptData] = useState(null)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [isScreenObscured, setIsScreenObscured] = useState(false)

  // Timer states
  const [secondsRemaining, setSecondsRemaining] = useState(null)
  const [timedOutNotice, setTimedOutNotice] = useState(false)
  const timerIntervalRef = useRef(null)

  // Proctored Fullscreen & Anti-Cheating states (Pillar 2)
  const [isFullscreenBlocked, setIsFullscreenBlocked] = useState(false)
  const [fullscreenViolations, setFullscreenViolations] = useState(0)

  // Fullscreen controller utility
  const enterFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen()
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen()
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen entry prevented:', err)
    } finally {
      setIsFullscreenBlocked(false)
    }
  }, [])

  const exitFullscreenSafe = useCallback(() => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        }
      }
    } catch {}
  }, [])

  // 1. Cleanup ephemeral image blobs when unmounting or leaving quiz & hide sidebar
  useEffect(() => {
    document.body.classList.add('modal-open', 'quiz-open')
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      purgeAllEphemeralImages()
      exitFullscreenSafe()
      document.body.classList.remove('modal-open', 'quiz-open')
    }
  }, [exitFullscreenSafe])

  const handleExitQuiz = useCallback(() => {
    purgeAllEphemeralImages()
    exitFullscreenSafe()
    if (onClosePreview) {
      onClosePreview()
    } else {
      navigate('/classroom')
    }
  }, [onClosePreview, navigate, exitFullscreenSafe])

  // Escape key closes quiz when opened inside classroom overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClosePreview) {
        handleExitQuiz()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClosePreview, handleExitQuiz])

  // 2. Load Bank metadata (Local storage with Backend test fallback)
  useEffect(() => {
    if (!activeBankId) return
    const b = getQuestionBankById(activeBankId)
    if (b) {
      setBank(b)
    } else {
      studentApi.getAssignedTests().then((tests) => {
        const found = Array.isArray(tests)
          ? tests.find((t) => t.testId === activeBankId || t.assignmentId === activeBankId)
          : null
        if (found) {
          setBank({
            id: found.testId,
            title: found.title,
            description: found.description,
            subject: found.subject || 'AP Biology',
            published: true,
            isBackendTest: true,
            questionCount: found.questionCount || 39,
            teacher: found.teacher,
            authorizedStudents: auth?.user?.email ? [auth.user.email] : [],
            settings: {
              timeLimitMinutes: found.attemptDurationMinutes || 60,
              oneAttempt: true,
              showExplanation: true,
            },
            questions: [],
          })
        }
      }).catch((err) => {
        console.warn('Failed to load backend test details:', err)
      })
    }
  }, [activeBankId, auth])

  // 3. Perform Authorization Gate check & Pillar 1 Quiz Expiry
  useEffect(() => {
    if (!bank) return

    // If backend test, proceed directly to start screen
    if (bank.isBackendTest) {
      setStage('start_screen')
      return
    }

    // If teacher preview mode
    if (isPreview) {
      const qs = prepareQuizQuestions(
        (bank.questions || []).map((q) => {
          const questionImg =
            q.images?.find((img) => img.role === 'QUESTION')?.imageUrl || q.image || q.imageUrl || null
          const choicesImg =
            q.images?.find((img) => img.role === 'CHOICES')?.imageUrl || q.choicesImage || null
          const explanationImg =
            q.images?.find((img) => img.role === 'EXPLANATION')?.imageUrl || q.explanationImage || null

          return {
            ...q,
            image: questionImg,
            choicesImage: choicesImg,
            explanationImage: explanationImg,
          }
        }),
        bank.settings,
      )
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

    // Check Pillar 1: Quiz Ending Time (e.g. 3 hours) Expiry & Auto-Delete
    if (isQuizExpired(bank)) {
      purgeExpiredQuizAssets(bank.id)
      const priorAttempt = getStudentAttempt(bank.id, studentEmail)
      if (priorAttempt && priorAttempt.status === 'completed') {
        setCompletedAttemptData(priorAttempt)
        setStage('already_completed')
      } else {
        setStage('quiz_expired')
      }
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

    // AUTHORIZED: Load questions into memory
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

  // Finish and Record Attempt (Auto-purges images immediately & records strictly under student email)
  const handleFinishQuiz = useCallback(
    (isTimeout = false) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      // Calculate score
      const correctCount = studentAnswers.filter((a) => a.isCorrect).length
      setFinalScore(correctCount)

      if (isTimeout) {
        setTimedOutNotice(true)
      }

      const effectiveEmail = (
        (auth?.user?.email && auth.user.email !== 'Google Classroom Account' ? auth.user.email : '') ||
        getStoredSessionUser()?.email ||
        auth?.user?.email ||
        ''
      )

      if (!isPreview && effectiveEmail && bank) {
        if (bank.isBackendTest) {
          const answersPayload = studentAnswers.map((a) => ({
            attemptQuestionId: a.questionId,
            selectedOption: a.selectedOption,
          }))
          studentApi
            .submitAttempt(bank.id, answersPayload)
            .then((result) => {
              if (result) {
                setFinalScore(result.score || 0)
                setCompletedAttemptData({
                  score: result.score,
                  totalQuestions: result.totalQuestions,
                  percentage: result.percentage,
                  timeTakenSeconds: result.timeTakenSeconds,
                })
              }
            })
            .catch((err) => {
              console.warn('Backend attempt submission warning:', err)
            })
        } else {
          // Pillar 3: Record attempt strictly partitioned by student email with proctoring stats
          const saved = recordCompletedAttempt(bank.id, effectiveEmail, {
            score: correctCount,
            totalQuestions: preparedQuestions.length,
            answers: studentAnswers,
            studentName: auth?.user?.name || effectiveEmail,
            fullscreenViolations,
          })
          setCompletedAttemptData(saved)
        }
      }

      // EPHEMERAL PURGE: Revoke all image blobs from memory immediately
      purgeAllEphemeralImages()

      // Zero out image data payloads from memory state
      setPreparedQuestions((prev) =>
        prev.map((q) => ({ ...q, image: null, imageUrl: null, explanationImage: null }))
      )

      setStage('completed')
    },
    [studentAnswers, isPreview, auth, bank, preparedQuestions.length, fullscreenViolations]
  )

  // Pillar 1 & Duration: Timer countdown & periodic 3h ending window check
  useEffect(() => {
    if (stage !== 'in_progress') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      return
    }

    // Periodic check for Pillar 1 quiz ending expiry (3-hour auto-shred)
    const checkExpiryInterval = setInterval(() => {
      if (!isPreview && bank && isQuizExpired(bank)) {
        purgeExpiredQuizAssets(bank.id)
        clearInterval(checkExpiryInterval)
        handleFinishQuiz(true)
      }
    }, 5000)

    const timeLimitMins = bank?.settings?.timeLimitMinutes
    if (!timeLimitMins || Number(timeLimitMins) <= 0) {
      return () => {
        clearInterval(checkExpiryInterval)
      }
    }

    const totalSeconds = Number(timeLimitMins) * 60
    setSecondsRemaining(totalSeconds)

    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return totalSeconds
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current)
          handleFinishQuiz(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(checkExpiryInterval)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [stage, bank, isPreview, handleFinishQuiz])

  // Pillar 2: Proctored Fullscreen & Anti-Cheating Lockdown Monitor
  useEffect(() => {
    if (stage !== 'in_progress' || isPreview) return

    const checkLockdown = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const isShrunk = isMobile
        ? window.innerHeight < 360
        : window.innerWidth < 760 || window.innerHeight < 460

      if (!isFs || isShrunk) {
        setIsFullscreenBlocked(true)
        setFullscreenViolations((prev) => prev + 1)
      } else {
        setIsFullscreenBlocked(false)
      }
    }

    document.addEventListener('fullscreenchange', checkLockdown)
    document.addEventListener('webkitfullscreenchange', checkLockdown)
    window.addEventListener('resize', checkLockdown)

    // Initial check after delay to allow fullscreen transition to complete
    const initialCheck = setTimeout(checkLockdown, 800)

    return () => {
      clearTimeout(initialCheck)
      document.removeEventListener('fullscreenchange', checkLockdown)
      document.removeEventListener('webkitfullscreenchange', checkLockdown)
      window.removeEventListener('resize', checkLockdown)
    }
  }, [stage, isPreview])

  // Security Protection 1: Block Right-Click and Developer Inspect Access (Students only)
  useEffect(() => {
    if (stage !== 'in_progress' || isPreview) return

    const blockContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    const blockDevToolsShortcuts = (e) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault()
        return false
      }
      // Ctrl+U / Cmd+Option+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault()
        return false
      }
      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
        e.preventDefault()
        return false
      }
      // PrintScreen Key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault()
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('')
          }
        } catch {}
        return false
      }
    }

    document.addEventListener('contextmenu', blockContextMenu)
    window.addEventListener('keydown', blockDevToolsShortcuts)

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      window.removeEventListener('keydown', blockDevToolsShortcuts)
    }
  }, [stage, isPreview])

  // Security Protection 3: Tab-Switch & Window Blur Obfuscation (Screenshot/Recording Shield)
  useEffect(() => {
    if (stage !== 'in_progress' || isPreview) {
      setIsScreenObscured(false)
      return
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsScreenObscured(true)
      } else {
        setIsScreenObscured(false)
      }
    }

    const handleWindowBlur = () => {
      setIsScreenObscured(true)
    }

    const handleWindowFocus = () => {
      setIsScreenObscured(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [stage, isPreview])

  // Start Quiz (Triggers Desktop & Mobile Fullscreen Lockdown)
  const handleStartQuiz = async () => {
    setIsStartingAttempt(true)
    setCurrentIndex(0)
    setSelectedOptionId('')
    setIsAnswerSubmitted(false)
    setStudentAnswers([])
    setTimedOutNotice(false)
    setFullscreenViolations(0)
    setIsFullscreenBlocked(false)

    try {
      if (bank?.isBackendTest) {
        let attempt = null
        try {
          attempt = await studentApi.startAttempt(bank.id)
        } catch (err) {
          // If attempt already in progress, resume it cleanly!
          if (
            err.code === 'ATTEMPT_ALREADY_EXISTS' ||
            err.status === 409 ||
            (err.message && err.message.includes('already started'))
          ) {
            attempt = await studentApi.getActiveAttempt(bank.id)
          } else {
            throw err
          }
        }

        if (attempt?.questions && attempt.questions.length > 0) {
          const qs = attempt.questions.map((q) => {
            const questionImg =
              q.images?.find((img) => img.role === 'QUESTION')?.imageUrl || q.images?.[0]?.imageUrl || null
            const choicesImg =
              q.images?.find((img) => img.role === 'CHOICES')?.imageUrl || null
            const explanationImg =
              q.images?.find((img) => img.role === 'EXPLANATION')?.imageUrl || null

            return {
              id: q.attemptQuestionId,
              question: q.questionText,
              options: (q.options || []).map((o) => ({
                id: o.label,
                text: o.text || o.label,
                imageUrl: o.imageUrl,
              })),
              image: questionImg,
              choicesImage: choicesImg,
              explanationImage: explanationImg,
              images: q.images || [],
              correctOption: q.correctOption || '',
              explanation: q.explanation || '',
              selectedOption: q.selectedOption || null,
              isCorrect: q.isCorrect ?? null,
            }
          })
          setPreparedQuestions(qs)

          // If first question was already answered, populate selection and submitted state
          if (qs[0] && qs[0].selectedOption) {
            setSelectedOptionId(qs[0].selectedOption)
            setIsAnswerSubmitted(true)
          }
        } else {
          throw new Error('No questions available in this test attempt.')
        }
      }

      if (!isPreview) {
        await enterFullscreen()
      }
      setStage('in_progress')
    } catch (err) {
      console.error('Failed to start quiz attempt:', err)
      setAuthError(err.message || 'Unable to start attempt. You may not be assigned to this quiz.')
      setStage('access_denied')
    } finally {
      setIsStartingAttempt(false)
    }
  }

  // Select Option
  const handleSelectOption = (optId) => {
    if (isAnswerSubmitted || isSubmittingAnswer) return // Locked!
    setSelectedOptionId(optId)
  }

  // Submit Answer (Locks immediately, checks answer, and reveals instant practice feedback + reason)
  const handleSubmitAnswer = async () => {
    if (!selectedOptionId || isAnswerSubmitted || isSubmittingAnswer) return

    const currentQ = preparedQuestions[currentIndex]
    if (!currentQ) return

    setIsSubmittingAnswer(true)

    let isCorrect = currentQ.correctOption
      ? selectedOptionId.toUpperCase() === currentQ.correctOption.toUpperCase()
      : false
    let correctOption = currentQ.correctOption || ''
    let explanation = currentQ.explanation || ''

    // If backend test, interactively check answer via backend to get correctness, correctOption, and explanation
    if (bank?.isBackendTest) {
      try {
        const feedback = await studentApi.checkPracticeAnswer(bank.id, currentQ.id, selectedOptionId)
        if (feedback) {
          isCorrect = Boolean(feedback.isCorrect)
          correctOption = feedback.correctOption || ''
          explanation = feedback.explanation || ''
          const explanationImage =
            feedback.explanationImageUrl || currentQ.explanationImage || null

          // update current question in preparedQuestions so the option buttons & explanation panel reveal the answer & rationale
          setPreparedQuestions((prev) => {
            const next = [...prev]
            if (next[currentIndex]) {
              next[currentIndex] = {
                ...next[currentIndex],
                correctOption,
                explanation,
                explanationImage,
                isCorrect,
                selectedOption: selectedOptionId,
              }
            }
            return next
          })
        }
      } catch (err) {
        console.warn('Backend practice check error:', err)
        studentApi
          .saveAnswers(bank.id, [
            {
              attemptQuestionId: currentQ.id,
              selectedOption: selectedOptionId,
            },
          ])
          .catch(() => {})
      }
    }

    const answerRecord = {
      questionId: currentQ.id,
      selectedOption: selectedOptionId,
      correctOption,
      isCorrect,
      explanation,
    }

    setStudentAnswers((prev) => [...prev, answerRecord])
    setIsAnswerSubmitted(true)
    setIsSubmittingAnswer(false)
  }

  // Next Question or Finish Quiz
  const handleNextQuestion = () => {
    if (currentIndex < preparedQuestions.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      const nextQ = preparedQuestions[nextIndex]
      if (nextQ && nextQ.selectedOption) {
        setSelectedOptionId(nextQ.selectedOption)
        setIsAnswerSubmitted(true)
      } else {
        setSelectedOptionId('')
        setIsAnswerSubmitted(false)
      }
    } else {
      handleFinishQuiz(false)
    }
  }

  if (!bank) {
    return (
      <div className="qb-quiz-fullscreen-wrapper">
        <div className="qb-quiz-card">
          <div className="qb-empty-state">
            <ion-icon name="alert-circle-outline" class="qb-empty-icon"></ion-icon>
            <h3>Question Bank Not Found</h3>
            <p>The requested question bank ID does not exist or has been removed.</p>
            <button type="button" className="btn btn-primary" onClick={handleExitQuiz}>
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

  // Format timer MM:SS
  const formatTimer = (secs) => {
    if (secs === null || secs === undefined) return ''
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isTimerWarning = secondsRemaining !== null && secondsRemaining <= 300 // 5 mins
  const isTimerCritical = secondsRemaining !== null && secondsRemaining <= 60 // 1 min

  const studentEmail = auth?.user?.email || 'NxtStep Student'

  return (
    <div className={`qb-quiz-fullscreen-wrapper ${!isPreview && stage === 'in_progress' ? 'qb-quiz-protected' : ''}`}>
      {/* Quiz Top Navigation Bar */}
      <header className="qb-quiz-nav">
        <div className="qb-quiz-nav-left">
          <button
            type="button"
            className="qb-quiz-back-btn"
            onClick={handleExitQuiz}
          >
            <ion-icon name="arrow-back-outline"></ion-icon>
            <span>{isPreview ? 'Close Preview' : 'Back to Portal'}</span>
          </button>
          <span className="qb-quiz-subject-tag">{bank.subject || 'AP Biology'}</span>
        </div>

        {/* Center: Live Countdown Timer */}
        {stage === 'in_progress' && secondsRemaining !== null && (
          <div className={`qb-countdown-pill ${isTimerCritical ? 'critical' : isTimerWarning ? 'warning' : ''}`}>
            <ion-icon name="timer-outline"></ion-icon>
            <span className="font-mono">{formatTimer(secondsRemaining)}</span>
          </div>
        )}

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
          <ThemeToggle theme={theme} toggleTheme={handleToggleTheme} />
        </div>
      </header>

      {/* Pillar 2: Proctored Fullscreen Security Blocker Overlay */}
      {stage === 'in_progress' && isFullscreenBlocked && !isPreview && (
        <div className="qb-fullscreen-blocker-overlay">
          <div className="qb-fullscreen-blocker-card">
            <div className="qb-blocker-icon-pulse">
              <ion-icon name="scan-outline"></ion-icon>
            </div>
            <h2>Fullscreen Mode Required</h2>
            <p>
              Quiz view is locked. You must maintain fullscreen mode and an unminimized window during this proctored test.
            </p>
            <div className="qb-blocker-warning-tag">
              <ion-icon name="warning-outline"></ion-icon>
              <span>Exiting fullscreen or shrinking the screen is recorded on your official test attempt.</span>
            </div>
            <button
              type="button"
              className="btn btn-primary qb-blocker-resume-btn"
              onClick={enterFullscreen}
            >
              <ion-icon name="expand-outline"></ion-icon>
              <span>Return to Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Protection 3: Screen Obscured Shield on Window Blur / Tab Switch */}
      {stage === 'in_progress' && isScreenObscured && !isPreview && (
        <div
          className="qb-screen-obscured-overlay"
          onClick={() => setIsScreenObscured(false)}
          title="Click to resume quiz"
        >
          <ion-icon name="shield-half-outline"></ion-icon>
          <h3>Security Shield Active</h3>
          <p>
            Quiz questions are hidden while your browser window or tab is not active. Click anywhere to resume practicing.
          </p>
        </div>
      )}

      {/* Main Container */}
      <main className={`qb-quiz-main-container${stage === 'in_progress' && isFullscreenBlocked && !isPreview ? ' qb-content-blurred' : ''}`}>
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
        {/* VIEW: QUIZ ENDING WINDOW EXPIRED (Pillar 1: 3h Auto-Purge)*/}
        {/* ========================================================= */}
        {stage === 'quiz_expired' && (
          <div className="qb-quiz-card text-center">
            <div className="qb-card-icon-hero danger">
              <ion-icon name="hourglass-outline"></ion-icon>
            </div>
            <h2 className="qb-hero-title">Quiz Ending Window Expired</h2>
            <p className="qb-hero-desc">
              The <strong>{bank.settings?.quizEndingHours || 3}-hour ending window</strong> for <em>&ldquo;{bank.title}&rdquo;</em> has expired.
            </p>
            <div className="qb-info-banner" style={{ textAlign: 'left', marginBottom: '24px' }}>
              <ion-icon name="trash-bin-outline"></ion-icon>
              <div>
                <strong>Proprietary Question Assets Deleted</strong>
                <p>As per the exam timer policy, all proprietary question screenshots and diagrams have been permanently deleted and cannot be opened.</p>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleExitQuiz}>
              Return to Classroom
            </button>
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
              <button type="button" className="btn btn-primary" onClick={handleExitQuiz}>
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

            <button type="button" className="btn btn-primary" onClick={handleExitQuiz}>
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
                  <strong>
                    {bank.isBackendTest
                      ? `${bank.questionCount || 39} Questions`
                      : `${preparedQuestions.length} Questions`}
                  </strong>
                  <span>Interactive multiple choice questions with comprehensive explanations.</span>
                </div>
              </div>

              {/* Pillar 1: Dual Timings (Attempt Duration + Ending/Auto-Delete Window) */}
              <div className="qb-rule-item">
                <ion-icon name="timer-outline"></ion-icon>
                <div>
                  <strong>Quiz Timing 1: {bank.settings?.timeLimitMinutes ? `${bank.settings.timeLimitMinutes} Minutes Duration` : 'Untimed Attempt'}</strong>
                  <span>{bank.settings?.timeLimitMinutes ? 'A countdown timer will run during the quiz and auto-submits when time expires.' : 'Take your time to complete all questions.'}</span>
                </div>
              </div>

              <div className="qb-rule-item">
                <ion-icon name="hourglass-outline"></ion-icon>
                <div>
                  <strong>Quiz Timing 2: {bank.settings?.quizEndingHours || 3}-Hour Auto-Delete Window</strong>
                  <span>Proprietary question screenshots and diagrams are permanently auto-deleted once this 3-hour window ends.</span>
                </div>
              </div>

              {/* Pillar 2: Proctored Fullscreen Lockdown */}
              <div className="qb-rule-item highlight-warn">
                <ion-icon name="scan-outline"></ion-icon>
                <div>
                  <strong>Proctored Fullscreen Mode</strong>
                  <span>Quiz starts in fullscreen on desktop and mobile. Minimizing or shrinking the window will block the question text until restored.</span>
                </div>
              </div>

              {/* Pillar 3: Student Email Result Isolation */}
              <div className="qb-rule-item">
                <ion-icon name="mail-outline"></ion-icon>
                <div>
                  <strong>Grade Destination: {isPreview ? 'Teacher Preview' : auth?.user?.email}</strong>
                  <span>Your test score and audit marks will be strictly saved and partitioned under your student email.</span>
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
                disabled={isStartingAttempt || (!bank.isBackendTest && preparedQuestions.length === 0)}
              >
                <span>
                  {isStartingAttempt
                    ? 'Starting Proctored Quiz...'
                    : 'Start Proctored Fullscreen Quiz'}
                </span>
                <ion-icon name="expand-outline"></ion-icon>
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

            {/* Question Topic & Category Pill */}
            {currentQ.topic && (
              <div className="qb-question-topic-pill">
                <ion-icon name="bookmarks-outline"></ion-icon>
                <span>{currentQ.topic}</span>
              </div>
            )}

            {/* Ephemeral Question Diagram / Stitched Slide Screenshot */}
            {(currentQ.image || currentQ.imageUrl) && (
              <div className="qb-diagram-section slide-deck-diagram">
                <WatermarkedDiagramCanvas
                  src={createEphemeralBlob(resolveAssetUrl(currentQ.image || currentQ.imageUrl))}
                  alt={`Question ${currentIndex + 1} Diagram`}
                  watermarkText={!isPreview ? (auth?.user?.email || studentEmail) : ''}
                  maxWidth={820}
                />
              </div>
            )}

            {/* Ephemeral Question Choices Slide Screenshot (if separate choices slide) */}
            {currentQ.choicesImage && (
              <div className="qb-diagram-section slide-deck-diagram" style={{ marginTop: '14px' }}>
                <WatermarkedDiagramCanvas
                  src={createEphemeralBlob(resolveAssetUrl(currentQ.choicesImage))}
                  alt={`Question ${currentIndex + 1} Choices`}
                  watermarkText={!isPreview ? (auth?.user?.email || studentEmail) : ''}
                  maxWidth={820}
                />
              </div>
            )}

            {/* If NOT a slide deck and no choices image, display text prompt */}
            {!bank.isSlideDeck && !currentQ.choicesImage && currentQ.question && (
              <h2 className="qb-active-question-prompt">{currentQ.question}</h2>
            )}

            {/* Multiple Choice Options Selector */}
            <div className={bank.isSlideDeck || currentQ.choicesImage || currentQ.image ? 'qb-slide-choice-grid' : 'qb-quiz-options-group'}>
              {currentQ.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id
                const isCorrectOption = currentQ.correctOption
                  ? opt.id.toUpperCase() === currentQ.correctOption.toUpperCase()
                  : false

                let optClass = bank.isSlideDeck || currentQ.choicesImage || currentQ.image ? 'qb-slide-choice-btn' : 'qb-quiz-option-button'
                if (isSelected) optClass += ' selected'
                if (isAnswerSubmitted) {
                  optClass += ' locked'
                  if (currentQ.correctOption) {
                    if (isCorrectOption) {
                      optClass += ' option-revealed-correct'
                    } else if (isSelected && !isCorrectOption) {
                      optClass += ' option-revealed-wrong'
                    }
                  } else if (isSelected) {
                    optClass += ' selected'
                  }
                }

                // If choices are displayed visually on screenshot, display clean "Choice A", "Choice B", etc.
                const hasDetailedText =
                  opt.text &&
                  opt.text.trim().length > 0 &&
                  opt.text !== `Option ${opt.id}` &&
                  opt.text !== opt.id
                const displayLabel =
                  hasDetailedText && !currentQ.choicesImage ? opt.text : `Choice ${opt.id}`

                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={optClass}
                    onClick={() => handleSelectOption(opt.id)}
                    disabled={isAnswerSubmitted || isSubmittingAnswer}
                  >
                    <span className="qb-opt-letter-circle">{opt.id}</span>
                    <span className="qb-opt-text-body" style={{ fontWeight: 600 }}>{displayLabel}</span>
                    {isAnswerSubmitted && currentQ.correctOption && isCorrectOption && (
                      <ion-icon name="checkmark-circle" class="qb-opt-feedback-icon correct"></ion-icon>
                    )}
                    {isAnswerSubmitted && currentQ.correctOption && isSelected && !isCorrectOption && (
                      <ion-icon name="close-circle" class="qb-opt-feedback-icon wrong"></ion-icon>
                    )}
                    {isAnswerSubmitted && !currentQ.correctOption && isSelected && (
                      <ion-icon name="checkmark-circle-outline" class="qb-opt-feedback-icon correct"></ion-icon>
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
                  disabled={!selectedOptionId || isSubmittingAnswer}
                >
                  {isSubmittingAnswer ? (
                    <>
                      <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                      <span>Checking Answer...</span>
                    </>
                  ) : (
                    <>
                      <ion-icon name="checkmark-outline"></ion-icon>
                      <span>Submit Answer</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Instant Feedback Banner & Educational Reason */
              <div className="qb-feedback-reveal-panel">
                {currentQ.correctOption ? (
                  selectedOptionId.toUpperCase() === currentQ.correctOption.toUpperCase() ? (
                    <div className="qb-feedback-banner correct">
                      <div className="qb-banner-header">
                        <ion-icon name="checkmark-circle"></ion-icon>
                        <strong>✓ Correct!</strong>
                      </div>
                      <p>
                        Your answer: <strong>Choice {selectedOptionId}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="qb-feedback-banner incorrect">
                      <div className="qb-banner-header">
                        <ion-icon name="close-circle"></ion-icon>
                        <strong>✗ Incorrect</strong>
                      </div>
                      <p>
                        Your answer: <strong>Choice {selectedOptionId}</strong>
                      </p>
                      <p className="qb-correct-highlight">
                        Correct answer: <strong>Choice {currentQ.correctOption}</strong>
                      </p>
                    </div>
                  )
                ) : (
                  <div className="qb-feedback-banner correct" style={{ borderColor: '#ffb347', background: 'rgba(255, 179, 71, 0.1)' }}>
                    <div className="qb-banner-header" style={{ color: '#ffb347' }}>
                      <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                      <strong>Answer Saved &amp; Locked</strong>
                    </div>
                    <p>
                      Selected: <strong>Choice {selectedOptionId}</strong>. Answer synced with teacher grading portal.
                    </p>
                  </div>
                )}

                {/* Detailed Educational Reason & Visual Solution */}
                <div className="qb-quiz-explanation-box">
                  <div className="qb-exp-label">
                    <ion-icon name="bulb-outline"></ion-icon>
                    <span>Reason &amp; Solution Rationale:</span>
                  </div>

                  {/* Stitched Explanation & Distractor Slide */}
                  {currentQ.explanationImage && (
                    <div className="qb-explanation-diagram-wrapper" style={{ margin: '14px 0' }}>
                      <WatermarkedDiagramCanvas
                        src={createEphemeralBlob(resolveAssetUrl(currentQ.explanationImage))}
                        alt={`Explanation for Question ${currentIndex + 1}`}
                        watermarkText={!isPreview ? (auth?.user?.email || studentEmail) : ''}
                        maxWidth={820}
                      />
                    </div>
                  )}

                  <p className="qb-exp-content" style={{ whiteSpace: 'pre-line' }}>
                    {currentQ.explanation ||
                      (currentQ.correctOption
                        ? `Choice ${currentQ.correctOption} is the correct verified answer for this question.`
                        : 'Review this question solution with your instructor.')}
                  </p>
                </div>

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
        {/* VIEW 6: FINAL SCORECARD RESULT (DIAGRAMS PURGED)          */}
        {/* ========================================================= */}
        {stage === 'completed' && (
          <div className="qb-quiz-card text-center">
            <div className="qb-card-icon-hero success">
              <ion-icon name="ribbon-outline"></ion-icon>
            </div>
            <h2 className="qb-hero-title">Quiz Completed!</h2>

            {timedOutNotice ? (
              <div className="qb-alert-toast" style={{ justifyContent: 'center', marginBottom: '16px' }}>
                <ion-icon name="time-outline"></ion-icon>
                <span>Time expired! Your completed answers have been auto-submitted.</span>
              </div>
            ) : (
              <p className="qb-hero-desc">Great job on finishing <em>&ldquo;{bank.title}&rdquo;</em>.</p>
            )}

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

              {/* Pillar 3: Student Email Result Isolation Record */}
              <div className="qb-email-record-chip">
                <ion-icon name="mail-outline"></ion-icon>
                <span>Result permanently saved to: <strong>{auth?.user?.email || studentEmail}</strong></span>
              </div>

              {/* Pillar 2: Proctored Fullscreen Integrity Status */}
              <div className={`qb-integrity-status-pill ${fullscreenViolations === 0 ? 'clean' : 'warning'}`}>
                <ion-icon name={fullscreenViolations === 0 ? 'shield-checkmark-outline' : 'warning-outline'}></ion-icon>
                <span>Fullscreen Integrity: {fullscreenViolations === 0 ? 'Proctored Clean (0 exits)' : `${fullscreenViolations} window exit(s) recorded`}</span>
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

            {/* Ephemeral Notice */}
            <div className="qb-ephemeral-purged-banner">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
              <span>Security notice: Question diagrams were loaded ephemerally and have been permanently purged from browser memory.</span>
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
              onClick={handleExitQuiz}
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
