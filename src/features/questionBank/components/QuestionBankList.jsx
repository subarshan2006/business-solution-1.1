import { useState, useEffect } from 'react'
import {
  getQuestionBanks,
  deleteQuestionBank,
  saveQuestionBank,
  purgeAllLocalStorageBanks,
} from '../services/questionBankStorage'
import {
  questionBankApi,
  testManagementApi,
} from '../../../services/nxtstepApi'
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
  const [bankToDelete, setBankToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPurgeAllModal, setShowPurgeAllModal] = useState(false)
  const [isPurging, setIsPurging] = useState(false)

  const reloadBanks = async () => {
    // 1. Immediately load local banks for zero-latency UI display
    const localList = getQuestionBanks() || []
    setBanks(localList)

    // 2. Fetch all persistent question banks from MongoDB Atlas
    try {
      const backendBanks = await questionBankApi.listQuestionBanks()
      if (Array.isArray(backendBanks)) {
        const updatedLocal = [...localList]
        let hasChanges = false

        backendBanks.forEach((bb) => {
          const matchIdx = updatedLocal.findIndex(
            (b) => b.backendBankId === bb.id || b.id === bb.id || b.title === bb.title
          )

          const qCount = bb._count?.questions ?? (Array.isArray(bb.questions) ? bb.questions.length : 0)
          const latestJob = bb.jobs?.[0] || null

          if (matchIdx !== -1) {
            const existing = updatedLocal[matchIdx]
            const updated = {
              ...existing,
              backendBankId: bb.id,
              status: bb.status,
              processingProgress:
                latestJob?.progress ??
                (bb.status === 'READY_FOR_REVIEW' || bb.status === 'APPROVED' ? 100 : null),
              processingStep: latestJob?.currentStep ?? null,
              questionCount:
                Array.isArray(existing.questions) && existing.questions.length > 0
                  ? existing.questions.length
                  : (qCount || existing.questionCount || 0),
            }
            updatedLocal[matchIdx] = updated
            saveQuestionBank(updated)
            hasChanges = true
          } else {
            // Newly created bank from backend (e.g. processed in background or on reload)
            const newLocalBank = {
              id: bb.id,
              backendBankId: bb.id,
              title: bb.title,
              subject: bb.subject || 'AP Biology',
              description: bb.description || '',
              published: bb.status === 'APPROVED' || bb.status === 'READY_FOR_REVIEW',
              status: bb.status,
              createdAt: bb.createdAt,
              updatedAt: bb.updatedAt,
              questionCount: qCount,
              processingProgress:
                latestJob?.progress ??
                (bb.status === 'READY_FOR_REVIEW' || bb.status === 'APPROVED' ? 100 : null),
              processingStep: latestJob?.currentStep ?? null,
              settings: {
                randomizeQuestions: true,
                randomizeOptions: true,
                oneAttempt: true,
                showExplanation: true,
                timeLimitMinutes: 20,
                quizEndingHours: 3,
              },
              authorizedStudents: [],
              questions: [],
            }
            updatedLocal.push(newLocalBank)
            saveQuestionBank(newLocalBank)
            hasChanges = true
          }
        })

        if (hasChanges) {
          setBanks([...updatedLocal])
        }
      }
    } catch (err) {
      console.warn('Backend listQuestionBanks sync note:', err)
    }
  }

  useEffect(() => {
    reloadBanks()
  }, [])

  // Auto-poll progress if any bank is in PROCESSING state
  useEffect(() => {
    const hasProcessing = banks.some(
      (b) => b.status === 'PROCESSING' || (b.processingProgress !== null && b.processingProgress < 100)
    )
    if (!hasProcessing) return

    const pollInterval = setInterval(() => {
      reloadBanks()
    }, 4000)

    return () => clearInterval(pollInterval)
  }, [banks])

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

  const handleConfirmDelete = async () => {
    if (!bankToDelete) return
    setIsDeleting(true)
    try {
      // 1. Try deleting from backend if matching bank exists
      const targetId = bankToDelete.backendBankId || (bankToDelete.id && !bankToDelete.id.startsWith('qb_') ? bankToDelete.id : null)
      if (targetId) {
        try {
          await questionBankApi.deleteQuestionBank(targetId)
        } catch (apiErr) {
          console.warn('Backend question-bank delete notice:', apiErr)
        }
      } else {
        try {
          const remoteBanks = await questionBankApi.listQuestionBanks()
          const match = Array.isArray(remoteBanks)
            ? remoteBanks.find((b) => b.id === bankToDelete.id || b.title === bankToDelete.title)
            : null
          if (match?.id) {
            await questionBankApi.deleteQuestionBank(match.id)
          }
        } catch (matchErr) {
          console.warn('Backend question-bank query notice:', matchErr)
        }
      }

      // 2. Try deleting matching test if testId exists
      if (bankToDelete.testId) {
        try {
          await testManagementApi.deleteTest(bankToDelete.testId)
        } catch (testErr) {
          console.warn('Backend test delete notice:', testErr)
        }
      }

      // 3. Delete from localStorage
      deleteQuestionBank(bankToDelete.id)
      reloadBanks()
      showNotification(`Deleted "${bankToDelete.title}" successfully.`)
      setBankToDelete(null)
    } catch (err) {
      console.error('Failed to delete question bank:', err)
      deleteQuestionBank(bankToDelete.id)
      reloadBanks()
      showNotification(`Deleted "${bankToDelete.title}".`)
      setBankToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleConfirmPurgeAll = async () => {
    setIsPurging(true)
    try {
      // 1. Purge all from backend (GridFS chunks, questions, banks)
      try {
        await questionBankApi.purgeAllQuizzesAndScreenshots()
      } catch (apiErr) {
        console.warn('Backend purge-all notice:', apiErr)
      }

      // 2. Purge local storage
      purgeAllLocalStorageBanks()
      reloadBanks()
      showNotification('Successfully purged all quizzes and screenshots from database. Storage reset.')
      setShowPurgeAllModal(false)
    } catch (err) {
      console.error('Failed to purge database:', err)
      purgeAllLocalStorageBanks()
      reloadBanks()
      showNotification('Cleaned local quiz storage.')
      setShowPurgeAllModal(false)
    } finally {
      setIsPurging(false)
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 14px',
            }}
            onClick={() => setShowPurgeAllModal(true)}
            title="Clear all quiz screenshots from database to free up MongoDB 512MB storage"
          >
            <ion-icon name="trash-bin-outline" style={{ fontSize: '16px' }}></ion-icon>
            <span>Clear Database (Free Storage)</span>
          </button>
          <button
            type="button"
            className="btn btn-primary qb-create-btn"
            onClick={() => handleOpenModal('create')}
          >
            <ion-icon name="add-circle-outline"></ion-icon>
            <span>Create Question Bank</span>
          </button>
        </div>
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
            const questionCount =
              Array.isArray(bank.questions) && bank.questions.length > 0
                ? bank.questions.length
                : (bank.questionCount || 0)
            const studentCount = Array.isArray(bank.authorizedStudents) ? bank.authorizedStudents.length : 0

            return (
              <div key={bank.id} className="qb-card">
                <div className="qb-card-header">
                  <span className="qb-subject-badge">{bank.subject || 'AP Biology'}</span>
                  {bank.status === 'PROCESSING' ? (
                    <span
                      className="qb-status-pill draft"
                      style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      title={bank.processingStep || 'Processing pages in background'}
                    >
                      <span className="qb-status-dot" style={{ backgroundColor: '#F59E0B' }}></span>
                      Processing ({bank.processingProgress || 0}%)
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`qb-status-pill ${bank.published ? 'published' : 'draft'}`}
                      onClick={() => handleTogglePublished(bank)}
                      title="Click to toggle publish status"
                    >
                      <span className="qb-status-dot"></span>
                      {bank.published ? 'Published' : 'Draft'}
                    </button>
                  )}
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
                      onClick={() => onLaunchQuiz(bank.backendBankId || bank.id)}
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
                    onClick={() => setBankToDelete(bank)}
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

      {/* Delete Confirmation Popup Card Modal */}
      {bankToDelete && (
        <div
          className="qb-modal-backdrop"
          onClick={() => !isDeleting && setBankToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="qb-modal-card"
            style={{ maxWidth: '480px', border: '1px solid rgba(239, 68, 68, 0.35)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qb-modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  <ion-icon name="trash-outline"></ion-icon>
                </div>
                <div>
                  <h3 className="qb-modal-title" style={{ color: '#F87171' }}>
                    Delete Question Bank
                  </h3>
                  <p className="qb-modal-subtitle">Permanent action — cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                className="qb-modal-close-btn"
                onClick={() => !isDeleting && setBankToDelete(null)}
                aria-label="Close dialog"
                disabled={isDeleting}
              >
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>

            <div className="qb-modal-body" style={{ padding: '20px 24px' }}>
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-1, #F4F4F5)',
                  marginBottom: '16px',
                }}
              >
                Are you sure you want to delete <strong style={{ color: '#fff' }}>&ldquo;{bankToDelete.title}&rdquo;</strong>?
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#FCA5A5',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <ion-icon
                    name="warning-outline"
                    style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}
                  ></ion-icon>
                  <div>
                    This will permanently delete the quiz, all questions, diagram screenshots, and student attempt scores for both teacher and enrolled students.
                  </div>
                </div>
              </div>

              <div
                className="qb-meta-row"
                style={{ marginTop: '8px', color: 'var(--text-2, #A1A1AA)', fontSize: '13px' }}
              >
                <div className="qb-meta-item">
                  <ion-icon name="help-circle-outline"></ion-icon>
                  <span>
                    {Array.isArray(bankToDelete.questions) ? bankToDelete.questions.length : 0} Questions
                  </span>
                </div>
                <div className="qb-meta-item">
                  <ion-icon name="people-outline"></ion-icon>
                  <span>
                    {Array.isArray(bankToDelete.authorizedStudents)
                      ? bankToDelete.authorizedStudents.length
                      : 0}{' '}
                    Students
                  </span>
                </div>
              </div>
            </div>

            <div
              className="qb-modal-footer"
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '16px 24px',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setBankToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  background: '#EF4444',
                  borderColor: '#DC2626',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <ion-icon name="trash-outline"></ion-icon>
                    <span>Delete Question Bank</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge All Database & Screenshots Confirmation Modal */}
      {showPurgeAllModal && (
        <div
          className="qb-modal-backdrop"
          onClick={() => !isPurging && setShowPurgeAllModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="qb-modal-card"
            style={{ maxWidth: '520px', border: '1px solid rgba(239, 68, 68, 0.45)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qb-modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  <ion-icon name="nuclear-outline"></ion-icon>
                </div>
                <div>
                  <h3 className="qb-modal-title" style={{ color: '#F87171' }}>
                    Clear Database & Screenshots
                  </h3>
                  <p className="qb-modal-subtitle">Frees up 100% of MongoDB Atlas storage</p>
                </div>
              </div>
              <button
                type="button"
                className="qb-modal-close-btn"
                onClick={() => !isPurging && setShowPurgeAllModal(false)}
                aria-label="Close dialog"
                disabled={isPurging}
              >
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>

            <div className="qb-modal-body" style={{ padding: '20px 24px' }}>
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-1, #F4F4F5)',
                  marginBottom: '16px',
                }}
              >
                Are you sure you want to delete <strong>ALL quizzes, questions, and screenshots</strong> from the database?
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#FCA5A5',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <ion-icon
                    name="warning-outline"
                    style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}
                  ></ion-icon>
                  <div>
                    <strong>Why use this:</strong> On the MongoDB free tier (512MB limit), storing multiple quiz diagrams can fill up storage. This action deletes all binary chunks and question data, returning your database storage back to <strong>0 MB</strong>.
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2, #A1A1AA)', margin: 0 }}>
                This action is permanent and cannot be undone.
              </p>
            </div>

            <div
              className="qb-modal-footer"
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '16px 24px',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPurgeAllModal(false)}
                disabled={isPurging}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  background: '#EF4444',
                  borderColor: '#DC2626',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={handleConfirmPurgeAll}
                disabled={isPurging}
              >
                {isPurging ? (
                  <>
                    <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                    <span>Purging MongoDB Storage...</span>
                  </>
                ) : (
                  <>
                    <ion-icon name="trash-bin-outline"></ion-icon>
                    <span>Confirm Clear Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
