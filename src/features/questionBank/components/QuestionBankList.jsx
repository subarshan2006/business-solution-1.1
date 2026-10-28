import { useState, useEffect } from 'react'
import {
  getQuestionBanks,
  deleteQuestionBank,
  saveQuestionBank,
} from '../services/questionBankStorage'
import CreateQuestionBankModal from './CreateQuestionBankModal'
import StudentAccessModal from './StudentAccessModal'
import QuestionImportModal from './QuestionImportModal'
import QuestionReviewer from './QuestionReviewer'
import AttemptDashboard from './AttemptDashboard'

function QuestionBankList({ onLaunchQuiz }) {
  const [banks, setBanks] = useState([])
  const [activeModal, setActiveModal] = useState(null) // 'create' | 'access' | 'import' | 'review' | 'attempts'
  const [selectedBank, setSelectedBank] = useState(null)
  const [notice, setNotice] = useState('')

  const reloadBanks = () => {
    const list = getQuestionBanks()
    setBanks(list)
  }

  useEffect(() => {
    reloadBanks()
  }, [])

  const showNotification = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 4000)
  }

  const handleOpenModal = (modalType, bank = null) => {
    setSelectedBank(bank)
    setActiveModal(modalType)
  }

  const handleCloseModal = () => {
    setActiveModal(null)
    setSelectedBank(null)
    reloadBanks()
  }

  const handleDelete = (bank) => {
    if (window.confirm(`Are you sure you want to delete the question bank "${bank.title}"?`)) {
      deleteQuestionBank(bank.id)
      reloadBanks()
      showNotification(`Deleted "${bank.title}"`)
    }
  }

  const handleTogglePublished = (bank) => {
    const updated = { ...bank, published: !bank.published }
    saveQuestionBank(updated)
    reloadBanks()
    showNotification(`Question bank is now ${updated.published ? 'Published' : 'Draft'}.`)
  }

  return (
    <div className="qb-dashboard-container">
      {/* Top Banner / Actions */}
      <div className="qb-header-row">
        <div>
          <h2 className="qb-title">Question Banks</h2>
          <p className="qb-subtitle">
            Create, import, and manage question banks. Grant direct access by student email with zero Classroom API dependency.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary qb-create-btn"
          onClick={() => handleOpenModal('create')}
        >
          <ion-icon name="add-circle-outline"></ion-icon>
          <span>Create Question Bank</span>
        </button>
      </div>

      {notice && <div className="qb-alert-toast">{notice}</div>}

      {/* Grid of Banks */}
      {banks.length === 0 ? (
        <div className="qb-empty-state">
          <ion-icon name="albums-outline" class="qb-empty-icon"></ion-icon>
          <h3>No Question Banks Yet</h3>
          <p>Create your first question bank or import questions from a PDF / text file.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenModal('create')}
          >
            Create Question Bank
          </button>
        </div>
      ) : (
        <div className="qb-grid">
          {banks.map((bank) => {
            const questionCount = Array.isArray(bank.questions) ? bank.questions.length : 0
            const studentCount = Array.isArray(bank.authorizedStudents) ? bank.authorizedStudents.length : 0

            return (
              <div key={bank.id} className="qb-card">
                <div className="qb-card-header">
                  <span className="qb-subject-badge">{bank.subject || 'AP Biology'}</span>
                  <button
                    type="button"
                    className={`qb-status-pill ${bank.published ? 'published' : 'draft'}`}
                    onClick={() => handleTogglePublished(bank)}
                    title="Click to toggle publish status"
                  >
                    <span className="qb-status-dot"></span>
                    {bank.published ? 'Published' : 'Draft'}
                  </button>
                </div>

                <h3 className="qb-card-title">{bank.title}</h3>
                <p className="qb-card-desc">{bank.description || 'No description provided.'}</p>

                <div className="qb-meta-row">
                  <div className="qb-meta-item">
                    <ion-icon name="help-circle-outline"></ion-icon>
                    <span>{questionCount} Questions</span>
                  </div>
                  <div className="qb-meta-item">
                    <ion-icon name="people-outline"></ion-icon>
                    <span>{studentCount} Students</span>
                  </div>
                  <div className="qb-meta-item">
                    <ion-icon name="timer-outline"></ion-icon>
                    <span>{bank.settings?.timeLimitMinutes ? `${bank.settings.timeLimitMinutes}m` : 'Untimed'}</span>
                  </div>
                  <div className="qb-meta-item" title="After 3 hours, question diagrams & screenshots auto-shred permanently">
                    <ion-icon name="trash-bin-outline" style={{ color: 'var(--mint, #FF5C5C)' }}></ion-icon>
                    <span>{bank.settings?.quizEndingHours || 3}h Auto-Delete</span>
                  </div>
                  {bank.settings?.oneAttempt && (
                    <div className="qb-meta-item" title="1-attempt per student">
                      <ion-icon name="lock-closed-outline"></ion-icon>
                      <span>1 Attempt</span>
                    </div>
                  )}
                </div>

                <div className="qb-actions-menu">
                  <button
                    type="button"
                    className="qb-action-btn"
                    onClick={() => handleOpenModal('review', bank)}
                    title="Review & edit questions"
                  >
                    <ion-icon name="create-outline"></ion-icon>
                    <span>Questions ({questionCount})</span>
                  </button>
                  <button
                    type="button"
                    className="qb-action-btn"
                    onClick={() => handleOpenModal('import', bank)}
                    title="Import questions from PDF or text"
                  >
                    <ion-icon name="cloud-upload-outline"></ion-icon>
                    <span>Import</span>
                  </button>
                  <button
                    type="button"
                    className="qb-action-btn"
                    onClick={() => handleOpenModal('access', bank)}
                    title="Manage authorized student emails"
                  >
                    <ion-icon name="person-add-outline"></ion-icon>
                    <span>Students ({studentCount})</span>
                  </button>
                  <button
                    type="button"
                    className="qb-action-btn"
                    onClick={() => handleOpenModal('attempts', bank)}
                    title="View student scores & attempts"
                  >
                    <ion-icon name="stats-chart-outline"></ion-icon>
                    <span>Attempts</span>
                  </button>
                  {onLaunchQuiz && questionCount > 0 && (
                    <button
                      type="button"
                      className="qb-action-btn qb-preview-btn"
                      onClick={() => onLaunchQuiz(bank.id)}
                      title="Preview student quiz"
                    >
                      <ion-icon name="play-outline"></ion-icon>
                      <span>Preview</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="qb-action-btn qb-edit-btn"
                    onClick={() => handleOpenModal('create', bank)}
                    title="Edit bank settings"
                  >
                    <ion-icon name="settings-outline"></ion-icon>
                  </button>
                  <button
                    type="button"
                    className="qb-action-btn qb-delete-btn"
                    onClick={() => handleDelete(bank)}
                    title="Delete question bank"
                  >
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'create' && (
        <CreateQuestionBankModal
          bank={selectedBank}
          onClose={handleCloseModal}
          onSaved={(newBank) => {
            showNotification(`Saved "${newBank.title}" successfully.`)
            handleCloseModal()
          }}
        />
      )}

      {activeModal === 'access' && selectedBank && (
        <StudentAccessModal
          bank={selectedBank}
          onClose={handleCloseModal}
          onSaved={(updatedBank) => {
            showNotification(`Updated student access for "${updatedBank.title}".`)
            handleCloseModal()
          }}
        />
      )}

      {activeModal === 'import' && selectedBank && (
        <QuestionImportModal
          bank={selectedBank}
          onClose={handleCloseModal}
          onImported={(updatedBank, count) => {
            showNotification(`Imported ${count} questions into "${updatedBank.title}".`)
            handleCloseModal()
          }}
        />
      )}

      {activeModal === 'review' && selectedBank && (
        <QuestionReviewer
          bank={selectedBank}
          onClose={handleCloseModal}
          onSaved={(updatedBank) => {
            showNotification(`Updated questions in "${updatedBank.title}".`)
            handleCloseModal()
          }}
        />
      )}

      {activeModal === 'attempts' && selectedBank && (
        <AttemptDashboard
          bank={selectedBank}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default QuestionBankList
