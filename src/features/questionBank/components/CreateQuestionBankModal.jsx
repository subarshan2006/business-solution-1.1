import { useState, useEffect } from 'react'
import {
  createQuestionBank,
  saveQuestionBank,
} from '../services/questionBankStorage'

function CreateQuestionBankModal({ bank = null, onClose, onSaved }) {
  const isEditing = Boolean(bank)

  const [title, setTitle] = useState(bank?.title || '')
  const [subject, setSubject] = useState(bank?.subject || 'AP Biology')
  const [description, setDescription] = useState(bank?.description || '')
  const [published, setPublished] = useState(bank?.published ?? true)

  const [randomizeQuestions, setRandomizeQuestions] = useState(
    bank?.settings?.randomizeQuestions ?? true
  )
  const [randomizeOptions, setRandomizeOptions] = useState(
    bank?.settings?.randomizeOptions ?? true
  )
  const [oneAttempt, setOneAttempt] = useState(
    bank?.settings?.oneAttempt ?? true
  )
  const [showExplanation, setShowExplanation] = useState(
    bank?.settings?.showExplanation ?? true
  )
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(
    bank?.settings?.questionsPerAttempt ? String(bank.settings.questionsPerAttempt) : ''
  )
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    bank?.settings?.timeLimitMinutes ? String(bank.settings.timeLimitMinutes) : '20'
  )
  const [quizEndingHours, setQuizEndingHours] = useState(
    bank?.settings?.quizEndingHours ? String(bank.settings.quizEndingHours) : '3'
  )
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please provide a title for the question bank.')
      return
    }

    const qCount = questionsPerAttempt ? parseInt(questionsPerAttempt, 10) : null
    const tLimit = timeLimitMinutes ? parseInt(timeLimitMinutes, 10) : null
    const endHours = quizEndingHours ? parseFloat(quizEndingHours) : 3
    const settings = {
      randomizeQuestions,
      randomizeOptions,
      oneAttempt,
      showExplanation,
      questionsPerAttempt: qCount && qCount > 0 ? qCount : null,
      timeLimitMinutes: tLimit && tLimit > 0 ? tLimit : null,
      quizEndingHours: endHours && endHours > 0 ? endHours : 3,
    }

    let saved
    if (isEditing) {
      saved = saveQuestionBank({
        ...bank,
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        published,
        settings,
      })
    } else {
      const newBank = createQuestionBank({
        title,
        subject,
        description,
        published,
        settings,
      })
      saved = saveQuestionBank(newBank)
    }

    onSaved(saved)
  }

  return (
    <div className="qb-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qb-modal-card qb-modal-card-bank" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="qb-modal-header">
          <div className="qb-modal-header-info">
            <div className="qb-modal-header-icon">
              <ion-icon name={isEditing ? 'create-outline' : 'library-outline'}></ion-icon>
            </div>
            <div>
              <div className="qb-modal-title-row">
                <h3 className="qb-modal-title">{isEditing ? 'Edit Question Bank' : 'Create Question Bank'}</h3>
                <span className={`qb-header-badge ${published ? 'live' : 'draft'}`}>
                  <span className="qb-status-dot"></span>
                  {published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="qb-modal-subtitle">Configure bank title, subject, and student attempt settings.</p>
            </div>
          </div>
          <button type="button" className="qb-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="qb-modal-form-wrap">
          <div className="qb-modal-body">
            {error && (
              <div className="qb-alert-error" role="alert">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Basic Information */}
            <div className="qb-form-section">
              <div className="qb-section-header">
                <div className="qb-section-icon">
                  <ion-icon name="document-text-outline"></ion-icon>
                </div>
                <div>
                  <h4 className="qb-section-title">Question Bank Details</h4>
                  <span className="qb-section-desc">Course alignment and student-facing description</span>
                </div>
              </div>

              <div className="qb-form-group">
                <label className="qb-form-label">
                  Question Bank Title <span className="qb-required-mark">*</span>
                </label>
                <div className="qb-input-with-icon">
                  <ion-icon name="bookmark-outline" class="qb-input-icon"></ion-icon>
                  <input
                    type="text"
                    className="qb-form-input"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder="e.g. AP Biology — Unit 3 Cellular Energetics"
                    required
                  />
                </div>
              </div>

              <div className="qb-form-group">
                <label className="qb-form-label">Subject / Course</label>
                <div className="qb-input-with-icon">
                  <ion-icon name="school-outline" class="qb-input-icon"></ion-icon>
                  <select
                    className="qb-form-select"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="AP Biology">AP Biology</option>
                    <option value="AP Environmental Science">AP Environmental Science</option>
                    <option value="AP Psychology">AP Psychology</option>
                    <option value="USABO Enrichment">USABO Enrichment</option>
                    <option value="General Science">General Science</option>
                  </select>
                  <ion-icon name="chevron-down-outline" class="qb-select-arrow"></ion-icon>
                </div>
              </div>

              <div className="qb-form-group">
                <label className="qb-form-label">
                  Description / Instructions <span className="qb-form-sublabel">(Optional)</span>
                </label>
                <textarea
                  rows="3"
                  className="qb-form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description or study notes for students taking this quiz..."
                />
              </div>
            </div>

            {/* Section 2: Timing & Exam Attempt Rules */}
            <div className="qb-form-section">
              <div className="qb-section-header">
                <div className="qb-section-icon timing">
                  <ion-icon name="timer-outline"></ion-icon>
                </div>
                <div>
                  <h4 className="qb-section-title">Timing & Attempt Settings</h4>
                  <span className="qb-section-desc">Configure question batch size, time limits, and exam ending auto-deletion</span>
                </div>
              </div>

              <div className="qb-timing-grid">
                {/* Parameter 1: Questions Per Attempt */}
                <div className="qb-timing-card">
                  <div className="qb-timing-card-head">
                    <ion-icon name="albums-outline"></ion-icon>
                    <span>Questions Per Attempt</span>
                  </div>
                  <div className="qb-timing-input-wrap">
                    <input
                      type="number"
                      min="1"
                      className="qb-timing-input"
                      value={questionsPerAttempt}
                      onChange={(e) => setQuestionsPerAttempt(e.target.value)}
                      placeholder="All"
                    />
                    <span className="qb-timing-unit">Questions</span>
                  </div>
                  <p className="qb-timing-card-sub">Leave blank for all questions in bank</p>
                </div>

                {/* Parameter 2: 1. Quiz Duration (Minutes) */}
                <div className="qb-timing-card">
                  <div className="qb-timing-card-head">
                    <ion-icon name="stopwatch-outline"></ion-icon>
                    <span>1. Quiz Duration</span>
                  </div>
                  <div className="qb-timing-input-wrap">
                    <input
                      type="number"
                      min="1"
                      className="qb-timing-input"
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(e.target.value)}
                      placeholder="Untimed"
                    />
                    <span className="qb-timing-unit">Mins</span>
                  </div>
                  <p className="qb-timing-card-sub">Time limit for student once quiz is started</p>
                </div>

                {/* Parameter 3: 2. Quiz Ending Time (Hours) */}
                <div className="qb-timing-card">
                  <div className="qb-timing-card-head">
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <span>2. Quiz Ending Time</span>
                  </div>
                  <div className="qb-timing-input-wrap">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      className="qb-timing-input"
                      value={quizEndingHours}
                      onChange={(e) => setQuizEndingHours(e.target.value)}
                      placeholder="3"
                    />
                    <span className="qb-timing-unit">Hours</span>
                  </div>
                  <p className="qb-timing-card-sub">After {quizEndingHours || '3'} hrs, screenshots auto-delete permanently</p>
                </div>
              </div>

              {/* Security Notice Callout */}
              <div className="qb-ephemeral-banner">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <div>
                  <strong>Auto-Delete Exam Protection Active</strong>
                  <p>
                    After <strong>{quizEndingHours || 3} hours</strong>, question screenshots and diagrams auto-delete permanently from student access records to prevent unauthorized distribution and leaks.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Quiz Behavior Settings */}
            <div className="qb-form-section">
              <div className="qb-section-header">
                <div className="qb-section-icon behavior">
                  <ion-icon name="options-outline"></ion-icon>
                </div>
                <div>
                  <h4 className="qb-section-title">Quiz Behavior Settings</h4>
                  <span className="qb-section-desc">Manage randomization, single-attempt locks, feedback, and publishing</span>
                </div>
              </div>

              <div className="qb-toggle-list">
                {/* Toggle 1: Randomize Question Order */}
                <label className={`qb-toggle-card ${randomizeQuestions ? 'active' : ''}`}>
                  <div className="qb-toggle-card-main">
                    <div className="qb-toggle-icon">
                      <ion-icon name="shuffle-outline"></ion-icon>
                    </div>
                    <div className="qb-toggle-card-text">
                      <div className="qb-toggle-title-line">
                        <span className="qb-toggle-title">Randomize Question Order</span>
                      </div>
                      <p className="qb-toggle-desc">Presents questions in random sequence for each student attempt.</p>
                    </div>
                  </div>
                  <div className="qb-switch-wrap">
                    <input
                      type="checkbox"
                      className="qb-switch-input"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      aria-label="Randomize Question Order"
                    />
                    <span className="qb-switch-track">
                      <span className="qb-switch-thumb"></span>
                    </span>
                  </div>
                </label>

                {/* Toggle 2: Randomize Multiple Choice Options */}
                <label className={`qb-toggle-card ${randomizeOptions ? 'active' : ''}`}>
                  <div className="qb-toggle-card-main">
                    <div className="qb-toggle-icon">
                      <ion-icon name="swap-horizontal-outline"></ion-icon>
                    </div>
                    <div className="qb-toggle-card-text">
                      <div className="qb-toggle-title-line">
                        <span className="qb-toggle-title">Randomize Multiple Choice Options</span>
                      </div>
                      <p className="qb-toggle-desc">Shuffles option letters A-D while preserving correct answer mapping.</p>
                    </div>
                  </div>
                  <div className="qb-switch-wrap">
                    <input
                      type="checkbox"
                      className="qb-switch-input"
                      checked={randomizeOptions}
                      onChange={(e) => setRandomizeOptions(e.target.checked)}
                      aria-label="Randomize Multiple Choice Options"
                    />
                    <span className="qb-switch-track">
                      <span className="qb-switch-thumb"></span>
                    </span>
                  </div>
                </label>

                {/* Toggle 3: Single Attempt Only */}
                <label className={`qb-toggle-card ${oneAttempt ? 'active' : ''}`}>
                  <div className="qb-toggle-card-main">
                    <div className="qb-toggle-icon">
                      <ion-icon name="lock-closed-outline"></ion-icon>
                    </div>
                    <div className="qb-toggle-card-text">
                      <div className="qb-toggle-title-line">
                        <span className="qb-toggle-title">Single Attempt Only (One-Time Exam)</span>
                      </div>
                      <p className="qb-toggle-desc">Blocks retakes once a student submits their final answer.</p>
                    </div>
                  </div>
                  <div className="qb-switch-wrap">
                    <input
                      type="checkbox"
                      className="qb-switch-input"
                      checked={oneAttempt}
                      onChange={(e) => setOneAttempt(e.target.checked)}
                      aria-label="Single Attempt Only"
                    />
                    <span className="qb-switch-track">
                      <span className="qb-switch-thumb"></span>
                    </span>
                  </div>
                </label>

                {/* Toggle 4: Instant Explanation Feedback */}
                <label className={`qb-toggle-card ${showExplanation ? 'active' : ''}`}>
                  <div className="qb-toggle-card-main">
                    <div className="qb-toggle-icon">
                      <ion-icon name="bulb-outline"></ion-icon>
                    </div>
                    <div className="qb-toggle-card-text">
                      <div className="qb-toggle-title-line">
                        <span className="qb-toggle-title">Instant Explanation Feedback</span>
                      </div>
                      <p className="qb-toggle-desc">Shows immediate correct/incorrect banner and explanation after each submission.</p>
                    </div>
                  </div>
                  <div className="qb-switch-wrap">
                    <input
                      type="checkbox"
                      className="qb-switch-input"
                      checked={showExplanation}
                      onChange={(e) => setShowExplanation(e.target.checked)}
                      aria-label="Instant Explanation Feedback"
                    />
                    <span className="qb-switch-track">
                      <span className="qb-switch-thumb"></span>
                    </span>
                  </div>
                </label>

                {/* Toggle 5: Published Status */}
                <label className={`qb-toggle-card ${published ? 'active' : ''}`}>
                  <div className="qb-toggle-card-main">
                    <div className="qb-toggle-icon">
                      <ion-icon name="globe-outline"></ion-icon>
                    </div>
                    <div className="qb-toggle-card-text">
                      <div className="qb-toggle-title-line">
                        <span className="qb-toggle-title">Published (Available to Authorized Students)</span>
                        <span className={`qb-toggle-pill ${published ? 'live' : 'draft'}`}>
                          {published ? 'Live' : 'Draft Only'}
                        </span>
                      </div>
                      <p className="qb-toggle-desc">When unchecked, students cannot see or start this quiz.</p>
                    </div>
                  </div>
                  <div className="qb-switch-wrap">
                    <input
                      type="checkbox"
                      className="qb-switch-input"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      aria-label="Published to Authorized Students"
                    />
                    <span className="qb-switch-track">
                      <span className="qb-switch-thumb"></span>
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="qb-modal-footer">
            <div className="qb-modal-footer-hint">
              <ion-icon name="information-circle-outline"></ion-icon>
              <span>Press <kbd>Esc</kbd> to discard</span>
            </div>
            <div className="qb-modal-footer-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <ion-icon name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'}></ion-icon>
                <span>{isEditing ? 'Save Changes' : 'Create Question Bank'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateQuestionBankModal
