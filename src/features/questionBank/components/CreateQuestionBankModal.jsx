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
    bank?.settings?.questionsPerAttempt || ''
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
    const settings = {
      randomizeQuestions,
      randomizeOptions,
      oneAttempt,
      showExplanation,
      questionsPerAttempt: qCount && qCount > 0 ? qCount : null,
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
    <div className="qb-modal-backdrop" onClick={onClose}>
      <div className="qb-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="qb-modal-header">
          <div>
            <h3 className="qb-modal-title">{isEditing ? 'Edit Question Bank' : 'Create Question Bank'}</h3>
            <p className="qb-modal-subtitle">Configure bank title, subject, and student attempt settings.</p>
          </div>
          <button type="button" className="qb-modal-close-btn" onClick={onClose} aria-label="Close">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="qb-modal-body">
          {error && <div className="qb-alert-error">{error}</div>}

          <div className="qb-form-group">
            <label className="qb-form-label">Question Bank Title *</label>
            <input
              type="text"
              className="qb-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AP Biology — Unit 3 Cellular Energetics"
              required
            />
          </div>

          <div className="qb-form-row">
            <div className="qb-form-group">
              <label className="qb-form-label">Subject / Course</label>
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
            </div>

            <div className="qb-form-group">
              <label className="qb-form-label">Questions Per Attempt</label>
              <input
                type="number"
                min="1"
                className="qb-form-input"
                value={questionsPerAttempt}
                onChange={(e) => setQuestionsPerAttempt(e.target.value)}
                placeholder="Leave blank for all questions"
              />
            </div>
          </div>

          <div className="qb-form-group">
            <label className="qb-form-label">Description / Instructions</label>
            <textarea
              rows="3"
              className="qb-form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description or study notes for students taking this quiz..."
            />
          </div>

          <div className="qb-settings-box">
            <h4 className="qb-settings-title">Quiz Behavior Settings</h4>

            <label className="qb-checkbox-label">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
              />
              <div>
                <strong>Randomize Question Order</strong>
                <span>Presents questions in random sequence for each student attempt.</span>
              </div>
            </label>

            <label className="qb-checkbox-label">
              <input
                type="checkbox"
                checked={randomizeOptions}
                onChange={(e) => setRandomizeOptions(e.target.checked)}
              />
              <div>
                <strong>Randomize Multiple Choice Options</strong>
                <span>Shuffles option letters A-D while preserving correct answer mapping.</span>
              </div>
            </label>

            <label className="qb-checkbox-label">
              <input
                type="checkbox"
                checked={oneAttempt}
                onChange={(e) => setOneAttempt(e.target.checked)}
              />
              <div>
                <strong>Single Attempt Only (One-Time Exam)</strong>
                <span>Blocks retakes once a student submits their final answer.</span>
              </div>
            </label>

            <label className="qb-checkbox-label">
              <input
                type="checkbox"
                checked={showExplanation}
                onChange={(e) => setShowExplanation(e.target.checked)}
              />
              <div>
                <strong>Instant Explanation Feedback</strong>
                <span>Shows immediate correct/incorrect banner and explanation after each submission.</span>
              </div>
            </label>

            <label className="qb-checkbox-label">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <div>
                <strong>Published (Available to Authorized Students)</strong>
                <span>When unchecked, students cannot see or start this quiz.</span>
              </div>
            </label>
          </div>

          <div className="qb-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Question Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateQuestionBankModal
