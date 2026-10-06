import { useEffect } from 'react'

function AssignmentModal({ assignment, courseName, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!assignment) return null

  const sub = assignment.submission
  const subState = sub?.state || 'ASSIGNED'
  const isGraded = subState === 'RETURNED'
  const isSubmitted = subState === 'TURNED_IN'

  const dueStr = assignment.dueDate
    ? `${assignment.dueDate.month}/${assignment.dueDate.day}/${assignment.dueDate.year}`
    : 'No deadline set'

  return (
    <div className="assignment-modal-backdrop" onClick={onClose}>
      <div className="assignment-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="assignment-modal-header">
          <div>
            <div className="modal-tag-row">
              <span className="modal-subject-tag">{courseName || 'Tutoring Course'}</span>
              {assignment.topic && <span className="modal-topic-tag">{assignment.topic}</span>}
              <span className={`status-pill ${subState.toLowerCase()}`}>
                {isGraded ? 'Graded ✓' : isSubmitted ? 'Submitted' : 'Assigned'}
              </span>
            </div>
            <h3 className="h3 modal-assignment-title">{assignment.title}</h3>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        {/* Quick Meta Grid */}
        <div className="modal-meta-grid">
          <div className="modal-meta-item">
            <ion-icon name="calendar-outline"></ion-icon>
            <div>
              <span className="meta-label">Deadline</span>
              <strong className="meta-val">{dueStr}</strong>
            </div>
          </div>
          <div className="modal-meta-item">
            <ion-icon name="ribbon-outline"></ion-icon>
            <div>
              <span className="meta-label">Max Score</span>
              <strong className="meta-val">{assignment.maxPoints || 20} Points</strong>
            </div>
          </div>
          <div className="modal-meta-item">
            <ion-icon name="checkmark-done-circle-outline"></ion-icon>
            <div>
              <span className="meta-label">Status</span>
              <strong className="meta-val">
                {isGraded
                  ? `Graded (${sub.assignedGrade} / ${assignment.maxPoints || 20})`
                  : isSubmitted
                  ? 'Turned In'
                  : 'Pending Completion'}
              </strong>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="assignment-modal-body">
          {/* Instructions */}
          <div className="modal-section">
            <h4 className="h4 modal-section-title">Assignment Prompt & Instructions</h4>
            <p className="modal-desc-text">
              {assignment.description || 'No additional instructions provided for this assignment.'}
            </p>
          </div>

          {/* Attached Materials */}
          {assignment.materialLinks && assignment.materialLinks.length > 0 ? (
            <div className="modal-section">
              <h4 className="h4 modal-section-title">Lesson Worksheets & Materials</h4>
              <div className="materials-pills-list">
                {assignment.materialLinks.map((mat, idx) => (
                  mat.url ? (
                    <a
                      key={idx}
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="material-file-item clickable-material-link"
                      style={{ textDecoration: 'none' }}
                    >
                      <ion-icon name={mat.type === 'drive' ? 'document-text-outline' : mat.type === 'youtube' ? 'logo-youtube' : mat.type === 'form' ? 'clipboard-outline' : 'link-outline'}></ion-icon>
                      <span>{mat.title}</span>
                      <ion-icon name="open-outline" style={{ fontSize: '12px', opacity: 0.7 }}></ion-icon>
                    </a>
                  ) : (
                    <div key={idx} className="material-file-item">
                      <ion-icon name="document-attach-outline"></ion-icon>
                      <span>{mat.title}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : assignment.materials && assignment.materials.length > 0 ? (
            <div className="modal-section">
              <h4 className="h4 modal-section-title">Lesson Worksheets & Materials</h4>
              <div className="materials-pills-list">
                {assignment.materials.map((mat, idx) => (
                  <div key={idx} className="material-file-item">
                    <ion-icon name="document-attach-outline"></ion-icon>
                    <span>{typeof mat === 'string' ? mat : mat?.title || 'Attached Document'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Student Submitted Files if available */}
          {sub?.attachments && sub.attachments.length > 0 && (
            <div className="modal-section">
              <h4 className="h4 modal-section-title">Turned-In Student Work</h4>
              <div className="materials-pills-list">
                {sub.attachments.map((att, idx) => (
                  att.url ? (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="material-file-item"
                      style={{ textDecoration: 'none', background: 'rgba(117, 209, 180, 0.15)', borderColor: '#75d1b4' }}
                    >
                      <ion-icon name="document-attach-outline"></ion-icon>
                      <span>{att.title}</span>
                      <ion-icon name="open-outline" style={{ fontSize: '12px', opacity: 0.7 }}></ion-icon>
                    </a>
                  ) : (
                    <div key={idx} className="material-file-item" style={{ background: 'rgba(117, 209, 180, 0.15)' }}>
                      <ion-icon name="document-attach-outline"></ion-icon>
                      <span>{att.title}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Teacher Feedback / Correction if available */}
          {sub?.teacherFeedback && (
            <div className="modal-section feedback-section">
              <h4 className="h4 modal-section-title">
                <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
                <span>Educator Feedback & Annotations</span>
              </h4>
              <div className="feedback-quote-card">
                <p>"{sub.teacherFeedback}"</p>
                <span className="feedback-author">— Lead Instructor, Jivanaut Test Prep</span>
              </div>
            </div>
          )}

          {/* Completion Checklist */}
          <div className="modal-section">
            <h4 className="h4 modal-section-title">Submission Workflow</h4>
            <div className="workflow-checklist">
              <div className={`checklist-item ${assignment.materials ? 'done' : ''}`}>
                <ion-icon name="checkbox-outline"></ion-icon>
                <span>Review prompt instructions and reference diagrams</span>
              </div>
              <div className={`checklist-item ${isSubmitted || isGraded ? 'done' : ''}`}>
                <ion-icon name={isSubmitted || isGraded ? 'checkbox-outline' : 'square-outline'}></ion-icon>
                <span>Draft written FRQ reasoning and graph solutions</span>
              </div>
              <div className={`checklist-item ${isSubmitted || isGraded ? 'done' : ''}`}>
                <ion-icon name={isSubmitted || isGraded ? 'checkbox-outline' : 'square-outline'}></ion-icon>
                <span>Submit problem set for individual grading</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="assignment-modal-footer">
          {assignment.alternateLink && (
            <a
              href={assignment.alternateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-ext-link"
            >
              <ion-icon name="open-outline"></ion-icon>
              <span>Open in Google Classroom App</span>
            </a>
          )}
          <button type="button" className="hero-cta-btn secondary" onClick={onClose}>
            <span>Close Details</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignmentModal
