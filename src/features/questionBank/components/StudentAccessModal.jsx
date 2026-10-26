import { useState, useEffect } from 'react'
import {
  saveQuestionBank,
  normalizeEmailList,
} from '../services/questionBankStorage'
import { teacherStudentApi } from '../../../services/nxtstepApi'

function StudentAccessModal({ bank, onClose, onSaved }) {
  const [emails, setEmails] = useState(
    Array.isArray(bank.authorizedStudents) ? [...bank.authorizedStudents] : []
  )
  const [singleInput, setSingleInput] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [showBatch, setShowBatch] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAddSingle = (e) => {
    e.preventDefault()
    setError('')
    const clean = singleInput.trim().toLowerCase()
    if (!clean) return

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Please enter a valid email address (e.g. student@gmail.com).')
      return
    }

    if (emails.includes(clean)) {
      setError('This student email is already authorized.')
      return
    }

    setEmails([...emails, clean])
    setSingleInput('')
  }

  const handleAddBatch = (e) => {
    e.preventDefault()
    setError('')
    if (!batchInput.trim()) return

    const parsed = normalizeEmailList(batchInput)
    if (parsed.length === 0) {
      setError('No valid email addresses found in the pasted text.')
      return
    }

    const combined = Array.from(new Set([...emails, ...parsed]))
    const addedCount = combined.length - emails.length
    setEmails(combined)
    setBatchInput('')
    setShowBatch(false)
    if (addedCount > 0) {
      setError('')
    } else {
      setError('All entered emails were already on the list.')
    }
  }

  const handleRemove = (emailToRemove) => {
    setEmails(emails.filter((e) => e !== emailToRemove))
  }

  const handleClearAll = () => {
    if (window.confirm('Remove all authorized student emails from this question bank?')) {
      setEmails([])
    }
  }

  const [isSyncing, setIsSyncing] = useState(false)

  const handleSave = async () => {
    setIsSyncing(true)
    setError('')
    try {
      if (emails.length > 0) {
        try {
          await teacherStudentApi.addStudents({ studentEmails: emails })
        } catch (apiErr) {
          console.warn('Backend teacher-student sync warning (proceeding with local save):', apiErr)
        }
      }

      const updated = saveQuestionBank({
        ...bank,
        published: true,
        authorizedStudents: emails,
      })
      onSaved(updated)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="qb-modal-backdrop" onClick={onClose}>
      <div className="qb-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="qb-modal-header">
          <div>
            <h3 className="qb-modal-title">Student Access Control</h3>
            <p className="qb-modal-subtitle">
              Authorize specific student emails for &ldquo;{bank.title}&rdquo;. Only these accounts can access this quiz.
            </p>
          </div>
          <button type="button" className="qb-modal-close-btn" onClick={onClose} aria-label="Close">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <div className="qb-modal-body">
          {error && <div className="qb-alert-error">{error}</div>}

          <div className="qb-info-banner">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
            <div>
              <strong>Direct Email Authorization (Zero Roster API)</strong>
              <p>
                Students must sign in with their Google account. Their email is verified against this list before any quiz questions are loaded.
              </p>
            </div>
          </div>

          {/* Add Single Email */}
          <form onSubmit={handleAddSingle} className="qb-email-input-row">
            <input
              type="email"
              className="qb-form-input"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              placeholder="Enter student Google email (e.g. student@gmail.com)"
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <ion-icon name="add-outline"></ion-icon>
              <span>Add</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowBatch(!showBatch)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <ion-icon name="copy-outline"></ion-icon>
              <span>{showBatch ? 'Close Batch' : 'Batch Paste'}</span>
            </button>
          </form>

          {/* Batch Paste Box */}
          {showBatch && (
            <form onSubmit={handleAddBatch} className="qb-batch-box">
              <label className="qb-form-label">Paste multiple student emails (comma, space, or line separated):</label>
              <textarea
                rows="4"
                className="qb-form-textarea"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="alex.student@gmail.com&#10;samyuktha.apbio@gmail.com&#10;sophia.psych@gmail.com"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary">
                  Import Emails
                </button>
              </div>
            </form>
          )}

          {/* Authorized List Display */}
          <div className="qb-emails-section">
            <div className="qb-emails-header">
              <span className="qb-emails-count">
                Authorized Students (<strong>{emails.length}</strong>)
              </span>
              {emails.length > 0 && (
                <button
                  type="button"
                  className="qb-text-btn-danger"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              )}
            </div>

            {emails.length === 0 ? (
              <div className="qb-emails-empty">
                <ion-icon name="person-remove-outline"></ion-icon>
                <p>No students authorized yet. Add student Google emails above.</p>
              </div>
            ) : (
              <div className="qb-chips-container">
                {emails.map((email) => (
                  <span key={email} className="qb-email-chip">
                    <ion-icon name="person-circle-outline"></ion-icon>
                    <span className="qb-chip-text">{email}</span>
                    <button
                      type="button"
                      className="qb-chip-remove-btn"
                      onClick={() => handleRemove(email)}
                      title={`Remove ${email}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="qb-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSyncing}>
              {isSyncing ? 'Saving & Syncing...' : `Save Access (${emails.length} Students)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentAccessModal
