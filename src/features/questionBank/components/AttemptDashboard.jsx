import { useState, useEffect } from 'react'
import {
  listBankAttempts,
  resetStudentAttempt,
} from '../services/quizAttemptService'
import { testManagementApi, ensureActiveSession } from '../../../services/jivanautApi'

function AttemptDashboard({ bank, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [backendRoster, setBackendRoster] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [retakeConfirmEmail, setRetakeConfirmEmail] = useState(null)
  const [expandedEmail, setExpandedEmail] = useState(null)

  const loadAttempts = async () => {
    // 1. Fetch local storage attempts (checking bank.id, bank.testId, bank.backendBankId)
    const localLists = [
      ...listBankAttempts(bank.id),
      ...(bank.testId ? listBankAttempts(bank.testId) : []),
      ...(bank.backendBankId ? listBankAttempts(bank.backendBankId) : []),
    ]
    const uniqueLocal = Array.from(
      new Map(localLists.map((a) => [a.studentEmail?.toLowerCase(), a])).values()
    )
    setAttempts(uniqueLocal)

    // 2. Fetch server-side test results from backend
    const identifiers = [bank.testId, bank.backendBankId, bank.id, bank.title].filter(Boolean)
    if (identifiers.length > 0) {
      setLoading(true)
      try {
        await ensureActiveSession({ email: 'businesswithsubar@gmail.com', role: 'TEACHER' })
        let rosterList = null
        for (const ident of identifiers) {
          try {
            const results = await testManagementApi.getTestResults(ident)
            const list =
              results?.roster ||
              results?.studentRoster ||
              results?.students ||
              (Array.isArray(results) ? results : null)
            if (list && Array.isArray(list) && list.length > 0) {
              rosterList = list
              break
            }
          } catch {
            // try next identifier candidate
          }
        }
        if (rosterList && Array.isArray(rosterList)) {
          setBackendRoster(rosterList)
        }
      } catch (err) {
        console.warn('Backend getTestResults note:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadAttempts()
  }, [bank.id, bank.testId, bank.backendBankId])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const authorizedList = Array.isArray(bank.authorizedStudents)
    ? [...bank.authorizedStudents]
    : []

  // Collect all unique student emails across authorized list, backend roster, and local attempts
  const allEmails = new Set(authorizedList.map((e) => String(e).toLowerCase().trim()))
  backendRoster.forEach((r) => {
    if (r.email) allEmails.add(r.email.toLowerCase().trim())
  })
  attempts.forEach((a) => {
    if (a.studentEmail) allEmails.add(a.studentEmail.toLowerCase().trim())
  })

  const questionTotal = Array.isArray(bank.questions) ? bank.questions.length : 40

  // Combine authorized students with attempt records
  const studentRows = Array.from(allEmails).map((email) => {
    const backendRecord = backendRoster.find(
      (r) => r.email && r.email.toLowerCase() === email
    )
    const localAttempt = attempts.find(
      (a) => a.studentEmail && a.studentEmail.toLowerCase() === email
    )

    const isBackendCompleted =
      backendRecord &&
      (backendRecord.status === 'SUBMITTED' ||
        (backendRecord.score !== null && backendRecord.score !== undefined))

    const isCompleted = isBackendCompleted || Boolean(localAttempt)

    const latestScore =
      backendRecord?.latestScore ??
      backendRecord?.score ??
      localAttempt?.score ??
      null

    const bestScore =
      backendRecord?.bestScore ??
      backendRecord?.score ??
      localAttempt?.score ??
      null

    const latestPct =
      backendRecord?.latestPercentage ??
      backendRecord?.percentage ??
      localAttempt?.percentage ??
      (latestScore !== null ? Math.round((latestScore / questionTotal) * 100) : null)

    const bestPct =
      backendRecord?.bestPercentage ??
      (bestScore !== null ? Math.round((bestScore / questionTotal) * 100) : null)

    const attemptCount =
      backendRecord?.attemptCount ??
      backendRecord?.attempts?.length ??
      (localAttempt ? 1 : 0)

    const attemptsList =
      backendRecord?.attempts && Array.isArray(backendRecord.attempts) && backendRecord.attempts.length > 0
        ? backendRecord.attempts
        : localAttempt
        ? [localAttempt]
        : []

    let latestScoreDisplay = '—'
    let bestScoreDisplay = '—'
    let latestPctDisplay = '—'
    let bestPctDisplay = '—'
    let completedDateDisplay = '—'
    let fullscreenDisplay = '—'
    let hasAttempt = Boolean(isCompleted)

    if (isBackendCompleted) {
      const score = latestScore ?? 0
      const total = backendRecord.totalQuestions || questionTotal
      latestScoreDisplay = `${score} / ${total}`
      latestPctDisplay = `${latestPct ?? Math.round((score / total) * 100)}%`

      if (bestScore !== null) {
        bestScoreDisplay = `${bestScore} / ${total}`
        bestPctDisplay = `${bestPct ?? Math.round((bestScore / total) * 100)}%`
      } else {
        bestScoreDisplay = latestScoreDisplay
        bestPctDisplay = latestPctDisplay
      }

      const rawDate = backendRecord.completedAt || backendRecord.submittedAt
      completedDateDisplay = rawDate
        ? new Date(rawDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Completed'

      const violations =
        backendRecord.minimizeCount ??
        backendRecord.violations?.length ??
        localAttempt?.fullscreenViolations ??
        (backendRecord.fullscreenIntegrity && backendRecord.fullscreenIntegrity.includes('exit')
          ? backendRecord.fullscreenIntegrity
          : 0)

      fullscreenDisplay =
        typeof violations === 'number'
          ? violations > 0
            ? `⚠️ ${violations} exit(s)`
            : '✓ Fullscreen (0 exits)'
          : violations || '✓ Fullscreen (0 exits)'
    } else if (localAttempt) {
      latestScoreDisplay = `${localAttempt.score} / ${localAttempt.totalQuestions}`
      latestPctDisplay = `${localAttempt.percentage}%`
      bestScoreDisplay = latestScoreDisplay
      bestPctDisplay = latestPctDisplay
      completedDateDisplay = localAttempt.completedAt
        ? new Date(localAttempt.completedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Completed'
      fullscreenDisplay =
        localAttempt.fullscreenViolations > 0
          ? `⚠️ ${localAttempt.fullscreenViolations} exit(s)`
          : '✓ Fullscreen (0 exits)'
    }

    return {
      email,
      attempt: hasAttempt ? (localAttempt || backendRecord) : null,
      status: isCompleted
        ? 'Completed'
        : backendRecord?.status === 'IN_PROGRESS'
        ? 'In Progress'
        : 'Not Attempted',
      latestScoreDisplay,
      latestPctDisplay,
      bestScoreDisplay,
      bestPctDisplay,
      attemptCount,
      attemptsList,
      completedDateDisplay,
      fullscreenDisplay,
      hasAttempt,
    }
  })

  const completedCount = studentRows.filter((r) => r.status === 'Completed').length

  const handleConfirmReset = (email) => {
    resetStudentAttempt(bank.id, email)
    setAttempts(listBankAttempts(bank.id))
    setRetakeConfirmEmail(null)
    setNotice(`Attempt cleared for ${email}. Student may retake the quiz.`)
    setTimeout(() => setNotice(''), 4000)
  }

  const handleExportCsv = () => {
    const header = [
      'Student Email',
      'Status',
      'Latest Score',
      'Latest Percentage',
      'Best Score',
      'Best Percentage',
      'Attempt Count',
      'Fullscreen Integrity',
      'Completed At',
    ]
    const rows = studentRows.map((r) => [
      `"${r.email}"`,
      `"${r.status}"`,
      `"${r.latestScoreDisplay}"`,
      `"${r.latestPctDisplay}"`,
      `"${r.bestScoreDisplay}"`,
      `"${r.bestPctDisplay}"`,
      r.attemptCount,
      `"${r.fullscreenDisplay}"`,
      `"${r.completedDateDisplay}"`,
    ])

    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${bank.title.replace(/\s+/g, '_')}_Attempts.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="qb-modal-backdrop" onClick={onClose}>
      <div className="qb-modal-card qb-modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="qb-modal-header">
          <div>
            <h3 className="qb-modal-title">Student Attempt Results</h3>
            <p className="qb-modal-subtitle">
              &ldquo;{bank.title}&rdquo; — {completedCount} of {studentRows.length} Students Completed
            </p>
          </div>
          <button type="button" className="qb-modal-close-btn" onClick={onClose} aria-label="Close">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <div className="qb-modal-body">
          {notice && <div className="qb-alert-toast" style={{ top: '10px' }}>{notice}</div>}

          {/* Quick Metrics Bar */}
          <div className="qb-stats-metrics-grid" style={{ marginBottom: '16px' }}>
            <div className="qb-metric-box ok">
              <div className="qb-metric-num">{studentRows.length}</div>
              <div className="qb-metric-label">Authorized Students</div>
            </div>
            <div className="qb-metric-box valid">
              <div className="qb-metric-num">{completedCount}</div>
              <div className="qb-metric-label">Completed Attempts</div>
            </div>
            <div className="qb-metric-box">
              <div className="qb-metric-num">{studentRows.length - completedCount}</div>
              <div className="qb-metric-label">Pending / Unattempted</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2, #A1A1AA)' }}>
              {loading ? 'Refreshing attempt scores from server...' : `Showing real-time student scores (${studentRows.length} students)`}
            </span>
            <button
              type="button"
              className="btn btn-secondary qb-small-btn"
              onClick={handleExportCsv}
              disabled={completedCount === 0}
            >
              <ion-icon name="download-outline"></ion-icon>
              <span>Export CSV Report</span>
            </button>
          </div>

          {/* Retake Confirmation Card Banner */}
          {retakeConfirmEmail && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ color: '#F87171', fontSize: '13px' }}>Reset Attempt Confirmation:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-1, #F4F4F5)' }}>
                  Are you sure you want to allow <strong>{retakeConfirmEmail}</strong> to retake this quiz? Their previous attempt score will be cleared.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary qb-small-btn"
                  onClick={() => setRetakeConfirmEmail(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger qb-small-btn"
                  style={{ background: '#EF4444', color: '#fff', borderColor: '#DC2626' }}
                  onClick={() => handleConfirmReset(retakeConfirmEmail)}
                >
                  Confirm Retake
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {studentRows.length === 0 ? (
            <div className="qb-empty-state">
              <ion-icon name="people-outline" class="qb-empty-icon"></ion-icon>
              <h4>No Students Authorized</h4>
              <p>Add student emails via the Student Access modal first.</p>
            </div>
          ) : (
            <div className="qb-table-wrapper">
              <table className="qb-attempts-table">
                <thead>
                  <tr>
                    <th>Student Email</th>
                    <th>Status</th>
                    <th>Latest Score</th>
                    <th>Best Score</th>
                    <th>Attempts</th>
                    <th>Fullscreen Integrity</th>
                    <th>Completed At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((row) => (
                    <>
                      <tr key={row.email}>
                        <td className="qb-student-email-cell">
                          <ion-icon name="person-circle-outline"></ion-icon>
                          <span>{row.email}</span>
                        </td>
                        <td>
                          <span className={`qb-attempt-badge ${row.status === 'Completed' ? 'completed' : row.status === 'In Progress' ? 'started' : 'pending'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="font-mono">
                          {row.latestScoreDisplay !== '—' ? (
                            <span>
                              {row.latestScoreDisplay}{' '}
                              <span style={{ color: 'var(--text-2, #A1A1AA)', fontSize: '11px' }}>
                                ({row.latestPctDisplay})
                              </span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="font-mono font-bold" style={{ color: row.bestScoreDisplay !== '—' ? '#10B981' : 'inherit' }}>
                          {row.bestScoreDisplay !== '—' ? (
                            <span>
                              {row.bestScoreDisplay}{' '}
                              <span style={{ color: '#10B981', fontSize: '11px', opacity: 0.9 }}>
                                ({row.bestPctDisplay})
                              </span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="font-mono font-bold">{row.attemptCount}</span>
                            {row.attemptsList.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-secondary qb-small-btn"
                                style={{ fontSize: '11px', padding: '3px 8px', height: '24px' }}
                                onClick={() => setExpandedEmail(expandedEmail === row.email ? null : row.email)}
                              >
                                <ion-icon name={expandedEmail === row.email ? 'chevron-up-outline' : 'chevron-down-outline'}></ion-icon>
                                <span>{expandedEmail === row.email ? 'Hide' : `Retests (${row.attemptCount})`}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {row.fullscreenDisplay !== '—' ? (
                            row.fullscreenDisplay.includes('⚠️') ? (
                              <span style={{ color: '#EF4444', fontWeight: 600, fontSize: '12px' }}>
                                {row.fullscreenDisplay}
                              </span>
                            ) : (
                              <span style={{ color: '#10B981', fontWeight: 600, fontSize: '12px' }}>
                                {row.fullscreenDisplay}
                              </span>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-2, #A1A1AA)', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td className="qb-time-cell">{row.completedDateDisplay}</td>
                        <td>
                          {row.hasAttempt && (
                            <button
                              type="button"
                              className="qb-reset-btn"
                              onClick={() => setRetakeConfirmEmail(row.email)}
                              title="Reset attempt (allow student to retake)"
                            >
                              <ion-icon name="refresh-outline"></ion-icon>
                              <span>Allow Retake</span>
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedEmail === row.email && (
                        <tr key={`${row.email}-expanded`} className="qb-retests-row">
                          <td colSpan={8} style={{ padding: '0 16px 16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div
                              className="qb-retests-container"
                              style={{
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid var(--line, #383842)',
                                borderRadius: '10px',
                                padding: '14px 18px',
                                marginTop: '6px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '12px',
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: '13px',
                                    color: 'var(--text-1, #F4F4F5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <ion-icon name="layers-outline" style={{ color: '#47afe5', fontSize: '16px' }}></ion-icon>
                                  <span>Attempt History for {row.email} ({row.attemptsList.length} Attempt{row.attemptsList.length !== 1 ? 's' : ''})</span>
                                </strong>
                                <button
                                  type="button"
                                  className="btn btn-secondary qb-small-btn"
                                  style={{ fontSize: '11px', padding: '2px 8px' }}
                                  onClick={() => setExpandedEmail(null)}
                                >
                                  Hide
                                </button>
                              </div>

                              <div
                                className="qb-retests-scroll-container"
                                style={{
                                  maxHeight: '260px',
                                  overflowY: 'auto',
                                  paddingRight: '6px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                                    gap: '12px',
                                  }}
                                >
                                  {row.attemptsList.map((att, idx) => {
                                    const attNum = att.attemptNumber || idx + 1
                                    const attScore = att.score ?? '—'
                                    const attTotal = att.totalQuestions || questionTotal
                                    const attPct =
                                      att.percentage ??
                                      (typeof att.score === 'number' ? Math.round((att.score / attTotal) * 100) : '—')
                                    const attDate = att.submittedAt || att.completedAt
                                      ? new Date(att.submittedAt || att.completedAt).toLocaleDateString(undefined, {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'Submitted'
                                    const attExits = att.minimizeCount ?? att.fullscreenViolations ?? 0

                                    return (
                                      <div
                                        key={att.id || idx}
                                        className="qb-retest-card"
                                        style={{
                                          background: '#FFFFFF',
                                          border: '1px solid #E4E4E7',
                                          borderRadius: '8px',
                                          padding: '12px 14px',
                                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '6px',
                                          }}
                                        >
                                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#000000' }}>
                                            Attempt #{attNum}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: '11px',
                                              fontWeight: 600,
                                              padding: '2px 8px',
                                              borderRadius: '10px',
                                              background: attExits > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                              color: attExits > 0 ? '#DC2626' : '#059669',
                                            }}
                                          >
                                            {attExits > 0 ? `⚠️ ${attExits} exit(s)` : '✓ Clean'}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                                          {attScore} / {attTotal} marks <span style={{ fontSize: '12px', fontWeight: 500, color: '#71717A' }}>({attPct}%)</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <ion-icon name="time-outline"></ion-icon>
                                          <span>{attDate}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="qb-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttemptDashboard

