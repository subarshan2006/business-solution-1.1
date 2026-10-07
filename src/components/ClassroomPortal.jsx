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
  isTeacherEmail,
  listTeacherCourses,
  listStudentCourses,
  fetchCourseWorkWithSubmissions,
  calculateStudentAnalytics,
  MOCK_20_CLASSROOMS,
  MOCK_ASSIGNMENTS,
} from '../services/classroomApi'
import ParentDashboard from './ParentDashboard'
import AssignmentModal from './AssignmentModal'
import SessionAnnouncementGenerator from './SessionAnnouncementGenerator'

function ClassroomPortal() {
  const [auth, setAuth] = useState(() => getStoredAuth())

  // True account role: strictly 'teacher' if in KNOWN_TEACHERS or verified by Google Classroom API
  const isTeacher = Boolean(
    auth &&
      (auth.accountRole === 'teacher' ||
        isTeacherEmail(auth.user?.email))
  )

  const [role, setRole] = useState(() => {
    const stored = getStoredAuth()
    const isStoredTeacher = Boolean(
      stored &&
        (stored.accountRole === 'teacher' ||
          isTeacherEmail(stored.user?.email))
    )
    if (isStoredTeacher) {
      return stored?.role || 'teacher'
    }
    // Students are strictly locked to student role
    return 'student'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseWork, setCourseWork] = useState([])
  const [loadingCourseWork, setLoadingCourseWork] = useState(false)
  const [courseWorkError, setCourseWorkError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('courses') // 'courses', 'homework', 'grades', 'parent'
  const [gradeFilter] = useState('all')
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  // Aggregated coursework across ALL enrolled courses (for student view)
  const [allCourseWork, setAllCourseWork] = useState({}) // { courseId: { courseName, items: [] } }
  const [allCourseWorkLoading, setAllCourseWorkLoading] = useState(false)
  const [allCourseWorkError, setAllCourseWorkError] = useState('')

  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  // Load courses when auth or role changes
  useEffect(() => {
    if (!auth) {
      setCourses([])
      setSelectedCourse(null)
      return
    }

    if (auth.isMock) {
      if (isTeacher && role === 'teacher') {
        setCourses(MOCK_20_CLASSROOMS)
        setSelectedCourse(MOCK_20_CLASSROOMS[0])
        setCourseWork(MOCK_ASSIGNMENTS)
      } else {
        setCourses(MOCK_20_CLASSROOMS)
        setSelectedCourse(MOCK_20_CLASSROOMS[0])
        setCourseWork(MOCK_ASSIGNMENTS)
      }
      return
    }

    // Real API fetch
    async function fetchRealClassroomData() {
      setLoading(true)
      setError('')
      try {
        let currentAuth = auth
        let userEmail = currentAuth.user?.email || ''

        // Fallback: fetch profile from Classroom if email is missing or generic
        if (!userEmail || userEmail === 'Google Classroom Account') {
          try {
            const upRes = await fetch('https://classroom.googleapis.com/v1/userProfiles/me', {
              headers: { Authorization: `Bearer ${currentAuth.accessToken}` },
            })
            if (upRes.ok) {
              const up = await upRes.json()
              if (up.emailAddress) {
                userEmail = up.emailAddress
                currentAuth = {
                  ...currentAuth,
                  user: {
                    ...currentAuth.user,
                    email: up.emailAddress,
                    name: up.name?.fullName || currentAuth.user?.name,
                    picture: up.photoUrl || currentAuth.user?.picture,
                  },
                }
                setAuth(currentAuth)
                saveAuth(currentAuth)
              }
            }
          } catch (pErr) {
            console.warn('Classroom profile sync note:', pErr)
          }
        }

        // Determine whether user is genuinely a teacher
        let isAuthTeacher = isTeacherEmail(userEmail)
        if (!isAuthTeacher) {
          const roleResult = await determineRole(currentAuth.accessToken, userEmail)
          isAuthTeacher = roleResult.role === 'teacher'
        }

        let userRole = isAuthTeacher ? (role === 'student' ? 'student' : 'teacher') : 'student'

        if (isAuthTeacher) {
          if (role !== userRole) {
            setRole(userRole)
          }
          if (currentAuth.accountRole !== 'teacher') {
            const updated = { ...currentAuth, role: userRole, accountRole: 'teacher' }
            setAuth(updated)
            saveAuth(updated)
          }
        } else {
          // Strictly lock student accounts to student role
          userRole = 'student'
          if (role !== 'student') {
            setRole('student')
          }
          if (currentAuth.accountRole !== 'student' || currentAuth.role !== 'student') {
            const updated = { ...currentAuth, role: 'student', accountRole: 'student' }
            setAuth(updated)
            saveAuth(updated)
          }
        }

        if (userRole === 'teacher') {
          const list = await listTeacherCourses(currentAuth.accessToken)
          setCourses(list)
          if (list.length > 0) setSelectedCourse((prev) => prev || list[0])
        } else {
          const list = await listStudentCourses(currentAuth.accessToken)
          setCourses(list)
          if (list.length > 0) setSelectedCourse((prev) => prev || list[0])
        }
      } catch (err) {
        console.error('Failed to load courses from Google Classroom:', err)
        setError(err.message || 'Failed to fetch classrooms from Google.')
      } finally {
        setLoading(false)
      }
    }

    fetchRealClassroomData()
  }, [auth, role, isTeacher])

  // Fetch coursework when selectedCourse changes in live mode
  useEffect(() => {
    if (!selectedCourse || !auth) return

    if (auth.isMock) {
      setCourseWork(MOCK_ASSIGNMENTS)
      return
    }

    let isMounted = true
    async function loadCourseWork() {
      setLoadingCourseWork(true)
      setCourseWorkError('')
      try {
        const cw = await fetchCourseWorkWithSubmissions(selectedCourse.id, auth.accessToken)
        if (isMounted) {
          setCourseWork(cw)
        }
      } catch (err) {
        console.error('Could not fetch coursework for selected course:', err)
        if (isMounted) {
          const isScopeErr =
            err.message?.toLowerCase().includes('permission') ||
            err.message?.toLowerCase().includes('scope') ||
            err.status === 403
          setCourseWorkError(
            isScopeErr
              ? 'Google Classroom permissions for coursework and submissions are required. Please click "Grant Classroom Permissions" below.'
              : err.message || 'Failed to load coursework from Google Classroom.'
          )
        }
      } finally {
        if (isMounted) {
          setLoadingCourseWork(false)
        }
      }
    }

    loadCourseWork()
    return () => {
      isMounted = false
    }
  }, [selectedCourse, auth])

  // Fetch coursework from ALL enrolled courses for student view
  useEffect(() => {
    if (!auth || !courses.length) return
    // Only fetch for student role (not teacher viewing as teacher)
    if (isTeacher && role === 'teacher') return

    if (auth.isMock) {
      // Build allCourseWork from mock data for all courses
      const mockAll = {}
      courses.forEach((c) => {
        mockAll[c.id] = { courseName: c.name, alternateLink: c.alternateLink, items: MOCK_ASSIGNMENTS }
      })
      setAllCourseWork(mockAll)
      return
    }

    let isMounted = true
    async function loadAllCourseWork() {
      setAllCourseWorkLoading(true)
      setAllCourseWorkError('')
      try {
        const results = await Promise.allSettled(
          courses.map(async (c) => {
            const cw = await fetchCourseWorkWithSubmissions(c.id, auth.accessToken)
            return { courseId: c.id, courseName: c.name, alternateLink: c.alternateLink, items: cw }
          })
        )
        if (isMounted) {
          const aggregated = {}
          results.forEach((r) => {
            if (r.status === 'fulfilled') {
              aggregated[r.value.courseId] = {
                courseName: r.value.courseName,
                alternateLink: r.value.alternateLink,
                items: r.value.items,
              }
            }
          })
          setAllCourseWork(aggregated)
        }
      } catch (err) {
        console.error('Failed to load coursework across all courses:', err)
        if (isMounted) {
          setAllCourseWorkError(err.message || 'Failed to load coursework from all classrooms.')
        }
      } finally {
        if (isMounted) {
          setAllCourseWorkLoading(false)
        }
      }
    }

    loadAllCourseWork()
    return () => {
      isMounted = false
    }
  }, [courses, auth, isTeacher, role])

  const handleConnectLive = async () => {
    setLoading(true)
    setError('')
    try {
      const authData = await requestGoogleAccessToken()
      const isTeacherUser = isTeacherEmail(authData.user?.email)
      const roleResult = isTeacherUser
        ? { role: 'teacher' }
        : await determineRole(authData.accessToken, authData.user?.email)
      const finalRole = isTeacherUser || roleResult.role === 'teacher' ? 'teacher' : 'student'
      const fullAuth = { ...authData, role: finalRole, accountRole: finalRole }
      setRole(finalRole)
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
    // If authenticated user is a student, forbid switching to teacher mode
    if (newRole === 'teacher' && !isTeacher) {
      return
    }

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
  const analytics = calculateStudentAnalytics(courseWork)

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
                  <span className={`role-badge ${isTeacher && role === 'teacher' ? 'teacher' : 'student'}`}>
                    {isTeacher && role === 'teacher' ? 'TEACHER / LEAD MENTOR' : 'STUDENT WORKSPACE'}
                  </span>
                  {auth.isMock && <span className="mock-badge">PREVIEW MODE</span>}
                </div>
                <p className="user-email-text">{auth.user.email}</p>
              </div>
            </div>

            <div className="connected-controls">
              {isTeacher ? (
                /* Teacher Controls */
                <div className="preview-switch-group">
                  <button
                    type="button"
                    className={`role-switch-pill${role === 'teacher' && activeTab !== 'parent' ? ' active' : ''}`}
                    onClick={() => handleSwitchRole('teacher')}
                  >
                    👨‍🏫 Teacher Mode
                  </button>
                  <button
                    type="button"
                    className={`role-switch-pill${role === 'student' && activeTab !== 'parent' ? ' active' : ''}`}
                    onClick={() => handleSwitchRole('student')}
                  >
                    🧑‍🎓 Student Preview
                  </button>
                  <button
                    type="button"
                    className={`role-switch-pill${activeTab === 'parent' ? ' active' : ''}`}
                    onClick={() => handleSwitchRole('parent')}
                  >
                    👨‍👩‍👧 Parent Mode
                  </button>
                </div>
              ) : (
                /* Student Controls: Only Student Workspace and Parent View */
                <div className="preview-switch-group">
                  <button
                    type="button"
                    className={`role-switch-pill${activeTab !== 'parent' ? ' active' : ''}`}
                    onClick={() => {
                      setRole('student')
                      setActiveTab('courses')
                    }}
                  >
                    🧑‍🎓 My Classroom
                  </button>
                  <button
                    type="button"
                    className={`role-switch-pill${activeTab === 'parent' ? ' active' : ''}`}
                    onClick={() => {
                      setRole('student')
                      setActiveTab('parent')
                    }}
                  >
                    👨‍👩‍👧 Parent Overview
                  </button>
                </div>
              )}

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
              <span>{isTeacher && role === 'teacher' ? `Classrooms (${courses.length})` : 'My Classroom'}</span>
            </button>
            <button
              className={`dashboard-tab${activeTab === 'homework' ? ' active' : ''}`}
              onClick={() => setActiveTab('homework')}
            >
              <ion-icon name="book-outline"></ion-icon>
              <span>{isTeacher && role === 'teacher' ? 'Homework & Assignments' : 'My Homework & Tasks'}</span>
            </button>
            <button
              className={`dashboard-tab${activeTab === 'grades' ? ' active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              <ion-icon name="ribbon-outline"></ion-icon>
              <span>{isTeacher && role === 'teacher' ? 'Submissions & Marks' : 'My Marks & Grades'}</span>
            </button>
            <button
              className={`dashboard-tab highlight-parent${activeTab === 'parent' ? ' active' : ''}`}
              onClick={() => setActiveTab('parent')}
            >
              <ion-icon name="people-outline"></ion-icon>
              <span>{isTeacher ? '👨‍👩‍👧 Parent Dashboard' : '👨‍👩‍👧 Parent Overview'}</span>
            </button>
            <button
              className={`dashboard-tab highlight-announcement${activeTab === 'announcements' ? ' active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <ion-icon name="megaphone-outline"></ion-icon>
              <span>📢 Session Updates</span>
            </button>
          </div>

          {/* ======================================================= */}
          {/* TAB 1: CLASSROOMS / COURSES                             */}
          {/* ======================================================= */}
          {activeTab === 'courses' && (
            <div className="tab-pane">
              {isTeacher && role === 'teacher' ? (
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
                    <div
                      className="stat-card highlight clickable"
                      onClick={() => setActiveTab('grades')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setActiveTab('grades')}
                    >
                      <div className="stat-num">
                        {courseWork.filter((item) => {
                          const sub = item.submission
                          return sub && sub.state === 'TURNED_IN' && sub.assignedGrade == null
                        }).length}
                      </div>
                      <div className="stat-label">Pending Teacher Reviews</div>
                    </div>
                  </div>

                  {/* Filter Chips & Search Bar */}
                  <div className="filter-and-search-row">
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
                              className="card-action-btn secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCourse(c)
                                setActiveTab('grades')
                              }}
                            >
                              <ion-icon name="ribbon-outline"></ion-icon>
                              <span>Marks</span>
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
                              <span>Parent</span>
                            </button>

                            <button
                              type="button"
                              className="card-action-btn announcement-btn"
                              title="Post session announcement"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCourse(c)
                                setActiveTab('announcements')
                              }}
                            >
                              <ion-icon name="megaphone-outline"></ion-icon>
                              <span>Update</span>
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
              {isTeacher && role === 'teacher' ? (
                /* ── Teacher View: single selected course ── */
                <>
                  <div className="course-context-header">
                    <div>
                      <h3 className="h3">
                        {selectedCourse ? selectedCourse.name : 'Coursework & Assignments'}
                      </h3>
                      <p className="context-sub">
                        Direct live coursework and prompts synced from Google Classroom. Click any assignment to inspect instructions.
                      </p>
                    </div>
                  </div>

                  <div className="assignments-list">
                    {loadingCourseWork ? (
                      <div className="empty-state-card" style={{ padding: '36px' }}>
                        <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                        <h4 className="h4" style={{ marginTop: '12px' }}>Loading Real Coursework...</h4>
                        <p>Fetching active assignments directly from Google Classroom.</p>
                      </div>
                    ) : courseWorkError ? (
                      <div className="empty-state-card" style={{ borderColor: 'rgba(255, 107, 107, 0.4)' }}>
                        <ion-icon name="alert-circle-outline" style={{ color: '#ff6b6b' }}></ion-icon>
                        <h4 className="h4" style={{ color: '#ff6b6b' }}>Google Classroom Permission Required</h4>
                        <p>{courseWorkError}</p>
                        <div style={{ marginTop: '16px' }}>
                          <button
                            type="button"
                            className="hero-cta-btn primary"
                            onClick={handleConnectLive}
                          >
                            <span>Grant Classroom Permissions</span>
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                          </button>
                        </div>
                      </div>
                    ) : courseWork.length > 0 ? (
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
                              <p className="assignment-desc">
                                {item.description || 'No additional instructions provided for this coursework item.'}
                              </p>
                              <div className="assignment-meta-row">
                                <span>
                                  <ion-icon name="calendar-outline"></ion-icon> Due: {dueStr}
                                </span>
                                <span>
                                  <ion-icon name="ribbon-outline"></ion-icon> Max Points: {item.maxPoints || 100}
                                </span>
                                {item.submission?.assignedGrade != null && (
                                  <span className="grade-badge">
                                    Grade: {item.submission.assignedGrade} / {item.maxPoints || 100}
                                  </span>
                                )}
                                {item.submissions && item.submissions.length > 1 && (
                                  <span className="grade-badge" style={{ background: 'rgba(92, 149, 240, 0.15)', color: '#5c95f0' }}>
                                    {item.submissions.length} Submissions
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
                        <h4 className="h4">No Coursework Found</h4>
                        <p>No active assignments were returned for {selectedCourse?.name || 'this classroom'}.</p>
                        {selectedCourse?.alternateLink && (
                          <div style={{ marginTop: '16px' }}>
                            <a
                              href={selectedCourse.alternateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hero-cta-btn secondary"
                            >
                              <span>Open in Google Classroom App</span>
                              <ion-icon name="open-outline"></ion-icon>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ── Student View: ALL enrolled classrooms ── */
                <>
                  <div className="course-context-header">
                    <div>
                      <h3 className="h3">My Homework & Tasks</h3>
                      <p className="context-sub">
                        All assignments across your enrolled classrooms. Click any assignment to inspect instructions.
                      </p>
                    </div>
                  </div>

                  {allCourseWorkLoading ? (
                    <div className="empty-state-card" style={{ padding: '36px' }}>
                      <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                      <h4 className="h4" style={{ marginTop: '12px' }}>Loading Coursework from All Classrooms...</h4>
                      <p>Fetching assignments from {courses.length} enrolled classroom{courses.length !== 1 ? 's' : ''}.</p>
                    </div>
                  ) : allCourseWorkError ? (
                    <div className="empty-state-card" style={{ borderColor: 'rgba(255, 107, 107, 0.4)' }}>
                      <ion-icon name="alert-circle-outline" style={{ color: '#ff6b6b' }}></ion-icon>
                      <h4 className="h4" style={{ color: '#ff6b6b' }}>Failed to Load Coursework</h4>
                      <p>{allCourseWorkError}</p>
                    </div>
                  ) : Object.keys(allCourseWork).length > 0 ? (
                    Object.entries(allCourseWork).map(([courseId, courseData]) => (
                      <div key={courseId} className="student-all-course-section" style={{ marginBottom: '28px' }}>
                        <div className="course-section-header" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '12px', flexWrap: 'wrap', marginBottom: '14px',
                          padding: '10px 16px', borderRadius: '10px',
                          background: 'var(--border-gradient-onyx)', position: 'relative',
                        }}>
                          <div style={{ position: 'absolute', inset: '1px', background: 'var(--bg-gradient-jet)', borderRadius: 'inherit', zIndex: 0 }}></div>
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <h4 className="h4" style={{ color: 'var(--orange-yellow-crayola)', marginBottom: '2px' }}>
                              <ion-icon name="school-outline" style={{ marginRight: '6px', fontSize: '16px', verticalAlign: '-2px' }}></ion-icon>
                              {courseData.courseName}
                            </h4>
                            <span style={{ fontSize: '11px', color: 'var(--light-gray-70, #aaa)' }}>
                              {courseData.items.length} assignment{courseData.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {courseData.alternateLink && (
                            <a
                              href={courseData.alternateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                position: 'relative', zIndex: 1,
                                fontSize: '11px', color: 'var(--light-gray)',
                                textDecoration: 'none', display: 'inline-flex',
                                alignItems: 'center', gap: '4px',
                              }}
                            >
                              <ion-icon name="open-outline"></ion-icon> Open in Classroom
                            </a>
                          )}
                        </div>

                        <div className="assignments-list">
                          {courseData.items.length > 0 ? (
                            courseData.items.map((item) => {
                              const dueStr = item.dueDate
                                ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                                : 'No due date'
                              const subState = item.submission?.state || 'ASSIGNED'
                              return (
                                <div
                                  key={`${courseId}-${item.id}`}
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
                                    <p className="assignment-desc">
                                      {item.description || 'No additional instructions provided for this coursework item.'}
                                    </p>
                                    <div className="assignment-meta-row">
                                      <span>
                                        <ion-icon name="calendar-outline"></ion-icon> Due: {dueStr}
                                      </span>
                                      <span>
                                        <ion-icon name="ribbon-outline"></ion-icon> Max Points: {item.maxPoints || 100}
                                      </span>
                                      {item.submission?.assignedGrade != null && (
                                        <span className="grade-badge">
                                          Grade: {item.submission.assignedGrade} / {item.maxPoints || 100}
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
                            <div className="empty-state-card" style={{ padding: '20px' }}>
                              <ion-icon name="document-text-outline"></ion-icon>
                              <p style={{ marginTop: '8px' }}>No active assignments for {courseData.courseName}.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <ion-icon name="document-text-outline"></ion-icon>
                      <h4 className="h4">No Coursework Found</h4>
                      <p>No active assignments were returned for your enrolled classrooms.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: SUBMISSIONS & MARKS                              */}
          {/* ======================================================= */}
          {activeTab === 'grades' && (
            <div className="tab-pane">
              {isTeacher && role === 'teacher' ? (
                /* ── Teacher View: single selected course grades ── */
                <>
                  <div className="grades-summary-card">
                    <div className="summary-col">
                      <span className="summary-label">Course / Classroom</span>
                      <strong className="summary-value">{selectedCourse?.name || 'Classroom'}</strong>
                    </div>
                    <div className="summary-col">
                      <span className="summary-label">Completion Rate</span>
                      <strong className="summary-value">
                        {courseWork.length > 0
                          ? `${analytics.completionRate}% (${analytics.completedHomework.length} of ${courseWork.length} Completed)`
                          : '0% (0 Items)'}
                      </strong>
                    </div>
                    <div className="summary-col">
                      <span className="summary-label">Cumulative Average</span>
                      <strong className="summary-value highlight">
                        {courseWork.length > 0
                          ? `${analytics.averagePercentage}% (Grade ${analytics.letterGrade})`
                          : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="marks-table-wrapper">
                    {loadingCourseWork ? (
                      <div className="empty-state-card" style={{ padding: '36px' }}>
                        <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                        <h4 className="h4" style={{ marginTop: '12px' }}>Fetching Real Submissions & Marks...</h4>
                        <p>Querying student submission records and scores from Google Classroom.</p>
                      </div>
                    ) : courseWorkError ? (
                      <div className="empty-state-card" style={{ borderColor: 'rgba(255, 107, 107, 0.4)' }}>
                        <ion-icon name="alert-circle-outline" style={{ color: '#ff6b6b' }}></ion-icon>
                        <h4 className="h4" style={{ color: '#ff6b6b' }}>Google Classroom Permission Required</h4>
                        <p>{courseWorkError}</p>
                        <div style={{ marginTop: '16px' }}>
                          <button
                            type="button"
                            className="hero-cta-btn primary"
                            onClick={handleConnectLive}
                          >
                            <span>Grant Classroom Permissions</span>
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                          </button>
                        </div>
                      </div>
                    ) : courseWork.length === 0 ? (
                      <div className="empty-state-card">
                        <ion-icon name="ribbon-outline"></ion-icon>
                        <h4 className="h4">No Submissions Found</h4>
                        <p>No coursework submissions or scores have been recorded for {selectedCourse?.name || 'this classroom'} yet.</p>
                      </div>
                    ) : (
                      <table className="marks-table">
                        <thead>
                          <tr>
                            <th>Assignment</th>
                            <th>Status</th>
                            <th>Turned In</th>
                            <th>Score</th>
                            <th>Student / Instructor Notes</th>
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
                                  {sub?.studentName && sub.studentName !== 'Enrolled Student' && (
                                    <div style={{ fontSize: '11px', color: 'var(--light-gray-70, #aaa)' }}>
                                      Student: {sub.studentName}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <span className={`status-pill ${sub?.state?.toLowerCase() || 'assigned'}`}>
                                    {sub?.state === 'RETURNED'
                                      ? 'Graded ✓'
                                      : sub?.state === 'TURNED_IN'
                                      ? 'Submitted'
                                      : 'Assigned'}
                                  </span>
                                </td>
                                <td>{sub?.turnInTime ? new Date(sub.turnInTime).toLocaleDateString() : '—'}</td>
                                <td>
                                  {sub?.assignedGrade != null ? (
                                    <span className="grade-badge">
                                      {sub.assignedGrade} / {item.maxPoints || 100}
                                    </span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                                <td className="feedback-preview-cell">
                                  {sub?.teacherFeedback ? (
                                    <span className="feedback-snippet">{sub.teacherFeedback}</span>
                                  ) : sub?.state === 'TURNED_IN' ? (
                                    <span className="text-muted">Turned In · Pending Grading</span>
                                  ) : (
                                    <span className="text-muted">Assigned</span>
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
                    )}
                  </div>
                </>
              ) : (
                /* ── Student View: ALL enrolled classrooms grades ── */
                <>
                  {allCourseWorkLoading ? (
                    <div className="empty-state-card" style={{ padding: '36px' }}>
                      <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                      <h4 className="h4" style={{ marginTop: '12px' }}>Fetching Marks from All Classrooms...</h4>
                      <p>Querying submission records and scores from {courses.length} enrolled classroom{courses.length !== 1 ? 's' : ''}.</p>
                    </div>
                  ) : allCourseWorkError ? (
                    <div className="empty-state-card" style={{ borderColor: 'rgba(255, 107, 107, 0.4)' }}>
                      <ion-icon name="alert-circle-outline" style={{ color: '#ff6b6b' }}></ion-icon>
                      <h4 className="h4" style={{ color: '#ff6b6b' }}>Failed to Load Grades</h4>
                      <p>{allCourseWorkError}</p>
                    </div>
                  ) : Object.keys(allCourseWork).length > 0 ? (
                    Object.entries(allCourseWork).map(([courseId, courseData]) => {
                      const courseAnalytics = calculateStudentAnalytics(courseData.items)
                      return (
                        <div key={courseId} style={{ marginBottom: '28px' }}>
                          <div className="grades-summary-card">
                            <div className="summary-col">
                              <span className="summary-label">Course / Classroom</span>
                              <strong className="summary-value">{courseData.courseName}</strong>
                            </div>
                            <div className="summary-col">
                              <span className="summary-label">Completion Rate</span>
                              <strong className="summary-value">
                                {courseData.items.length > 0
                                  ? `${courseAnalytics.completionRate}% (${courseAnalytics.completedHomework.length} of ${courseData.items.length} Completed)`
                                  : '0% (0 Items)'}
                              </strong>
                            </div>
                            <div className="summary-col">
                              <span className="summary-label">Cumulative Average</span>
                              <strong className="summary-value highlight">
                                {courseData.items.length > 0
                                  ? `${courseAnalytics.averagePercentage}% (Grade ${courseAnalytics.letterGrade})`
                                  : '—'}
                              </strong>
                            </div>
                          </div>

                          <div className="marks-table-wrapper">
                            {courseData.items.length === 0 ? (
                              <div className="empty-state-card" style={{ padding: '20px' }}>
                                <ion-icon name="ribbon-outline"></ion-icon>
                                <p style={{ marginTop: '8px' }}>No submissions found for {courseData.courseName}.</p>
                              </div>
                            ) : (
                              <table className="marks-table">
                                <thead>
                                  <tr>
                                    <th>Assignment</th>
                                    <th>Status</th>
                                    <th>Turned In</th>
                                    <th>Score</th>
                                    <th>Student / Instructor Notes</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {courseData.items.map((item) => {
                                    const sub = item.submission
                                    return (
                                      <tr
                                        key={`${courseId}-${item.id}`}
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
                                              : 'Assigned'}
                                          </span>
                                        </td>
                                        <td>{sub?.turnInTime ? new Date(sub.turnInTime).toLocaleDateString() : '—'}</td>
                                        <td>
                                          {sub?.assignedGrade != null ? (
                                            <span className="grade-badge">
                                              {sub.assignedGrade} / {item.maxPoints || 100}
                                            </span>
                                          ) : (
                                            <span className="text-muted">—</span>
                                          )}
                                        </td>
                                        <td className="feedback-preview-cell">
                                          {sub?.teacherFeedback ? (
                                            <span className="feedback-snippet">{sub.teacherFeedback}</span>
                                          ) : sub?.state === 'TURNED_IN' ? (
                                            <span className="text-muted">Turned In · Pending Grading</span>
                                          ) : (
                                            <span className="text-muted">Assigned</span>
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
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="empty-state-card">
                      <ion-icon name="ribbon-outline"></ion-icon>
                      <h4 className="h4">No Submissions Found</h4>
                      <p>No coursework submissions or scores have been recorded for your enrolled classrooms yet.</p>
                    </div>
                  )}
                </>
              )}
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
                selectedCourse={selectedCourse}
                courseWork={courseWork}
                loadingCourseWork={loadingCourseWork}
                onSelectAssignment={(item) => setSelectedAssignment(item)}
                allCourses={courses}
                onSelectCourse={(course) => setSelectedCourse(course)}
                isTeacherView={role === 'teacher'}
                teacherName={auth?.user?.name || 'Lead Mentor'}
              />
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 5: 📢 SESSION ANNOUNCEMENTS                         */}
          {/* ======================================================= */}
          {activeTab === 'announcements' && (
            <div className="tab-pane">
              <SessionAnnouncementGenerator
                courses={courses}
                selectedCourse={selectedCourse}
                auth={auth}
                defaultTeacherName={auth?.user?.name || 'Steena'}
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
