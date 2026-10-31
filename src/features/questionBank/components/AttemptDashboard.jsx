import { useState, useEffect } from 'react'
import {
  listBankAttempts,
  resetStudentAttempt,
  exportAttemptsToCsv,
} from '../services/quizAttemptService'
import { testManagementApi } from '../../../services/nxtstepApi'

function AttemptDashboard({ bank, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [backendRoster, setBackendRoster] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [retakeConfirmEmail, setRetakeConfirmEmail] = useState(null)

  const loadAttempts = async () => {
    // 1. Fetch local storage attempts
    const list = listBankAttempts(bank.id)
    setAttempts(list)

    // 2. Fetch server-side test results from backend
    const testIdentifier = bank.testId || bank.backendBankId || bank.id
    if (testIdentifier) {
      setLoading(true)
      try {
        const results = await testManagementApi.getTestResults(testIdentifier)
        if (results && Array.isArray(results.studentRoster)) {
          setBackendRoster(results.studentRoster)
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

    let scoreDisplay = '—'
    let percentageDisplay = '—'
    let completedDateDisplay = '—'
    let fullscreenDisplay = '—'
    let hasAttempt = Boolean(isCompleted)

    if (isBackendCompleted) {
      const score = backendRecord.score ?? 0
      const total = backendRecord.totalQuestions || questionTotal
      const pct =
        backendRecord.percentage !== null && backendRecord.percentage !== undefined
          ? backendRecord.percentage
          : Math.round((score / total) * 100)

      scoreDisplay = `${score} / ${total}`
      percentageDisplay = `${pct}%`
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
      fullscreenDisplay = backendRecord.fullscreenIntegrity || '✓ Fullscreen'
    } else if (localAttempt) {
      scoreDisplay = `${localAttempt.score} / ${localAttempt.totalQuestions}`
      percentageDisplay = `${localAttempt.percentage}%`
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
      scoreDisplay,
      percentageDisplay,
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
    const csv = exportAttemptsToCsv(bank.id, bank.title)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Fullscreen Integrity</th>
                    <th>Completed At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((row) => (
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
                      <td className="font-mono">{row.scoreDisplay}</td>
                      <td className="font-mono font-bold">{row.percentageDisplay}</td>
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

