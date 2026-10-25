import { useState, useEffect } from 'react'
import {
  listBankAttempts,
  resetStudentAttempt,
  exportAttemptsToCsv,
} from '../services/quizAttemptService'

function AttemptDashboard({ bank, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const list = listBankAttempts(bank.id)
    setAttempts(list)
  }, [bank.id])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const authorizedList = Array.isArray(bank.authorizedStudents)
    ? bank.authorizedStudents
    : []

  // Combine authorized students with attempt records
  const studentRows = authorizedList.map((email) => {
    const att = attempts.find(
      (a) => a.studentEmail.toLowerCase() === email.toLowerCase()
    )
    return {
      email,
      attempt: att || null,
      status: att ? 'Completed' : 'Not Attempted',
      scoreDisplay: att ? `${att.score} / ${att.totalQuestions}` : '—',
      percentageDisplay: att ? `${att.percentage}%` : '—',
      completedDateDisplay: att
        ? new Date(att.completedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—',
    }
  })

  // Plus any attempts from students not in current authorized list (if email was removed later)
  attempts.forEach((att) => {
    const exists = studentRows.some(
      (r) => r.email.toLowerCase() === att.studentEmail.toLowerCase()
    )
    if (!exists) {
      studentRows.push({
        email: att.studentEmail,
        attempt: att,
        status: 'Completed',
        scoreDisplay: `${att.score} / ${att.totalQuestions}`,
        percentageDisplay: `${att.percentage}%`,
        completedDateDisplay: new Date(att.completedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }
  })

  const completedCount = studentRows.filter((r) => r.status === 'Completed').length

  const handleResetAttempt = (email) => {
    if (window.confirm(`Reset attempt for ${email}? This will allow the student to retake the quiz.`)) {
      resetStudentAttempt(bank.id, email)
      setAttempts(listBankAttempts(bank.id))
      setNotice(`Attempt cleared for ${email}. Student may retake the quiz.`)
      setTimeout(() => setNotice(''), 4000)
    }
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary qb-small-btn"
              onClick={handleExportCsv}
              disabled={attempts.length === 0}
            >
              <ion-icon name="download-outline"></ion-icon>
              <span>Export CSV Report</span>
            </button>
          </div>

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
                        <span className={`qb-attempt-badge ${row.status === 'Completed' ? 'completed' : 'pending'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="font-mono">{row.scoreDisplay}</td>
                      <td className="font-mono font-bold">{row.percentageDisplay}</td>
                      <td>
                        {row.attempt ? (
                          row.attempt.fullscreenViolations > 0 ? (
                            <span style={{ color: '#EF4444', fontWeight: 600, fontSize: '12px' }}>
                              ⚠️ {row.attempt.fullscreenViolations} exit(s)
                            </span>
                          ) : (
                            <span style={{ color: '#10B981', fontWeight: 600, fontSize: '12px' }}>
                              ✓ Fullscreen (0 exits)
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-2, #A1A1AA)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td className="qb-time-cell">{row.completedDateDisplay}</td>
                      <td>
                        {row.attempt && (
                          <button
                            type="button"
                            className="qb-reset-btn"
                            onClick={() => handleResetAttempt(row.email)}
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
