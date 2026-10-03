import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getStudentBySlug } from '../data/students'

const BASE_TITLE = 'Next Step Tutoring'

function NotesPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [demoClicks, setDemoClicks] = useState(0)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    if (slug) {
      const student = getStudentBySlug(slug)
      if (student) {
        document.title = `${student.name}'s Student Record | ${BASE_TITLE}`
      } else {
        document.title = `Student Not Found | ${BASE_TITLE}`
      }
    } else {
      document.title = `Student Record | ${BASE_TITLE}`
    }
    return () => { document.title = BASE_TITLE }
  }, [slug])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter a student name.')
      return
    }
    const student = getStudentBySlug(trimmed)
    if (student) {
      setError('')
      navigate(`/studentrecords/${student.slug}`)
    } else {
      setError('Student not found. Please check and try again.')
    }
  }

  const handleDemoClick = () => {
    setDemoClicks((prev) => prev + 1)
    setShowDemo(true)
  }

  // If no slug provided, show input form
  if (!slug) {
    return (
      <article className="notes-page active" data-page="notes">
        <header>
          <h2 className="h2 article-title">Student Record</h2>
        </header>

        <section className="notes-intro">
          <p className="about-text">
            Enter your student name to view student records.
          </p>
        </section>

        <form className="notes-access-form" onSubmit={handleSubmit}>
          <div className="notes-input-group">
            <ion-icon name="person-outline"></ion-icon>
            <input
              type="text"
              className="notes-input"
              placeholder="e.g. kavitha-001"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setError('') }}
              autoFocus
            />
          </div>
          {error && <p className="notes-error">{error}</p>}
          <button type="submit" className="hero-cta-btn primary">
            <span>View Record</span>
            <ion-icon name="arrow-forward-outline"></ion-icon>
          </button>
        </form>

        <div className="notes-demo-section">
          <button
            type="button"
            className={`demo-cta-btn${demoClicks > 0 ? ' demo-cta-btn--popping' : ''}`}
            key={demoClicks}
            onClick={handleDemoClick}
          >
            <span>See demo homework/correction</span>
            <span className="demo-cta-arrow">
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </span>
          </button>

          {showDemo && (
            <div className="demo-popover">
              <div className="demo-popover-card">
                <span className="demo-popover-tag">DEMO</span>
                {/* Future plan: Pre-Algebra PDF row
                <div className="demo-popover-row">
                  <div className="demo-popover-info">
                    <h4 className="h4 demo-popover-title">Pre-Algebra</h4>
                    <p className="demo-popover-text">Sample homework & correction pdf</p>
                  </div>
                  <a
                    href="/demo-pre-algebra.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="demo-open-btn"
                  >
                    <span>Open PDF</span>
                    <ion-icon name="open-outline"></ion-icon>
                  </a>
                </div>
                */}

                <div className="demo-popover-row">
                  <div className="demo-popover-info">
                    <h4 className="h4 demo-popover-title">Algebra 1 Correction</h4>
                    <p className="demo-popover-text">Demo correction sample</p>
                  </div>
                  <a
                    href="/demo-algebra-1.jpeg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="demo-open-btn"
                  >
                    <span>Open</span>
                    <ion-icon name="open-outline"></ion-icon>
                  </a>
                </div>
                <button
                  type="button"
                  className="demo-close-btn"
                  onClick={() => setShowDemo(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </article>
    )
  }

  const student = getStudentBySlug(slug)

  if (!student) {
    return (
      <article className="notes-page active" data-page="notes">
        <header>
          <h2 className="h2 article-title">Student Record</h2>
        </header>

        <div className="notes-not-found">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <h3>Student Not Found</h3>
          <p>The student you're looking for doesn't exist.</p>
          <Link to="/studentrecords" className="hero-cta-btn secondary">
            <ion-icon name="arrow-back-outline"></ion-icon>
            <span>Try Again</span>
          </Link>
        </div>
      </article>
    )
  }

  const embedUrl = `https://docs.google.com/document/d/e/${student.docId}/pub?embedded=true`

  return (
    <article className="notes-page active" data-page="notes">
      <header>
        <h2 className="h2 article-title">Student Record</h2>
      </header>

      <div className="notes-student-header">
        <Link to="/studentrecords" className="notes-back-link">
          <ion-icon name="arrow-back-outline"></ion-icon>
          <span>Back</span>
        </Link>
        <h3 className="h3">{student.name}'s Student Record</h3>
      </div>

      <div className="iframe-wrapper">
        <iframe
          src={embedUrl}
          title={`${student.name}'s Student Record`}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          className="notes-iframe"
          loading="lazy"
          allow="fullscreen"
        />
      </div>

      <div className="notes-footer">
        <p>Student records are updated after each class</p>
      </div>
    </article>
  )
}

export default NotesPage
