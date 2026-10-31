import { useState, useEffect } from 'react'
import { saveQuestionBank } from '../services/questionBankStorage'
import { validateQuestions } from '../services/questionValidator'
import { resolveAssetUrl } from '../services/ephemeralImageService'
import { questionReviewApi } from '../../../services/nxtstepApi'

function QuestionReviewer({ bank, onClose, onSaved }) {
  const [questions, setQuestions] = useState(
    Array.isArray(bank.questions) ? JSON.parse(JSON.stringify(bank.questions)) : []
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState(null)
  const [savedNotice, setSavedNotice] = useState('')
  const [loadingBackendQuestions, setLoadingBackendQuestions] = useState(false)

  // Fetch questions from backend if bank was imported in the background
  useEffect(() => {
    if (questions && questions.length > 0) return

    const loadQuestions = async () => {
      try {
        setLoadingBackendQuestions(true)
        let targetId = bank.backendBankId || (bank.id && !bank.id.startsWith("qb_") ? bank.id : null)

        if (!targetId && bank.title) {
          try {
            const allBanks = await questionBankApi.listQuestionBanks()
            const match = (allBanks || []).find((b) => b.title === bank.title || b.id === bank.id)
            if (match) targetId = match.id
          } catch (e) {
            console.warn("Could not list backend banks for fallback:", e)
          }
        }

        if (targetId) {
          const res = await questionReviewApi.listQuestions(targetId, { limit: 100 })
          const list = res?.data || []
          if (list.length > 0) {
            const mapped = list.map((bq, idx) => ({
              id: `Q${String(idx + 1).padStart(3, "0")}`,
              question: bq.questionText,
              options: (bq.options || []).map((o) => ({
                id: o.label,
                text: o.text || "",
                imageUrl: o.imageUrl || null,
              })),
              correctOption: bq.correctOption || "A",
              explanation: bq.explanation || "",
              image:
                bq.images?.find((img) => img.role === "QUESTION")?.imageUrl ||
                bq.images?.[0]?.imageUrl ||
                null,
              choicesImage: bq.images?.find((img) => img.role === "CHOICES")?.imageUrl || null,
              explanationImage: bq.images?.find((img) => img.role === "EXPLANATION")?.imageUrl || null,
              confidenceScores: bq.confidenceScores || null,
              needsReview: bq.needsReview || false,
            }))
            setQuestions(mapped)
            saveQuestionBank({ ...bank, backendBankId: targetId, questions: mapped, questionCount: mapped.length })
          }
        }
      } catch (err) {
        console.warn("Failed to load backend questions in reviewer:", err)
      } finally {
        setLoadingBackendQuestions(false)
      }
    }

    loadQuestions()
  }, [bank])

  const validation = validateQuestions(questions)
  const currentQ = questions[currentIndex] || null

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isEditing) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isEditing])

  const handleStartEdit = () => {
    if (!currentQ) return
    setEditedQuestion(JSON.parse(JSON.stringify(currentQ)))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedQuestion(null)
    setIsEditing(false)
  }

  const handleSaveCurrentEdit = () => {
    if (!editedQuestion) return
    const updated = [...questions]
    updated[currentIndex] = editedQuestion
    setQuestions(updated)
    setIsEditing(false)
    setEditedQuestion(null)
    setSavedNotice('Question changes updated in memory.')
    setTimeout(() => setSavedNotice(''), 3000)
  }

  const handleOptionChange = (optId, newText) => {
    if (!editedQuestion) return
    const updatedOpts = editedQuestion.options.map((o) =>
      o.id === optId ? { ...o, text: newText } : o
    )
    setEditedQuestion({ ...editedQuestion, options: updatedOpts })
  }

  const handleAddOption = () => {
    if (!editedQuestion) return
    const nextLetter = String.fromCharCode(65 + editedQuestion.options.length)
    setEditedQuestion({
      ...editedQuestion,
      options: [...editedQuestion.options, { id: nextLetter, text: '' }],
    })
  }

  const handleRemoveOption = (optId) => {
    if (!editedQuestion || editedQuestion.options.length <= 2) return
    const updatedOpts = editedQuestion.options.filter((o) => o.id !== optId)
    setEditedQuestion({ ...editedQuestion, options: updatedOpts })
  }

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleDeleteQuestion = () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true)
      return
    }
    const updated = questions.filter((_, idx) => idx !== currentIndex)
    setQuestions(updated)
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1))
    }
    setIsEditing(false)
    setShowConfirmDelete(false)
  }

  const handleAddNewQuestion = () => {
    const newQ = {
      id: `Q${String(questions.length + 1).padStart(3, '0')}`,
      question: 'New question prompt...',
      options: [
        { id: 'A', text: 'Option A' },
        { id: 'B', text: 'Option B' },
        { id: 'C', text: 'Option C' },
        { id: 'D', text: 'Option D' },
      ],
      correctOption: 'A',
      explanation: 'Explanation for correct answer.',
    }
    const updated = [...questions, newQ]
    setQuestions(updated)
    setCurrentIndex(updated.length - 1)
    setEditedQuestion(JSON.parse(JSON.stringify(newQ)))
    setIsEditing(true)
  }

  const handleSaveAllToBank = () => {
    const updatedBank = saveQuestionBank({
      ...bank,
      questions,
    })
    onSaved(updatedBank)
  }

  return (
    <div className="qb-modal-backdrop" onClick={onClose}>
      <div className="qb-modal-card qb-modal-card-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qb-modal-header">
          <div>
            <h3 className="qb-modal-title">Review & Edit Questions</h3>
            <p className="qb-modal-subtitle">
              &ldquo;{bank.title}&rdquo; — {questions.length} Total Questions
              {validation.needsReviewCount > 0 && (
                <span className="qb-tag-warning" style={{ marginLeft: '10px' }}>
                  ⚠ {validation.needsReviewCount} Need Attention
                </span>
              )}
            </p>
          </div>
          <button type="button" className="qb-modal-close-btn" onClick={onClose} aria-label="Close">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <div className="qb-modal-body">
          {savedNotice && <div className="qb-alert-toast" style={{ top: '10px' }}>{savedNotice}</div>}

          {loadingBackendQuestions ? (
            <div className="qb-empty-state" style={{ padding: '48px 16px' }}>
              <div
                style={{
                  margin: '0 auto 16px',
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--mint, #10B981)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              ></div>
              <h4>Loading Questions from Database...</h4>
              <p style={{ color: 'var(--text-muted)' }}>Fetching questions and cropped diagrams from MongoDB Atlas.</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="qb-empty-state">
              <ion-icon name="help-circle-outline" class="qb-empty-icon"></ion-icon>
              <h4>No Questions in this Bank</h4>
              <p>Import questions or create your first question below.</p>
              <button type="button" className="btn btn-primary" onClick={handleAddNewQuestion}>
                Add Question
              </button>
            </div>
          ) : (
            <>
              {/* Question Navigator Toolbar */}
              <div className="qb-review-nav-bar">
                <div className="qb-nav-left">
                  <button
                    type="button"
                    className="btn btn-secondary qb-nav-btn"
                    onClick={() => {
                      setIsEditing(false)
                      setCurrentIndex((prev) => Math.max(0, prev - 1))
                    }}
                    disabled={currentIndex === 0 || isEditing}
                  >
                    <ion-icon name="chevron-back-outline"></ion-icon>
                    <span>Previous</span>
                  </button>

                  <span className="qb-nav-counter">
                    Question <strong>{currentIndex + 1}</strong> of <strong>{questions.length}</strong>
                  </span>

                  <button
                    type="button"
                    className="btn btn-secondary qb-nav-btn"
                    onClick={() => {
                      setIsEditing(false)
                      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                    }}
                    disabled={currentIndex === questions.length - 1 || isEditing}
                  >
                    <span>Next</span>
                    <ion-icon name="chevron-forward-outline"></ion-icon>
                  </button>
                </div>

                <div className="qb-nav-right">
                  <select
                    className="qb-jump-select"
                    value={currentIndex}
                    onChange={(e) => {
                      setIsEditing(false)
                      setCurrentIndex(parseInt(e.target.value, 10))
                    }}
                    disabled={isEditing}
                  >
                    {questions.map((q, idx) => (
                      <option key={q.id || idx} value={idx}>
                        Q{idx + 1}: {q.question?.substring(0, 36) || 'Untitled'}...
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddNewQuestion}
                    disabled={isEditing}
                  >
                    <ion-icon name="add-outline"></ion-icon>
                    <span>New Question</span>
                  </button>
                </div>
              </div>

              {/* Question Content View / Edit Card */}
              {isEditing && editedQuestion ? (
                /* Edit Mode */
                <div className="qb-question-edit-card">
                  <div className="qb-form-group">
                    <label className="qb-form-label">Question Text</label>
                    <textarea
                      rows="3"
                      className="qb-form-textarea"
                      value={editedQuestion.question}
                      onChange={(e) =>
                        setEditedQuestion({ ...editedQuestion, question: e.target.value })
                      }
                    />
                  </div>

                  <div className="qb-form-group">
                    <label className="qb-form-label">Diagram Image URL or Base64 (Optional)</label>
                    <input
                      type="text"
                      className="qb-form-input"
                      value={editedQuestion.image || ''}
                      onChange={(e) =>
                        setEditedQuestion({ ...editedQuestion, image: e.target.value })
                      }
                      placeholder="e.g. assets/quiz-images/figure1.png or data:image/png;base64,..."
                    />
                    {editedQuestion.image && (
                      <div className="qb-preview-img-box" style={{ marginTop: '8px' }}>
                        <img
                          src={editedQuestion.image}
                          alt="Diagram preview"
                          style={{ maxHeight: '180px', borderRadius: '8px' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="qb-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="qb-form-label" style={{ margin: 0 }}>Options</label>
                      <button
                        type="button"
                        className="qb-text-btn-sample"
                        onClick={handleAddOption}
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="qb-edit-options-list">
                      {editedQuestion.options.map((opt) => (
                        <div key={opt.id} className="qb-edit-option-row">
                          <label className="qb-opt-radio">
                            <input
                              type="radio"
                              name="correctOptionRadio"
                              checked={editedQuestion.correctOption === opt.id}
                              onChange={() =>
                                setEditedQuestion({ ...editedQuestion, correctOption: opt.id })
                              }
                            />
                            <span>{opt.id}</span>
                          </label>

                          <input
                            type="text"
                            className="qb-form-input"
                            value={opt.text}
                            onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                            placeholder={`Option ${opt.id} text`}
                          />

                          {editedQuestion.options.length > 2 && (
                            <button
                              type="button"
                              className="qb-opt-del-btn"
                              onClick={() => handleRemoveOption(opt.id)}
                              title="Delete option"
                            >
                              <ion-icon name="close-circle-outline"></ion-icon>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="qb-form-group">
                    <label className="qb-form-label">
                      Correct Answer: <strong>{editedQuestion.correctOption || 'None Selected'}</strong>
                    </label>
                    <p className="qb-hint-text">Click the radio button next to the option above to mark it as correct.</p>
                  </div>

                  <div className="qb-form-group">
                    <label className="qb-form-label">Explanation</label>
                    <textarea
                      rows="3"
                      className="qb-form-textarea"
                      value={editedQuestion.explanation}
                      onChange={(e) =>
                        setEditedQuestion({ ...editedQuestion, explanation: e.target.value })
                      }
                      placeholder="Why is this answer correct? Provide educational context."
                    />
                  </div>

                  <div className="qb-edit-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleSaveCurrentEdit}>
                      Save Question
                    </button>
                  </div>
                </div>
              ) : currentQ ? (
                /* View Mode */
                <div className="qb-question-view-card">
                  <div className="qb-q-header">
                    <span className="qb-q-badge">{currentQ.id || `Q${currentIndex + 1}`}</span>
                    <div className="qb-q-actions">
                      <button
                        type="button"
                        className="btn btn-secondary qb-small-btn"
                        onClick={handleStartEdit}
                      >
                        <ion-icon name="create-outline"></ion-icon>
                        <span>Edit</span>
                      </button>
                      {showConfirmDelete ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary qb-small-btn"
                            onClick={() => setShowConfirmDelete(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger qb-small-btn"
                            style={{ background: '#EF4444', color: '#fff', borderColor: '#DC2626' }}
                            onClick={handleDeleteQuestion}
                          >
                            Confirm Delete?
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary qb-small-btn qb-danger-btn"
                          onClick={handleDeleteQuestion}
                        >
                          <ion-icon name="trash-outline"></ion-icon>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="qb-q-prompt">{currentQ.question}</h3>

                  {(currentQ.image || currentQ.imageUrl) && (
                    <div className="qb-review-diagram-box">
                      <img
                        src={resolveAssetUrl(currentQ.image || currentQ.imageUrl)}
                        alt="Question Figure"
                        className="qb-review-diagram-img"
                      />
                    </div>
                  )}

                  <div className="qb-view-options-list">
                    {Array.isArray(currentQ.options) &&
                      currentQ.options.map((opt) => {
                        const isCorrect = currentQ.correctOption === opt.id
                        return (
                          <div
                            key={opt.id}
                            className={`qb-view-option ${isCorrect ? 'is-correct' : ''}`}
                          >
                            <span className="qb-opt-letter">{opt.id}</span>
                            <span className="qb-opt-text">{opt.text}</span>
                            {isCorrect && (
                              <span className="qb-correct-badge">
                                <ion-icon name="checkmark-circle"></ion-icon> Correct Answer
                              </span>
                            )}
                          </div>
                        )
                      })}
                  </div>

                  <div className="qb-explanation-panel">
                    <div className="qb-exp-title">
                      <ion-icon name="bulb-outline"></ion-icon>
                      <span>Explanation:</span>
                    </div>

                    {currentQ.explanationImage && (
                      <div className="qb-review-diagram-box" style={{ margin: '10px 0' }}>
                        <img
                          src={resolveAssetUrl(currentQ.explanationImage)}
                          alt="Explanation Solution Figure"
                          className="qb-review-diagram-img"
                        />
                      </div>
                    )}

                    <p className="qb-exp-text">
                      {currentQ.explanation || (
                        <em style={{ color: 'var(--text-color-muted)' }}>No explanation provided.</em>
                      )}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Footer */}
          <div className="qb-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAllToBank}
              disabled={isEditing}
            >
              Save All Changes to Bank
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionReviewer
