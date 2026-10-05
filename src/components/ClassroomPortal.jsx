import { useState, useEffect } from 'react'
import {
  getStoredAuth,
  saveAuth,
  clearAuth,
  requestGoogleAccessToken,
  signOutGoogle,
} from '../services/googleAuth'
import {
  determineRole,
  listTeacherCourses,
  listStudentCourses,
  listCourseWork,
  MOCK_20_CLASSROOMS,
  MOCK_ASSIGNMENTS,
} from '../services/classroomApi'
import ParentDashboard from './ParentDashboard'
import AssignmentModal from './AssignmentModal'

function ClassroomPortal() {
  const [auth, setAuth] = useState(() => getStoredAuth())
  const [role, setRole] = useState(auth?.role || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseWork, setCourseWork] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('courses') // 'courses', 'homework', 'grades', 'parent'
  const [gradeFilter, setGradeFilter] = useState('all') // 'all', 'Grade 10', 'Grade 11', 'Grade 12'
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  // Load courses when auth or role changes
  useEffect(() => {
    if (!auth) {
      setCourses([])
      setSelectedCourse(null)
      return
    }

    if (auth.isMock) {
      if (role === 'teacher') {
        setCourses(MOCK_20_CLASSROOMS)
        setSelectedCourse(MOCK_20_CLASSROOMS[0])
        setCourseWork(MOCK_ASSIGNMENTS)
      } else {
        const studentCourse = MOCK_20_CLASSROOMS[0]
        setCourses([studentCourse])
        setSelectedCourse(studentCourse)
        setCourseWork(MOCK_ASSIGNMENTS)
      }
      return
    }

    // Real API fetch
    async function fetchRealClassroomData() {
      setLoading(true)
      setError('')
      try {
        let userRole = role
        if (!userRole) {
          const roleResult = await determineRole(auth.accessToken, auth.user?.email)
          userRole = roleResult.role
          setRole(userRole)
          saveAuth({ ...auth, role: userRole })
        }

        if (userRole === 'teacher') {
          const list = await listTeacherCourses(auth.accessToken)
          setCourses(list)
          if (list.length > 0) setSelectedCourse(list[0])
        } else {
          const list = await listStudentCourses(auth.accessToken)
          setCourses(list)
          if (list.length > 0) setSelectedCourse(list[0])
        }
      } catch (err) {
        console.error('Failed to load courses from Google Classroom:', err)
        setError(err.message || 'Failed to fetch classrooms from Google.')
      } finally {
        setLoading(false)
      }
    }

    fetchRealClassroomData()
  }, [auth, role])

  // Fetch coursework when selectedCourse changes in live mode
  useEffect(() => {
    if (!selectedCourse || !auth || auth.isMock) return

    async function fetchCourseWork() {
      try {
        const cw = await listCourseWork(selectedCourse.id, auth.accessToken)
        setCourseWork(cw)
      } catch (err) {
        console.warn('Could not fetch coursework for selected course:', err)
      }
    }

    fetchCourseWork()
  }, [selectedCourse, auth])

  const handleConnectLive = async () => {
    setLoading(true)
    setError('')
    try {
      const authData = await requestGoogleAccessToken()
      const roleResult = await determineRole(authData.accessToken, authData.user?.email)
      const fullAuth = { ...authData, role: roleResult.role }
      setRole(roleResult.role)
      setAuth(fullAuth)
      saveAuth(fullAuth)
    } catch (err) {
      if (err.message === 'MISSING_CLIENT_ID') {
        setError('OAuth Client ID is missing. Add VITE_GOOGLE_CLIENT_ID in your .env file.')
      } else {
        setError(err.message || 'Failed to authenticate with Google.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchRole = (newRole) => {
    setRole(newRole)
    if (auth) {
      saveAuth({ ...auth, role: newRole })
    }
    if (newRole === 'parent') {
      setActiveTab('parent')
    } else {
      setActiveTab('courses')
    }
  }


  const handleDisconnect = () => {
    if (auth && !auth.isMock) {
      signOutGoogle(auth.accessToken)
    } else {
      clearAuth()
    }
    setAuth(null)
    setRole(null)
    setCourses([])
    setSelectedCourse(null)
    setSelectedAssignment(null)
    setActiveTab('courses')
  }

  // Filter classrooms by search term and grade level
  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.section && c.section.toLowerCase().includes(term)) ||
      (c.studentName && c.studentName.toLowerCase().includes(term))

    const matchesGrade =
      gradeFilter === 'all' ||
      (c.grade && c.grade.toLowerCase() === gradeFilter.toLowerCase()) ||
      (c.section && c.section.toLowerCase().includes(gradeFilter.toLowerCase()))

    return matchesSearch && matchesGrade
  })

  // Extract student name for the selected course
  const currentStudentName = selectedCourse?.studentName || (role === 'student' ? auth?.user?.name : 'Alex Rivera')

  return (
    <article className="classroom-portal active" data-page="classroom">
      <br /><br />
      <header>
        <h2 className="h2 article-title">Google Classroom Portal</h2>
      </header>

      {/* Auth Banner & Controls */}
      <section className="classroom-auth-card">
        {!auth ? (
          <div className="classroom-connect-prompt">
            <div className="prompt-header">
              <div className="google-icon-wrapper">
                <ion-icon name="school-outline"></ion-icon>
              </div>
              <div>
                <h3 className="h3">Connect to Google Classroom</h3>
                <p className="classroom-desc">
                  Seamlessly sync 1-on-1 tutoring classrooms, assignments, student submissions, and parent progress reports.
                </p>
              </div>
            </div>

            {error && (
              <div className="classroom-error-banner">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span>{error}</span>
              </div>
            )}

            <div className="classroom-actions-row">
              <button
                type="button"
                className="google-connect-btn"
                onClick={handleConnectLive}
                disabled={loading}
              >
                <ion-icon name="logo-google"></ion-icon>
                <span>{loading ? 'Connecting...' : 'Connect with Google'}</span>
              </button>
            </div>

            {!hasClientId && (
              <div className="classroom-info-box">
                <ion-icon name="information-circle-outline"></ion-icon>
                <div>
                  <strong>Google Cloud Setup Note:</strong> Add your <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code> to connect your live Google account.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="classroom-connected-bar">
            <div className="user-profile-meta">
              <img
                src={auth.user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                alt={auth.user.name}
                className="user-avatar"
              />
              <div>
                <div className="user-name-row">
                  <h4 className="h4 user-display-name">{auth.user.name}</h4>
                  <span className={`role-badge ${role}`}>{role?.toUpperCase()}</span>
                  {auth.isMock && <span className="mock-badge">PREVIEW MODE</span>}
                </div>
                <p className="user-email-text">{auth.user.email}</p>
              </div>
            </div>

            <div className="connected-controls">
              <div className="preview-switch-group">
                <button
                  type="button"
                  className={`role-switch-pill${role === 'teacher' ? ' active' : ''}`}
                  onClick={() => handleSwitchRole('teacher')}
                >
                  👨‍🏫 Teacher Mode
                </button>
                <button
                  type="button"
                  className={`role-switch-pill${role === 'student' && activeTab !== 'parent' ? ' active' : ''}`}
                  onClick={() => handleSwitchRole('student')}
                >
                  🧑‍🎓 Student Mode
                </button>
                <button
                  type="button"
                  className={`role-switch-pill${activeTab === 'parent' ? ' active' : ''}`}
                  onClick={() => handleSwitchRole('parent')}
                >
                  👨‍👩‍👧 Parent Mode
                </button>
              </div>

              <button
                type="button"
                className="disconnect-btn"
                onClick={handleDisconnect}
              >
                <ion-icon name="log-out-outline"></ion-icon>
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Main Dashboard Content (Visible when authenticated) */}
      {auth && (
        <section className="classroom-dashboard-container">
          {error && (
            <div className="classroom-error-banner" style={{ marginBottom: '20px' }}>
              <ion-icon name="alert-circle-outline"></ion-icon>
              <div>
                <strong>Google Classroom API Note:</strong> {error}
              </div>
            </div>
          )}

          {/* Main Tri-Portal Tabs */}
          <div className="dashboard-nav-tabs">
            <button
              className={`dashboard-tab${activeTab === 'courses' ? ' active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              <ion-icon name="grid-outline"></ion-icon>
              <span>{role === 'teacher' ? 'Classrooms (20)' : 'My Classroom'}</span>
            </button>
            <button
              className={`dashboard-tab${activeTab === 'homework' ? ' active' : ''}`}
              onClick={() => setActiveTab('homework')}
            >
              <ion-icon name="book-outline"></ion-icon>
              <span>Homework & Assignments</span>
            </button>
            <button
              className={`dashboard-tab${activeTab === 'grades' ? ' active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              <ion-icon name="ribbon-outline"></ion-icon>
              <span>Submissions & Marks</span>
            </button>
            <button
              className={`dashboard-tab highlight-parent${activeTab === 'parent' ? ' active' : ''}`}
              onClick={() => setActiveTab('parent')}
            >
              <ion-icon name="people-outline"></ion-icon>
              <span>👨‍👩‍👧 Parent Dashboard</span>
            </button>
          </div>

          {/* ======================================================= */}
          {/* TAB 1: CLASSROOMS / COURSES                             */}
          {/* ======================================================= */}
          {activeTab === 'courses' && (
            <div className="tab-pane">
              {role === 'teacher' ? (
                <>
                  {/* Teacher Command Overview Stats */}
                  <div className="dashboard-stats-row">
                    <div className="stat-card">
                      <div className="stat-num">{courses.length}</div>
                      <div className="stat-label">Active 1-on-1 Classrooms</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num">{courseWork.length * courses.length}</div>
                      <div className="stat-label">Total Coursework Items</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num">93.4%</div>
                      <div className="stat-label">Student Average GPA</div>
                    </div>
                    <div className="stat-card highlight">
                      <div className="stat-num">3</div>
                      <div className="stat-label">Pending Teacher Reviews</div>
                    </div>
                  </div>

                  {/* Filter Chips & Search Bar */}
                  <div className="filter-and-search-row">
                    <div className="filter-chips-list">
                      {['all', 'Grade 10', 'Grade 11', 'Grade 12'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={`filter-chip${gradeFilter === lvl ? ' active' : ''}`}
                          onClick={() => setGradeFilter(lvl)}
                        >
                          {lvl === 'all' ? 'All Classes (20)' : lvl}
                        </button>
                      ))}
                    </div>

                    <div className="search-input-group">
                      <ion-icon name="search-outline"></ion-icon>
                      <input
                        type="text"
                        placeholder="Search student or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="results-meta-bar">
                    <span>Showing {filteredCourses.length} of {courses.length} 1-on-1 tutoring classrooms</span>
                  </div>

                  {/* Classrooms Grid (All 20) */}
                  {courses.length === 0 ? (
                    <div className="empty-state-card" style={{ marginTop: '20px' }}>
                      <ion-icon name="school-outline"></ion-icon>
                      <h4 className="h4">No Classrooms Returned for {auth.user?.email}</h4>
                      <p>
                        Google Classroom returned 0 active courses for this Google account.
                      </p>
                      <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--light-gray-70, #aaa)' }}>
                        If your 20 classrooms were created under another Google email or Google Workspace account, disconnect and log in with that account.
                      </p>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                          href="https://classroom.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hero-cta-btn primary"
                        >
                          <span>Check classroom.google.com</span>
                          <ion-icon name="open-outline"></ion-icon>
                        </a>
                        <button
                          type="button"
                          className="hero-cta-btn secondary"
                          onClick={() => {
                            setCourses(MOCK_20_CLASSROOMS)
                            setSelectedCourse(MOCK_20_CLASSROOMS[0])
                            setCourseWork(MOCK_ASSIGNMENTS)
                          }}
                        >
                          <span>Load Sample 20 Classrooms</span>
                          <ion-icon name="layers-outline"></ion-icon>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="classrooms-grid">
                      {filteredCourses.map((c) => (
                        <div
                          key={c.id}
                          className={`classroom-card${selectedCourse?.id === c.id ? ' selected' : ''}`}
                          onClick={() => setSelectedCourse(c)}
                        >
                          <div className="classroom-card-header">
                            <span className="classroom-tag">{c.grade || '1-on-1'}</span>
                            <span className="student-subject-tag">{c.subject || 'AP Science'}</span>
                          </div>

                          <h4 className="h4 classroom-title">{c.name}</h4>
                          <p className="classroom-section-text">{c.section || c.descriptionHeading}</p>

                          <div className="classroom-card-actions-row">
                            <button
                              type="button"
                              className="card-action-btn primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCourse(c)
                                setActiveTab('homework')
                              }}
                            >
                              <ion-icon name="book-outline"></ion-icon>
                              <span>Homework</span>
                            </button>

                            <button
                              type="button"
                              className="card-action-btn parent-btn"
                              title="Generate parent progress report"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCourse(c)
                                setActiveTab('parent')
                              }}
                            >
                              <ion-icon name="people-outline"></ion-icon>
                              <span>Parent Report</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Student View (Sprint 4: Only student's enrolled course) */
                <div className="student-single-course-view">
                  {courses.length > 0 ? (
                    courses.map((c) => (
                      <div key={c.id} className="student-classroom-container">
                        <div className="student-classroom-hero">
                          <div className="classroom-hero-badge">YOUR 1-ON-1 CLASSROOM</div>
                          <h3 className="h3 hero-course-title">{c.name}</h3>
                          <p className="hero-course-sub">{c.section || 'Private Tutoring Mentorship'}</p>

                          <div className="course-quick-actions">
                            <button
                              type="button"
                              className="hero-cta-btn primary"
                              onClick={() => setActiveTab('homework')}
                            >
                              <span>View Homework & Assignments</span>
                              <ion-icon name="book-outline"></ion-icon>
                            </button>
                            <button
                              type="button"
                              className="hero-cta-btn secondary"
                              onClick={() => setActiveTab('grades')}
                            >
                              <span>View My Marks & Feedback</span>
                              <ion-icon name="ribbon-outline"></ion-icon>
                            </button>
                            <button
                              type="button"
                              className="hero-cta-btn parent-link-cta"
                              onClick={() => setActiveTab('parent')}
                            >
                              <span>👨‍👩‍👧 Parent Overview</span>
                              <ion-icon name="people-outline"></ion-icon>
                            </button>
                          </div>

                          {c.alternateLink && (
                            <div className="external-classroom-shortcut">
                              <a
                                href={c.alternateLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="external-subtle-link"
                              >
                                <ion-icon name="open-outline"></ion-icon>
                                <span>Optional: Open in Google Classroom app</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Direct In-Website Quick Homework Glance */}
                        <div className="student-quick-tasks-section">
                          <div className="quick-tasks-header">
                            <h4 className="h4">Your Active Tasks (Click to view full instructions)</h4>
                            <span className="tasks-count-pill">{courseWork.length} Items</span>
                          </div>

                          <div className="quick-tasks-grid">
                            {courseWork.map((item) => {
                              const dueStr = item.dueDate
                                ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                                : 'No deadline'
                              const subState = item.submission?.state || 'ASSIGNED'
                              return (
                                <div
                                  key={item.id}
                                  className="quick-task-item"
                                  onClick={() => setSelectedAssignment(item)}
                                >
                                  <div className="quick-task-top">
                                    <span className={`status-pill ${subState.toLowerCase()}`}>
                                      {subState === 'RETURNED'
                                        ? 'Graded ✓'
                                        : subState === 'TURNED_IN'
                                        ? 'Submitted'
                                        : 'Due Soon'}
                                    </span>
                                    <span className="due-pill">{dueStr}</span>
                                  </div>
                                  <h5 className="h5 quick-task-title">{item.title}</h5>
                                  <div className="quick-task-footer">
                                    <span>{item.maxPoints || 20} Max Points</span>
                                    <span className="quick-task-link">Inspect Task →</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <ion-icon name="alert-circle-outline"></ion-icon>
                      <h4 className="h4">No Enrolled Courses Found</h4>
                      <p>Your Google account is not currently enrolled as a student in any active tutoring classroom.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: HOMEWORK & ASSIGNMENTS                           */}
          {/* ======================================================= */}
          {activeTab === 'homework' && (
            <div className="tab-pane">
              <div className="course-context-header">
                <div>
                  <h3 className="h3">
                    {selectedCourse ? selectedCourse.name : 'Coursework & Assignments'}
                  </h3>
                  <p className="context-sub">
                    Click any assignment card below to inspect full instructions, worksheets, and rubrics.
                  </p>
                </div>
              </div>

              <div className="assignments-list">
                {courseWork.length > 0 ? (
                  courseWork.map((item) => {
                    const dueStr = item.dueDate
                      ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                      : 'No due date'
                    const subState = item.submission?.state || 'ASSIGNED'
                    return (
                      <div
                        key={item.id}
                        className="assignment-card clickable"
                        onClick={() => setSelectedAssignment(item)}
                      >
                        <div className="assignment-main">
                          <div className="assignment-title-row">
                            <h4 className="h4 assignment-title">{item.title}</h4>
                            <span className={`status-pill ${subState.toLowerCase()}`}>
                              {subState === 'RETURNED'
                                ? 'Graded ✓'
                                : subState === 'TURNED_IN'
                                ? 'Submitted'
                                : 'Assigned'}
                            </span>
                          </div>
                          <p className="assignment-desc">{item.description}</p>
                          <div className="assignment-meta-row">
                            <span>
                              <ion-icon name="calendar-outline"></ion-icon> Due: {dueStr}
                            </span>
                            <span>
                              <ion-icon name="ribbon-outline"></ion-icon> Max Points: {item.maxPoints || 20}
                            </span>
                            {item.submission?.assignedGrade != null && (
                              <span className="grade-badge">
                                Grade: {item.submission.assignedGrade} / {item.maxPoints || 20}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="assignment-action">
                          <button
                            type="button"
                            className="view-assignment-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAssignment(item)
                            }}
                          >
                            <span>Inspect Prompt</span>
                            <ion-icon name="document-text-outline"></ion-icon>
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="empty-state-card">
                    <ion-icon name="document-text-outline"></ion-icon>
                    <h4 className="h4">No assignments found</h4>
                    <p>No coursework has been posted for this classroom yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: SUBMISSIONS & MARKS                              */}
          {/* ======================================================= */}
          {activeTab === 'grades' && (
            <div className="tab-pane">
              <div className="grades-summary-card">
                <div className="summary-col">
                  <span className="summary-label">Selected Student/Course</span>
                  <strong className="summary-value">{selectedCourse?.name || 'Classroom'}</strong>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Completion Rate</span>
                  <strong className="summary-value">67% (2 of 3 Submitted)</strong>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Cumulative GPA</span>
                  <strong className="summary-value highlight">92.5% (Grade A)</strong>
                </div>
              </div>

              <div className="marks-table-wrapper">
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Status</th>
                      <th>Turned In</th>
                      <th>Score</th>
                      <th>Instructor Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseWork.map((item) => {
                      const sub = item.submission
                      return (
                        <tr
                          key={item.id}
                          className="clickable-table-row"
                          onClick={() => setSelectedAssignment(item)}
                        >
                          <td>
                            <strong>{item.title}</strong>
                          </td>
                          <td>
                            <span className={`status-pill ${sub?.state?.toLowerCase() || 'assigned'}`}>
                              {sub?.state === 'RETURNED'
                                ? 'Graded ✓'
                                : sub?.state === 'TURNED_IN'
                                ? 'Submitted'
                                : 'Pending'}
                            </span>
                          </td>
                          <td>{sub?.turnInTime ? new Date(sub.turnInTime).toLocaleDateString() : '—'}</td>
                          <td>
                            {sub?.assignedGrade != null ? (
                              <span className="grade-badge">
                                {sub.assignedGrade} / {item.maxPoints || 20}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="feedback-preview-cell">
                            {sub?.teacherFeedback ? (
                              <span className="feedback-snippet">"{sub.teacherFeedback}"</span>
                            ) : (
                              <span className="text-muted">Awaiting feedback</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="table-action-link"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAssignment(item)
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 4: 👨‍👩‍👧 PARENT DASHBOARD                               */}
          {/* ======================================================= */}
          {activeTab === 'parent' && (
            <div className="tab-pane">
              <ParentDashboard
                studentName={currentStudentName}
                courseName={selectedCourse?.name || '1-on-1 Tutoring Mentorship'}
                courseWork={courseWork}
                onSelectAssignment={(item) => setSelectedAssignment(item)}
                allCourses={courses}
                onSelectCourse={(course) => setSelectedCourse(course)}
                isTeacherView={role === 'teacher'}
              />
            </div>
          )}
        </section>
      )}

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <AssignmentModal
          assignment={selectedAssignment}
          courseName={selectedCourse?.name}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </article>
  )
}

export default ClassroomPortal
