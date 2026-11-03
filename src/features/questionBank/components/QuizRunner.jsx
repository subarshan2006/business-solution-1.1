import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
import Logo from '../../../components/Logo'
import {
  studentApi,
  questionReviewApi,
  testManagementApi,
  getStoredSessionUser,
} from '../../../services/jivanautApi'
import { ProctoringGuard } from '../../../lib/proctoringGuard'

function QuizRunner({
  bankId: propBankId = null,
  isPreview = false,
  onClosePreview = null,
  initialViewResult = false,
  initialIsRetest = false,
}) {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location?.search || '')
  const effectiveViewResult = initialViewResult || searchParams.get('viewResult') === 'true'
  const effectiveIsRetest = initialIsRetest || searchParams.get('retest') === 'true'
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
  const [bankLoading, setBankLoading] = useState(true)
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
  const [isTerminated, setIsTerminated] = useState(false)
  const guardRef = useRef(null)
  const currentIndexRef = useRef(currentIndex)

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    if (isTerminated) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setFinalScore(0)
    }
  }, [isTerminated])

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
      if (guardRef.current) {
        guardRef.current.stop()
        guardRef.current = null
      }
      purgeAllEphemeralImages()
      exitFullscreenSafe()
      document.body.classList.remove('modal-open', 'quiz-open')
    }
  }, [exitFullscreenSafe])

  const handleExitQuiz = useCallback(() => {
    if (guardRef.current) {
      guardRef.current.stop()
      guardRef.current = null
    }
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
    if (!activeBankId) {
      setBankLoading(false)
      return
    }

    setBankLoading(true)

    // If teacher preview mode: ALWAYS fetch fresh preview directly from backend for live signed image URLs
    if (isPreview) {
      testManagementApi
        .getTeacherTestPreview(activeBankId)
        .then((preview) => {
          if (preview && preview.questions) {
            const mapped = (preview.questions || []).map((tq, idx) => {
              const q = tq.question || tq
              const qImages = q.images || []
              const questionImg =
                q.image ||
                q.imageUrl ||
                q.questionImage ||
                qImages.find((img) => img.role === 'QUESTION')?.imageUrl ||
                qImages[0]?.imageUrl ||
                null
              const choicesImg =
                q.choicesImage ||
                q.choicesImageUrl ||
                qImages.find((img) => img.role === 'CHOICES' || img.role === 'OPTIONS')?.imageUrl ||
                null
              const explanationImg =
                q.explanationImage ||
                q.explanationImageUrl ||
                qImages.find((img) => img.role === 'EXPLANATION')?.imageUrl ||
                null

              return {
                id: `Q${String(idx + 1).padStart(3, '0')}`,
                rawQuestionId: q.questionId || q.id,
                testQuestionId: q.testQuestionId || null,
                question: q.questionText,
                options: (q.options || []).map((o) => ({
                  id: o.label,
                  text: o.text || '',
                  imageUrl: o.imageUrl || null,
                })),
                correctOption: q.correctOption || '',
                explanation: q.explanation || '',
                image: questionImg,
                choicesImage: choicesImg,
                explanationImage: explanationImg,
                images: qImages,
                confidenceScores: q.confidenceScores || null,
                needsReview: q.needsReview || false,
              }
            })
            const previewBank = {
              id: preview.testId || activeBankId,
              title: preview.title || 'Quiz Preview',
              description: preview.description || '',
              subject: preview.subject || 'AP Biology',
              published: true,
              isPreview: true,
              questions: mapped,
              questionCount: mapped.length,
              settings: {
                randomizeQuestions: false,
                randomizeOptions: false,
                oneAttempt: true,
                showExplanation: true,
                timeLimitMinutes: preview.attemptDurationMinutes || 60,
              },
            }
            setBank(previewBank)
            setBankLoading(false)
            return
          }
          setBankLoading(false)
        })
        .catch((err) => {
          console.warn('Teacher test preview fetch note:', err)
          const b = getQuestionBankById(activeBankId)
          // Fallback to questionReviewApi listQuestions
          const targetBankId = b?.backendBankId || activeBankId
          questionReviewApi
            .listQuestions(targetBankId, { limit: 100 })
            .then((res) => {
              const list = res.data || []
              if (list.length > 0) {
                const mapped = list.map((bq, idx) => {
                  const qImages = bq.images || []
                  const questionImg =
                    bq.image ||
                    bq.imageUrl ||
                    bq.questionImage ||
                    qImages.find((img) => img.role === 'QUESTION')?.imageUrl ||
                    qImages[0]?.imageUrl ||
                    null
                  const choicesImg =
                    bq.choicesImage ||
                    bq.choicesImageUrl ||
                    qImages.find((img) => img.role === 'CHOICES' || img.role === 'OPTIONS')?.imageUrl ||
                    null
                  const explanationImg =
                    bq.explanationImage ||
                    bq.explanationImageUrl ||
                    qImages.find((img) => img.role === 'EXPLANATION')?.imageUrl ||
                    null

                  return {
                    id: `Q${String(idx + 1).padStart(3, '0')}`,
                    rawQuestionId: bq.id,
                    question: bq.questionText,
                    options: (bq.options || []).map((o) => ({
                      id: o.label,
                      text: o.text || '',
                      imageUrl: o.imageUrl || null,
                    })),
                    correctOption: bq.correctOption || '',
                    explanation: bq.explanation || '',
                    image: questionImg,
                    choicesImage: choicesImg,
                    explanationImage: explanationImg,
                    images: qImages,
                    confidenceScores: bq.confidenceScores || null,
                    needsReview: bq.needsReview || false,
                  }
                })
                const fallbackBank = {
                  id: activeBankId,
                  title: b?.title || 'Quiz Preview',
                  description: b?.description || '',
                  subject: b?.subject || 'AP Biology',
                  published: true,
                  isPreview: true,
                  questions: mapped,
                  questionCount: mapped.length,
                  settings: b?.settings || {
                    randomizeQuestions: false,
                    randomizeOptions: false,
                    oneAttempt: true,
                    showExplanation: true,
                    timeLimitMinutes: 20,
                  },
                }
                setBank(fallbackBank)
                setBankLoading(false)
              } else if (b && Array.isArray(b.questions) && b.questions.length > 0) {
                setBank(b)
                setBankLoading(false)
              } else {
                setBankLoading(false)
              }
            })
            .catch((reviewErr) => {
              console.warn('Teacher questionReviewApi fallback note:', reviewErr)
              if (b && Array.isArray(b.questions) && b.questions.length > 0) {
                setBank(b)
              }
              setBankLoading(false)
            })
        })
      return
    }

    // Student mode
    const b = getQuestionBankById(activeBankId)
    const isBackendId = Boolean(b?.backendBankId) || !activeBankId.startsWith('qb_')

    if (b && !isBackendId) {
      setBank(b)
      setBankLoading(false)
    } else {
      studentApi
        .getAssignedTests()
        .then(async (tests) => {
          let found = Array.isArray(tests)
            ? tests.find((t) => t.testId === activeBankId || t.assignmentId === activeBankId || (b && t.title === b.title))
            : null

          if (!found) {
            try {
              const detail = await studentApi.getTestDetail(activeBankId)
              if (detail) found = detail
            } catch (detailErr) {
              // Not found in detail
            }
          }

          if (found) {
            const isSingle =
              found.isSingleAttempt !== undefined
                ? Boolean(found.isSingleAttempt)
                : (found.maxAttempts === 1 && !found.canRetest && !found.allowRetest)

            setBank({
              id: found.testId || found.id || activeBankId,
              title: found.title,
              description: found.description,
              subject: found.subject || 'AP Biology',
              published: true,
              isBackendTest: true,
              questionCount: found.questionCount || (b?.questionCount || 37),
              teacher: found.teacher,
              authorizedStudents: auth?.user?.email ? [auth.user.email] : [],
              settings: {
                timeLimitMinutes: found.attemptDurationMinutes || 60,
                oneAttempt: isSingle,
                showExplanation: true,
              },
              questions: [],
              studentStatus: found.studentStatus || null,
              isSingleAttempt: isSingle,
              canViewResult: found.canViewResult ?? (found.studentStatus === 'SUBMITTED' || found.studentStatus === 'CAN_RETEST'),
              canRetest: found.canRetest ?? (typeof found.remainingAttempts === 'number' ? found.remainingAttempts > 0 : !isSingle),
              maxAttempts: found.maxAttempts ?? (isSingle ? 1 : 10),
              allowRetest: found.allowRetest ?? (!isSingle),
              remainingAttempts: found.remainingAttempts,
              completedAttempts: found.completedAttempts,
              latestScore: found.latestScore,
              latestPercentage: found.latestPercentage,
            })
            setBankLoading(false)
          } else if (b) {
            setBank({
              ...b,
              isBackendTest: true,
              studentStatus: b.studentStatus || null,
              isSingleAttempt: b.isSingleAttempt ?? b.settings?.oneAttempt ?? true,
              canViewResult: b.canViewResult ?? true,
              canRetest: b.canRetest ?? false,
            })
            setBankLoading(false)
          } else {
            // Resiliency fallback: Check for active student attempt by testId before marking as not found
            studentApi
              .getActiveAttempt(activeBankId)
              .then((activeAtt) => {
                if (activeAtt) {
                  setBank({
                    id: activeBankId,
                    title: activeAtt.title || 'Proctored Quiz',
                    description: activeAtt.description || '',
                    subject: activeAtt.subject || 'AP Biology',
                    published: true,
                    isBackendTest: true,
                    questionCount: activeAtt.questions?.length || 37,
                    settings: {
                      timeLimitMinutes: 60,
                      oneAttempt: true,
                      showExplanation: true,
                    },
                    questions: [],
                    studentStatus: 'STARTED',
                    isSingleAttempt: true,
                    canViewResult: false,
                    canRetest: false,
                  })
                }
                setBankLoading(false)
              })
              .catch(() => {
                setBankLoading(false)
              })
          }
        })
        .catch((err) => {
          console.warn('Failed to load backend test details:', err)
          if (b) setBank({ ...b, isBackendTest: true })
          setBankLoading(false)
        })
    }
  }, [activeBankId, auth, isPreview])

  // 3. Perform Authorization Gate check & Pillar 1 Quiz Expiry
  useEffect(() => {
    if (!bank) return

    // If teacher preview mode
    if (isPreview) {
      const qs = prepareQuizQuestions(
        (bank.questions || []).map((q) => {
          const qImages = q.images || []
          const questionImg =
            q.image ||
            q.imageUrl ||
            q.questionImage ||
            qImages.find((img) => img.role === 'QUESTION')?.imageUrl ||
            qImages[0]?.imageUrl ||
            null
          const choicesImg =
            q.choicesImage ||
            q.choicesImageUrl ||
            qImages.find((img) => img.role === 'CHOICES' || img.role === 'OPTIONS')?.imageUrl ||
            null
          const explanationImg =
            q.explanationImage ||
            q.explanationImageUrl ||
            qImages.find((img) => img.role === 'EXPLANATION')?.imageUrl ||
            null

          return {
            ...q,
            image: questionImg,
            choicesImage: choicesImg,
            explanationImage: explanationImg,
          }
        }),
        bank.settings || {},
      )
      setPreparedQuestions(qs)
      setStage('start_screen')
      return
    }

    // Direct result view requested OR already submitted (and not an explicit retest)
    if (!isPreview && (effectiveViewResult || (bank.studentStatus === 'SUBMITTED' && !effectiveIsRetest))) {
      const targetTestId = bank.id || activeBankId
      setBankLoading(true)
      studentApi
        .getTestResult(targetTestId)
        .then((result) => {
          if (result) {
            setFinalScore(result.score ?? 0)
            setCompletedAttemptData(result)

            // Overwrite stale local storage with the real backend result
            const effectiveEmail = auth?.user?.email || getStoredSessionUser()?.email || ''
            if (effectiveEmail) {
              recordCompletedAttempt(targetTestId, effectiveEmail, {
                score: result.score ?? 0,
                totalQuestions: result.totalQuestions || (result.questions?.length ?? 5),
                percentage: result.percentage ?? 0,
                correctAnswers: result.correctAnswers ?? result.score ?? 0,
                wrongAnswers: result.wrongAnswers ?? 0,
                answers: (result.questions || []).map((q) => ({
                  questionId: q.attemptQuestionId,
                  selectedOption: q.selectedOption,
                  correctOption: q.correctOption,
                  isCorrect: q.isCorrect,
                  explanation: q.explanation,
                })),
                studentName: auth?.user?.name || effectiveEmail,
              })
            }

            if (Array.isArray(result.questions) && result.questions.length > 0) {
              const mapped = result.questions.map((q, idx) => ({
                id: q.attemptQuestionId || `Q${String(idx + 1).padStart(3, '0')}`,
                question: q.questionText,
                options: (q.options || []).map((o) => ({
                  id: o.label || o.id,
                  text: o.text || '',
                  imageUrl: o.imageUrl || null,
                })),
                selectedOption: q.selectedOption || null,
                correctOption: q.correctOption || null,
                isCorrect: q.isCorrect ?? null,
                explanation: q.explanation || '',
                explanationImage: q.explanationImageUrl || q.explanationImage || null,
                image: q.image || q.imageUrl || null,
                choicesImage: q.choicesImage || null,
              }))
              setPreparedQuestions(mapped)
              setStudentAnswers(
                mapped.map((q) => ({
                  questionId: q.id,
                  selectedOption: q.selectedOption,
                  correctOption: q.correctOption,
                  isCorrect: q.isCorrect,
                  explanation: q.explanation,
                }))
              )
            }
            setStage('completed')
          } else {
            setStage('start_screen')
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch test result, checking local attempt:', err)
          const effectiveEmail = auth?.user?.email || getStoredSessionUser()?.email || ''
          const priorAttempt = getStudentAttempt(targetTestId, effectiveEmail)
          if (priorAttempt && priorAttempt.status === 'completed') {
            setCompletedAttemptData(priorAttempt)
            setFinalScore(priorAttempt.score ?? 0)
            setStage('completed')
          } else {
            setStage('start_screen')
          }
        })
        .finally(() => {
          setBankLoading(false)
        })
      return
    }

    // If backend test, student authorization is already verified and managed on the server
    if (bank.isBackendTest) {
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
      if (guardRef.current) {
        guardRef.current.stop()
        guardRef.current = null
      }

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
        // Dual-write: Always record locally partitioned by student email with proctoring stats for zero-latency UI updates
        const attemptPayload = {
          score: correctCount,
          totalQuestions: preparedQuestions.length,
          answers: studentAnswers,
          studentName: auth?.user?.name || effectiveEmail,
          fullscreenViolations,
        }
        const saved = recordCompletedAttempt(bank.id, effectiveEmail, attemptPayload)
        if (bank.testId && bank.testId !== bank.id) {
          recordCompletedAttempt(bank.testId, effectiveEmail, attemptPayload)
        }
        if (bank.backendBankId && bank.backendBankId !== bank.id) {
          recordCompletedAttempt(bank.backendBankId, effectiveEmail, attemptPayload)
        }
        setCompletedAttemptData(saved)

        if (bank.isBackendTest) {
          const answersPayload = studentAnswers.map((a) => ({
            attemptQuestionId: a.questionId,
            selectedOption: a.selectedOption,
          }))
          studentApi
            .submitAttempt(bank.id, answersPayload)
            .then((result) => {
              if (result) {
                setFinalScore(result.score ?? correctCount)
                setCompletedAttemptData({
                  score: result.score ?? correctCount,
                  totalQuestions: result.totalQuestions || preparedQuestions.length,
                  percentage: result.percentage ?? Math.round((correctCount / preparedQuestions.length) * 100),
                  timeTakenSeconds: result.timeTakenSeconds,
                  fullscreenViolations,
                  correctAnswers: result.correctAnswers ?? correctCount,
                  wrongAnswers: result.wrongAnswers ?? (preparedQuestions.length - correctCount),
                  questions: result.questions || null,
                })
              }
            })
            .catch((err) => {
              console.warn('Backend attempt submission warning:', err)
            })
        }
      }

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

  // Cross-Platform Proctoring & Black-Screen Security Guard (Pillar 2)
  useEffect(() => {
    if (stage !== 'in_progress' || isPreview) {
      if (guardRef.current) {
        guardRef.current.stop()
        guardRef.current = null
      }
      return
    }

    const testId = bank?.testId || bank?.id || activeBankId
    const apiBaseUrl =
      (import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
      (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_BASE_URL)) ||
      ''

    const guard = new ProctoringGuard({
      testId: String(testId),
      apiBaseUrl,
      getActiveQuestionNumber: () => currentIndexRef.current + 1,
      onViolation: (v) => {
        console.warn('Proctoring violation:', v)
        if (typeof v.minimizeCount === 'number') {
          setFullscreenViolations(v.minimizeCount)
        }
        if (v.minimizeCount && v.minimizeCount >= 3) {
          // Exam is terminated by backend with 0 marks
          setIsTerminated(true)
        }
      },
      onBlackout: () => {
        setIsScreenObscured(true)
      },
      onRestore: () => {
        setIsScreenObscured(false)
      },
    })

    guardRef.current = guard
    guard.start()

    return () => {
      if (guardRef.current) {
        guardRef.current.stop()
        guardRef.current = null
      }
    }
  }, [stage, isPreview, bank?.id, bank?.testId, activeBankId])

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
    setIsTerminated(false)

    try {
      if (bank?.isBackendTest && !isPreview) {
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

  // Select Option and immediately trigger instant live feedback (Green/Red)
  const handleSelectOption = async (optId) => {
    if (isAnswerSubmitted || isSubmittingAnswer || isTerminated) return // Locked!
    setSelectedOptionId(optId)
    await executeCheckAnswer(optId)
  }

  // Execute answer validation, locking, and instant educational feedback
  const executeCheckAnswer = async (optIdToVerify) => {
    const selectedOpt = optIdToVerify || selectedOptionId
    if (!selectedOpt || isAnswerSubmitted || isSubmittingAnswer || isTerminated) return

    const currentQ = preparedQuestions[currentIndex]
    if (!currentQ) return

    setIsSubmittingAnswer(true)

    let isCorrect = currentQ.correctOption
      ? selectedOpt.toUpperCase() === currentQ.correctOption.toUpperCase()
      : false
    let correctOption = currentQ.correctOption || ''
    let explanation = currentQ.explanation || ''
    let explanationImage = currentQ.explanationImage || null

    // If teacher preview, check answer interactively via teacher test preview check API
    if (isPreview && bank?.id) {
      try {
        const targetQId = currentQ.rawQuestionId || currentQ.questionId || currentQ.id
        const feedback = await testManagementApi.checkPreviewAnswer(bank.id, targetQId, selectedOpt)
        if (feedback) {
          isCorrect = Boolean(feedback.isCorrect)
          correctOption = feedback.correctOption || ''
          explanation = feedback.explanation || ''
          explanationImage =
            feedback.explanationImageUrl || currentQ.explanationImage || null
        }
      } catch (previewErr) {
        console.warn('Teacher preview check answer note:', previewErr)
      }
    } else if (bank?.isBackendTest) {
      try {
        const feedback = await studentApi.checkPracticeAnswer(bank.id, currentQ.id, selectedOpt)
        if (feedback) {
          isCorrect = Boolean(feedback.isCorrect)
          correctOption = feedback.correctOption || ''
          explanation = feedback.explanation || ''
          explanationImage =
            feedback.explanationImageUrl || currentQ.explanationImage || null
        }
      } catch (err) {
        console.warn('Backend practice check error:', err)
        studentApi
          .saveAnswers(bank.id, [
            {
              attemptQuestionId: currentQ.id,
              selectedOption: selectedOpt,
            },
          ])
          .catch(() => {})
      }
    }

    // Update current question in preparedQuestions so the option buttons & explanation panel reveal the answer & rationale
    setPreparedQuestions((prev) => {
      const next = [...prev]
      if (next[currentIndex]) {
        next[currentIndex] = {
          ...next[currentIndex],
          correctOption,
          explanation,
          explanationImage,
          isCorrect,
          selectedOption: selectedOpt,
        }
      }
      return next
    })

    const answerRecord = {
      questionId: currentQ.id,
      selectedOption: selectedOpt,
      correctOption,
      isCorrect,
      explanation,
    }

    setStudentAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== currentQ.id)
      return [...filtered, answerRecord]
    })
    setIsAnswerSubmitted(true)
    setIsSubmittingAnswer(false)
  }

  // Fallback submit handler
  const handleSubmitAnswer = async () => {
    await executeCheckAnswer(selectedOptionId)
  }

  // Next Question or Finish Quiz
  const handleNextQuestion = () => {
    if (isTerminated) return
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
      if (guardRef.current) {
        guardRef.current.stop()
        guardRef.current = null
      }
      handleFinishQuiz(false)
    }
  }

  if (!bank || isStartingAttempt) {
    if (bankLoading || isStartingAttempt) {
      return (
        <div
          className="qb-quiz-fullscreen-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100%',
          }}
        >
          <div
            className="qb-quiz-card text-center"
            style={{
              maxWidth: '440px',
              width: '90%',
              padding: '48px 28px',
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '88px',
                height: '88px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '22px',
              }}
            >
              {/* Rotating glowing accent border ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  borderRadius: '24px',
                  border: '3px solid transparent',
                  borderTopColor: 'var(--color-brand-blue, #47afe5)',
                  borderRightColor: 'var(--mint-hi, #90a955)',
                  animation: 'spinSync 1.2s linear infinite',
                }}
              />
              {/* Brand Logo in center */}
              <Logo variant="mark" size={64} />
            </div>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
                color: 'var(--text, #FFFFFF)',
              }}
            >
              {isStartingAttempt
                ? isPreview
                  ? 'Starting Preview...'
                  : bank?.studentStatus === 'STARTED'
                  ? 'Resuming Proctored Quiz...'
                  : 'Starting Proctored Quiz...'
                : 'Loading Quiz...'}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted, #94A3B8)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {isStartingAttempt
                ? bank?.studentStatus === 'STARTED'
                  ? 'Retrieving your active attempt and answers...'
                  : 'Synchronizing questions and entering secure environment...'
                : isPreview
                ? 'Retrieving questions, options, and diagrams...'
                : 'Retrieving your secure test session and questions...'}
            </p>
          </div>
        </div>
      )
    }

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

  const studentEmail = auth?.user?.email || 'Jivanaut Student'

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
                disabled={isStartingAttempt || (!bank.isBackendTest && !isPreview && preparedQuestions.length === 0)}
              >
                <span>
                  {isStartingAttempt
                    ? isPreview
                      ? 'Starting Preview...'
                      : bank?.studentStatus === 'STARTED'
                      ? 'Resuming Proctored Quiz...'
                      : 'Starting Proctored Quiz...'
                    : isPreview
                    ? 'Start Quiz Preview'
                    : bank?.studentStatus === 'STARTED'
                    ? 'Resume Proctored Fullscreen Quiz'
                    : 'Start Proctored Fullscreen Quiz'}
                </span>
                <ion-icon name={isPreview ? 'play-outline' : 'expand-outline'}></ion-icon>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: INTERACTIVE QUIZ IN PROGRESS                     */}
        {/* ========================================================= */}
        {stage === 'in_progress' && isTerminated && (
          <div className="qb-quiz-card text-center" style={{ border: '2px solid #ef4444' }}>
            <div className="qb-card-icon-hero" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <ion-icon name="ban-outline"></ion-icon>
            </div>
            <h2 className="qb-hero-title" style={{ color: '#ef4444' }}>EXAM TERMINATED</h2>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '20px', margin: '20px 0' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', marginBottom: '8px' }}>
                SCORE: 0 MARKS
              </div>
              <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                You have reached 3 screen switch violations. Your exam attempt has been automatically closed and marked with 0 marks.
              </p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={handleExitQuiz}>
              Return to Classroom
            </button>
          </div>
        )}

        {stage === 'in_progress' && !isTerminated && currentQ && (
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
                  watermarkText=""
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
                  watermarkText=""
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
                        watermarkText=""
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
        {/* VIEW 6: FINAL SCORECARD RESULT & SOLUTIONS REVIEW         */}
        {/* ========================================================= */}
        {stage === 'completed' && (() => {
          const isSingleAttemptMode =
            bank?.isSingleAttempt === true ||
            (bank?.isSingleAttempt === undefined &&
              (bank?.maxAttempts === 1 || bank?.settings?.oneAttempt === true) &&
              !bank?.allowRetest &&
              !bank?.canRetest)

          const canRetestMode =
            !isSingleAttemptMode &&
            (bank?.canRetest === true ||
              (typeof bank?.remainingAttempts === 'number' && bank?.remainingAttempts > 0) ||
              bank?.allowRetest === true ||
              (bank?.maxAttempts && bank.maxAttempts > 1))

          const totalQCount = preparedQuestions.length || completedAttemptData?.totalQuestions || 0
          const displayPercentage =
            completedAttemptData?.percentage ??
            (totalQCount > 0 ? Math.round((finalScore / totalQCount) * 100) : 0)

          const correctCount = completedAttemptData?.correctAnswers ?? finalScore
          const wrongCount =
            completedAttemptData?.wrongAnswers ?? (totalQCount > 0 ? Math.max(0, totalQCount - correctCount) : 0)

          return (
            <div className="qb-quiz-card text-center" style={{ maxWidth: '820px' }}>
              <div className="qb-card-icon-hero success">
                <ion-icon name="ribbon-outline"></ion-icon>
              </div>
              <h2 className="qb-hero-title">
                {effectiveViewResult || bank?.studentStatus === 'SUBMITTED'
                  ? 'Test Attempt Results'
                  : 'Quiz Completed!'}
              </h2>

              {timedOutNotice ? (
                <div className="qb-alert-toast" style={{ justifyContent: 'center', marginBottom: '16px' }}>
                  <ion-icon name="time-outline"></ion-icon>
                  <span>Time expired! Your completed answers have been auto-submitted.</span>
                </div>
              ) : (
                <p className="qb-hero-desc">
                  {effectiveViewResult || bank?.studentStatus === 'SUBMITTED'
                    ? `Summary and detailed solution breakdown for "${bank.title}".`
                    : `Great job on finishing "${bank.title}".`}
                </p>
              )}

              <div className="qb-scorecard-box">
                <div className="qb-result-score-big">
                  {finalScore} <span>/ {totalQCount}</span>
                </div>
                <div className="qb-result-percent">
                  {displayPercentage}% Score
                </div>

                <div className="qb-score-breakdown-row">
                  <div className="qb-breakdown-item correct">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <span>{correctCount} Correct</span>
                  </div>
                  <div className="qb-breakdown-item wrong">
                    <ion-icon name="close-circle-outline"></ion-icon>
                    <span>{wrongCount} Incorrect</span>
                  </div>
                </div>

                {/* Pillar 3: Student Email Result Isolation Record */}
                <div className="qb-email-record-chip">
                  <ion-icon name="mail-outline"></ion-icon>
                  <span>Result permanently saved to: <strong>{auth?.user?.email || studentEmail}</strong></span>
                </div>

                {/* Pillar 2: Proctored Fullscreen Integrity Status */}
                <div className={`qb-integrity-status-pill ${fullscreenViolations === 0 ? 'clean' : fullscreenViolations >= 3 ? 'danger' : 'warning'}`}>
                  <ion-icon name={fullscreenViolations === 0 ? 'shield-checkmark-outline' : 'warning-outline'}></ion-icon>
                  <span>Fullscreen Integrity: {fullscreenViolations === 0 ? 'Proctored Clean (0 exits)' : fullscreenViolations >= 3 ? 'Disqualified (3 screen switches - 0 Marks)' : `${fullscreenViolations} window exit(s) recorded`}</span>
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

              {/* Question Solutions & Explanations Review List */}
              {preparedQuestions.length > 0 && (
                <div className="qb-review-section" style={{ textAlign: 'left', marginTop: '32px' }}>
                  <div className="qb-review-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text, #FFF)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ion-icon name="bulb-outline" style={{ color: '#10B981' }}></ion-icon>
                      <span>Question Solutions &amp; Explanations ({preparedQuestions.length})</span>
                    </h3>
                  </div>

                  <div className="qb-review-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {preparedQuestions.map((q, idx) => {
                      const ansRecord = studentAnswers.find((a) => a.questionId === q.id) || q
                      const studentChoice = ansRecord.selectedOption || q.selectedOption || null
                      const correctChoice = q.correctOption || ansRecord.correctOption || null
                      const isQCorrect =
                        ansRecord.isCorrect !== undefined && ansRecord.isCorrect !== null
                          ? ansRecord.isCorrect
                          : studentChoice && correctChoice
                          ? studentChoice.toUpperCase() === correctChoice.toUpperCase()
                          : false

                      return (
                        <div
                          key={q.id || idx}
                          className={`qb-solution-review-card ${isQCorrect ? 'correct' : 'incorrect'}`}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isQCorrect ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                            borderRadius: '12px',
                            padding: '18px 20px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text, #FFF)' }}>
                              Question {idx + 1}
                            </span>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: isQCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isQCorrect ? '#10B981' : '#EF4444',
                              }}
                            >
                              {isQCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
                            </span>
                          </div>

                          {q.question && (
                            <p style={{ fontSize: '14px', color: 'var(--text-1, #E4E4E7)', margin: '0 0 12px', lineHeight: 1.6 }}>
                              {q.question}
                            </p>
                          )}

                          {(q.image || q.imageUrl) && (
                            <div style={{ margin: '12px 0', maxWidth: '100%', overflow: 'hidden', borderRadius: '8px' }}>
                              <img
                                src={resolveAssetUrl(q.image || q.imageUrl)}
                                alt={`Question ${idx + 1}`}
                                style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px' }}
                              />
                            </div>
                          )}

                          {q.choicesImage && (
                            <div style={{ margin: '12px 0', maxWidth: '100%', overflow: 'hidden', borderRadius: '8px' }}>
                              <img
                                src={resolveAssetUrl(q.choicesImage)}
                                alt={`Question ${idx + 1} Choices`}
                                style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px' }}
                              />
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '12px 0', fontSize: '13px' }}>
                            <div
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: isQCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: isQCorrect ? '#10B981' : '#EF4444',
                                border: `1px solid ${isQCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                fontWeight: 500,
                              }}
                            >
                              Your Choice: <strong>Choice {studentChoice || 'None'}</strong>
                            </div>
                            <div
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10B981',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontWeight: 500,
                              }}
                            >
                              Correct Choice: <strong>Choice {correctChoice || '—'}</strong>
                            </div>
                          </div>

                          {(q.explanation || ansRecord.explanation) && (
                            <div
                              style={{
                                marginTop: '14px',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '8px',
                                borderLeft: '4px solid #10B981',
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '12px', color: '#10B981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                <span>Explanation &amp; Solution Rationale</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-2, #A1A1AA)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                {q.explanation || ansRecord.explanation}
                              </p>
                              {(q.explanationImage || ansRecord.explanationImage) && (
                                <div style={{ marginTop: '10px' }}>
                                  <img
                                    src={resolveAssetUrl(q.explanationImage || ansRecord.explanationImage)}
                                    alt={`Explanation for Q${idx + 1}`}
                                    style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '6px' }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Actions: Retest vs Single Attempt */}
              <div style={{ marginTop: '36px' }}>
                {isSingleAttemptMode ? (
                  <div>
                    <div className="qb-info-banner" style={{ marginBottom: '20px', textAlign: 'center', justifyContent: 'center' }}>
                      <ion-icon name="lock-closed-outline"></ion-icon>
                      <span>Single-attempt mode is enabled for this exam. Retakes are not permitted.</span>
                    </div>
                    <button type="button" className="btn btn-primary qb-hero-btn" onClick={handleExitQuiz}>
                      Back to Dashboard
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleExitQuiz} style={{ minWidth: '160px' }}>
                      Back to Dashboard
                    </button>
                    {canRetestMode && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#10B981', borderColor: '#059669', color: '#FFFFFF', minWidth: '160px' }}
                        onClick={() => {
                          setPreparedQuestions([])
                          setStudentAnswers([])
                          setSelectedOptionId('')
                          setIsAnswerSubmitted(false)
                          setCompletedAttemptData(null)
                          setStage('start_screen')
                          handleStartQuiz()
                        }}
                      >
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Take Retest {typeof bank.remainingAttempts === 'number' ? `(${bank.remainingAttempts} left)` : ''}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </main>
    </div>
  )
}

export default QuizRunner
