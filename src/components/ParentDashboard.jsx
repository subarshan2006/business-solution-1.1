import { useState, useMemo, useEffect } from 'react'
import {
  calculateStudentAnalytics,
  buildMonthlyReport,
  getMonthKey,
  getMonthLabel,
  getRecentMonthKeys,
  getSummativeRecord,
  saveSummativeRecord,
  saveRemarksRecord,
  resetRemarksRecord,
} from '../services/classroomApi'

function ParentDashboard({
  studentName = 'Student',
  courseName = '1-on-1 Mentorship',
  selectedCourse = null,
  courseWork = [],
  loadingCourseWork = false,
  onSelectAssignment,
  allCourses = [],
  onSelectCourse,
  isTeacherView = false,
  teacherName = 'Steena Antony',
  announcements = [],
}) {
  const [activeParentTab, setActiveParentTab] = useState('progress') // 'progress', 'pending', 'completed', 'upcoming', 'report'
  const [selectedMonthKey, setSelectedMonthKey] = useState(getMonthKey())
  const [isEditingSummative, setIsEditingSummative] = useState(false)
  const [isEditingRemarks, setIsEditingRemarks] = useState(false)
  const [summativeRecord, setSummativeRecord] = useState(null)
  const [summativeForm, setSummativeForm] = useState({ score: '', total: 100, note: '', date: '' })
  const [remarksForm, setRemarksForm] = useState({
    academicEngagement: '',
    focusAreas: '',
    targetedSupport: '',
    parentRecommendations: '',
  })
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false)
  const [remarksSuccessNotice, setRemarksSuccessNotice] = useState(false)

  const activeCourseName = selectedCourse?.name || courseName
  const activeStudentName =
    selectedCourse?.studentName ||
    (studentName && studentName !== 'Alex Rivera' ? studentName : selectedCourse?.section ? selectedCourse.section : 'Student')

  const displayTeacherName =
    teacherName &&
    !teacherName.toLowerCase().includes('subarshan') &&
    teacherName !== 'Lead Mentor'
      ? teacherName
      : 'Steena Antony'

  const analytics = calculateStudentAnalytics(courseWork, activeCourseName, displayTeacherName)

  // Load summative & remarks record when course or month changes
  useEffect(() => {
    if (selectedCourse?.id && selectedMonthKey) {
      const rec = getSummativeRecord(selectedCourse.id, selectedMonthKey)
      setSummativeRecord(rec)
      const formatBullets = (val) => {
        if (!val) return ''
        if (Array.isArray(val)) return val.join('\n')
        return String(val)
      }
      if (rec) {
        setSummativeForm({
          score: rec.score != null ? rec.score : '',
          total: rec.total != null ? rec.total : 100,
          note: rec.note || '',
          date: rec.date || '',
        })
        setRemarksForm({
          academicEngagement: rec.academicEngagement || '',
          focusAreas: rec.focusAreas || '',
          targetedSupport: formatBullets(rec.targetedSupport),
          parentRecommendations: formatBullets(rec.parentRecommendations),
        })
      } else {
        setSummativeForm({ score: '', total: 100, note: '', date: '' })
        setRemarksForm({
          academicEngagement: '',
          focusAreas: '',
          targetedSupport: '',
          parentRecommendations: '',
        })
      }
    } else {
      setSummativeRecord(null)
      setSummativeForm({ score: '', total: 100, note: '', date: '' })
      setRemarksForm({
        academicEngagement: '',
        focusAreas: '',
        targetedSupport: '',
        parentRecommendations: '',
      })
    }
    setIsEditingSummative(false)
    setIsEditingRemarks(false)
  }, [selectedCourse?.id, selectedMonthKey])

  const recentMonthKeys = useMemo(() => getRecentMonthKeys(12), [])

  const monthlyReport = useMemo(() => {
    return buildMonthlyReport({
      courseWork,
      announcements,
      courseMeta: {
        id: selectedCourse?.id,
        enrollmentCode: selectedCourse?.enrollmentCode,
        name: activeCourseName,
        studentName: activeStudentName,
        section: selectedCourse?.section,
        isMock: selectedCourse?.isMock,
      },
      monthKey: selectedMonthKey,
      manual: summativeRecord,
      teacherName: displayTeacherName,
    })
  }, [
    courseWork,
    announcements,
    selectedCourse,
    activeCourseName,
    activeStudentName,
    selectedMonthKey,
    summativeRecord,
    displayTeacherName,
  ])

  const handlePrint = () => {
    window.print()
  }

  const handleSaveSummative = (e) => {
    e.preventDefault()
    if (!selectedCourse?.id) return
    const saved = saveSummativeRecord(selectedCourse.id, selectedMonthKey, {
      score: summativeForm.score,
      total: summativeForm.total,
      note: summativeForm.note,
      date:
        summativeForm.date ||
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
    setSummativeRecord(saved)
    setIsEditingSummative(false)
    setSaveSuccessNotice(true)
    setTimeout(() => setSaveSuccessNotice(false), 3000)
  }

  const handleOpenRemarksEditor = () => {
    const formatBullets = (val) => {
      if (!val) return ''
      if (Array.isArray(val)) return val.join('\n')
      return String(val)
    }

    setRemarksForm({
      academicEngagement:
        summativeRecord?.academicEngagement || monthlyReport.narrative.academicEngagement || '',
      focusAreas:
        summativeRecord?.focusAreas || monthlyReport.narrative.focusAreas || '',
      targetedSupport:
        (summativeRecord?.targetedSupport && summativeRecord.targetedSupport.length > 0
          ? formatBullets(summativeRecord.targetedSupport)
          : formatBullets(monthlyReport.narrative.targetedSupport)) || '',
      parentRecommendations:
        (summativeRecord?.parentRecommendations && summativeRecord.parentRecommendations.length > 0
          ? formatBullets(summativeRecord.parentRecommendations)
          : formatBullets(monthlyReport.narrative.parentRecommendations)) || '',
    })
    setIsEditingRemarks(true)
    setIsEditingSummative(false)
  }

  const handleSaveRemarks = (e) => {
    e.preventDefault()
    if (!selectedCourse?.id) return

    const parseBullets = (text) => {
      if (!text) return []
      if (Array.isArray(text)) return text.map((s) => String(s).trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
      return String(text)
        .split('\n')
        .map((line) => line.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean)
    }

    const saved = saveRemarksRecord(selectedCourse.id, selectedMonthKey, {
      academicEngagement: remarksForm.academicEngagement,
      focusAreas: remarksForm.focusAreas,
      targetedSupport: parseBullets(remarksForm.targetedSupport),
      parentRecommendations: parseBullets(remarksForm.parentRecommendations),
    })
    setSummativeRecord(saved)
    setIsEditingRemarks(false)
    setRemarksSuccessNotice('saved')
    setTimeout(() => setRemarksSuccessNotice(false), 3000)
  }

  const handleResetRemarks = () => {
    if (!selectedCourse?.id) return
    const saved = resetRemarksRecord(selectedCourse.id, selectedMonthKey)
    setSummativeRecord(saved)
    setRemarksForm({
      academicEngagement: '',
      focusAreas: '',
      targetedSupport: '',
      parentRecommendations: '',
    })
    setIsEditingRemarks(false)
    setRemarksSuccessNotice('reset')
    setTimeout(() => setRemarksSuccessNotice(false), 3000)
  }

  return (
    <div className="parent-dashboard">
      {/* 1. Prominent Classroom / Student Selection Bar */}
      <div className="parent-classroom-picker-bar">
        <div className="picker-bar-left">
          <div className="picker-icon-badge">
            <ion-icon name="school-outline"></ion-icon>
          </div>
          <div>
            <span className="picker-eyebrow">SELECTED CLASSROOM</span>
            <h4 className="h4 picker-course-title">
              {activeCourseName}
            </h4>
            {selectedCourse?.section && (
              <p className="picker-course-sub">{selectedCourse.section}</p>
            )}
          </div>
        </div>

        {allCourses && allCourses.length > 0 && onSelectCourse && (
          <div className="picker-bar-right">
            <label htmlFor="parent-classroom-dropdown" className="picker-select-label">
              Switch Classroom:
            </label>
            <select
              id="parent-classroom-dropdown"
              className="student-picker-select"
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const found = allCourses.find((c) => c.id === e.target.value)
                if (found) onSelectCourse(found)
              }}
            >
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.studentName ? `${c.studentName} — ${c.name}` : c.name}
                  {c.section ? ` (${c.section})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Executive Parent Header */}
      <div className="parent-header-card">
        <div className="parent-header-left">
          <div className="parent-icon-badge">
            <ion-icon name="people-outline"></ion-icon>
          </div>
          <div>
            <div className="parent-badge-row">
              <span className="parent-role-pill">PARENT & GUARDIAN VIEW</span>
              {isTeacherView && <span className="preview-indicator">Teacher View</span>}
              <span className="sub-badge" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {courseWork.length} Total Coursework Items
              </span>
            </div>
            <h3 className="h3 parent-student-title">
              {activeStudentName}'s Academic Dashboard
            </h3>
            <p className="parent-course-sub">
              {activeCourseName} • Instructor: {displayTeacherName}
            </p>
          </div>
        </div>

        <div className="parent-header-actions">
          <button
            type="button"
            className="print-report-btn"
            onClick={handlePrint}
            title="Print or save PDF of official report card"
          >
            <ion-icon name="print-outline"></ion-icon>
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* Live sync loading indicator */}
      {loadingCourseWork && (
        <div className="empty-state-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
          <span style={{ marginLeft: '10px' }}>Syncing live coursework and scores from Google Classroom...</span>
        </div>
      )}

      {/* Parent Sub-Navigation (All 5 Sections exactly as requested) */}
      <div className="parent-tabs-nav">
        <button
          className={`parent-tab-btn${activeParentTab === 'progress' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('progress')}
        >
          <ion-icon name="trending-up-outline"></ion-icon>
          <span>1. Child's Progress</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'pending' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('pending')}
        >
          <ion-icon name="alert-circle-outline"></ion-icon>
          <span>2. Pending Homework ({analytics.pendingHomework.length})</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'completed' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('completed')}
        >
          <ion-icon name="checkmark-done-circle-outline"></ion-icon>
          <span>3. Completed Homework ({analytics.completedHomework.length})</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'upcoming' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('upcoming')}
        >
          <ion-icon name="calendar-outline"></ion-icon>
          <span>4. Upcoming Assignments ({analytics.upcomingAssignments.length})</span>
        </button>

        <button
          className={`parent-tab-btn${activeParentTab === 'report' ? ' active' : ''}`}
          onClick={() => setActiveParentTab('report')}
        >
          <ion-icon name="newspaper-outline"></ion-icon>
          <span>5. Monthly Report Card</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CHILD'S PROGRESS                              */}
      {/* ======================================================== */}
      {activeParentTab === 'progress' && (
        <div className="parent-tab-content">
          {/* Real Metrics Grid */}
          <div className="parent-metrics-grid">
            <div className="metric-box highlight-green">
              <div className="metric-label">Overall Graded Performance</div>
              <div className="metric-value-row">
                <span className="metric-big-num">
                  {analytics.hasGrades ? `${analytics.averagePercentage}%` : 'Pending'}
                </span>
                <span className="grade-pill">{analytics.letterGrade}</span>
              </div>
              <p className="metric-caption">
                {analytics.hasGrades
                  ? `Points: ${analytics.earnedPoints} / ${analytics.totalPossiblePoints}`
                  : `${analytics.gradedCount} of ${analytics.totalAssignments} items graded`}
              </p>
            </div>

            <div className="metric-box highlight-blue">
              <div className="metric-label">Homework Completion Rate</div>
              <div className="metric-value-row">
                <span className="metric-big-num">{analytics.completionRate}%</span>
                <span className="sub-badge">
                  {analytics.completionRate === 100 ? 'All Turned In' : 'Active'}
                </span>
              </div>
              <p className="metric-caption">
                {analytics.completedCount} of {analytics.totalAssignments} tasks submitted
              </p>
            </div>

            <div className="metric-box highlight-gold">
              <div className="metric-label">Completed Problem Sets</div>
              <div className="metric-value-row">
                <span className="metric-big-num">{analytics.completedCount}</span>
                <span className="sub-badge">Submitted</span>
              </div>
              <p className="metric-caption">1-on-1 Mentorship Assignments</p>
            </div>

            <div className="metric-box highlight-purple">
              <div className="metric-label">Academic Standing</div>
              <div className="metric-value-row">
                <span className="metric-tier-text">{analytics.academicTier}</span>
              </div>
              <p className="metric-caption">1-on-1 Personalized Mentorship</p>
            </div>
          </div>

          {/* Educator's Real Executive Note */}
          <div className="educator-note-card">
            <div className="note-card-header">
              <div className="note-avatar-wrapper">
                <ion-icon name="school-outline"></ion-icon>
              </div>
              <div>
                <h4 className="h4 note-author-name">{analytics.tutorNote.educator}</h4>
                <span className="note-date-sub">{analytics.tutorNote.date} • Progress Assessment</span>
              </div>
            </div>
            <blockquote className="note-quote-body">
              "{analytics.tutorNote.text}"
            </blockquote>
          </div>

          {/* Quick Snapshot of Pending & Completed */}
          <div className="progress-overview-two-col">
            <div className="overview-subcard">
              <div className="subcard-header">
                <h4 className="h4">Next Due Date</h4>
                <button
                  type="button"
                  className="subcard-link"
                  onClick={() => setActiveParentTab('pending')}
                >
                  View All ({analytics.pendingHomework.length}) →
                </button>
              </div>
              {analytics.pendingHomework.length > 0 ? (
                <div
                  className="quick-due-preview-item"
                  onClick={() => onSelectAssignment && onSelectAssignment(analytics.pendingHomework[0])}
                >
                  <span className={`status-pill ${analytics.pendingHomework[0].urgency}`}>
                    {analytics.pendingHomework[0].countdownText}
                  </span>
                  <strong className="preview-title">{analytics.pendingHomework[0].title}</strong>
                  <span className="preview-sub">Click to review prompt and instructions</span>
                </div>
              ) : (
                <p className="all-caught-up-msg">✓ All assigned homework is turned in!</p>
              )}
            </div>

            <div className="overview-subcard">
              <div className="subcard-header">
                <h4 className="h4">Latest Graded Problem Set</h4>
                <button
                  type="button"
                  className="subcard-link"
                  onClick={() => setActiveParentTab('completed')}
                >
                  View History ({analytics.completedHomework.length}) →
                </button>
              </div>
              {analytics.completedHomework.length > 0 ? (
                <div
                  className="quick-due-preview-item"
                  onClick={() => onSelectAssignment && onSelectAssignment(analytics.completedHomework[0])}
                >
                  <span className="grade-badge">
                    Score: {analytics.completedHomework[0].submission?.assignedGrade != null ? `${analytics.completedHomework[0].submission.assignedGrade} / ${analytics.completedHomework[0].maxPoints || 100}` : 'Turned In'}
                  </span>
                  <strong className="preview-title">{analytics.completedHomework[0].title}</strong>
                  <span className="preview-sub">
                    {analytics.completedHomework[0].submission?.teacherFeedback || 'Submitted to Google Classroom'}
                  </span>
                </div>
              ) : (
                <p className="text-muted">No completed or graded problem sets yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: PENDING HOMEWORK                              */}
      {/* ======================================================== */}
      {activeParentTab === 'pending' && (
        <div className="parent-tab-content">
          <div className="tab-intro-card">
            <h4 className="h4">Active & Pending Homework ({analytics.pendingHomework.length})</h4>
            <p className="tab-intro-sub">
              Tasks assigned by the educator for {activeCourseName} awaiting student submission.
            </p>
          </div>

          <div className="parent-pending-list">
            {analytics.pendingHomework.length > 0 ? (
              analytics.pendingHomework.map((item) => {
                const dueStr = item.dueDate
                  ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                  : 'Flexible Deadline'
                return (
                  <div key={item.id} className="parent-pending-card">
                    <div className="pending-card-top">
                      <span className={`urgency-badge ${item.urgency}`}>
                        <ion-icon name="time-outline"></ion-icon>
                        <span>{item.countdownText}</span>
                      </span>
                      <span className="due-date-text">Due: {dueStr}</span>
                    </div>

                    <h4 className="h4 pending-item-title">{item.title}</h4>
                    <p className="pending-item-desc">
                      {item.description || 'No additional instructions provided for this assignment.'}
                    </p>

                    <div className="pending-card-footer">
                      <span className="points-label">Max Score: {item.maxPoints || 100} Pts</span>
                      <button
                        type="button"
                        className="parent-action-btn"
                        onClick={() => onSelectAssignment && onSelectAssignment(item)}
                      >
                        <span>Inspect Assignment</span>
                        <ion-icon name="arrow-forward-outline"></ion-icon>
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state-card">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <h4 className="h4">No Pending Homework</h4>
                <p>All coursework assigned for {activeCourseName} has been turned in!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: COMPLETED HOMEWORK                            */}
      {/* ======================================================== */}
      {activeParentTab === 'completed' && (
        <div className="parent-tab-content">
          <div className="tab-intro-card">
            <h4 className="h4">Completed & Graded Homework ({analytics.completedHomework.length})</h4>
            <p className="tab-intro-sub">
              Historical record of submitted problem sets, scored rubrics, and feedback in {activeCourseName}.
            </p>
          </div>

          <div className="completed-cards-list">
            {analytics.completedHomework.length > 0 ? (
              analytics.completedHomework.map((item) => {
                const sub = item.submission
                return (
                  <div key={item.id} className="completed-homework-card">
                    <div className="completed-header">
                      <div>
                        <h4 className="h4 completed-title">{item.title}</h4>
                        <span className="completed-date-sub">
                          Submitted: {sub?.turnInTime ? new Date(sub.turnInTime).toLocaleDateString() : 'Turned In'}
                        </span>
                      </div>
                      {sub?.assignedGrade != null ? (
                        <div className="completed-score-badge">
                          <span className="score-num">{sub.assignedGrade}</span>
                          <span className="score-max">/ {item.maxPoints || 100}</span>
                        </div>
                      ) : (
                        <span className="status-pill turned_in">Turned In</span>
                      )}
                    </div>

                    {sub?.teacherFeedback && (
                      <div className="completed-feedback-box">
                        <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                        <p>"{sub.teacherFeedback}"</p>
                      </div>
                    )}

                    <div className="completed-footer">
                      <button
                        type="button"
                        className="parent-action-btn"
                        onClick={() => onSelectAssignment && onSelectAssignment(item)}
                      >
                        <span>View Full Problem Set</span>
                        <ion-icon name="open-outline"></ion-icon>
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state-card">
                <ion-icon name="document-text-outline"></ion-icon>
                <h4 className="h4">No Completed Homework Yet</h4>
                <p>Submitted problem sets and scores for this classroom will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: UPCOMING ASSIGNMENTS                          */}
      {/* ======================================================== */}
      {activeParentTab === 'upcoming' && (
        <div className="parent-tab-content">
          <div className="tab-intro-card">
            <h4 className="h4">Upcoming Assignments ({analytics.upcomingAssignments.length})</h4>
            <p className="tab-intro-sub">
              Coursework deadlines scheduled in Google Classroom for {activeCourseName}.
            </p>
          </div>

          <div className="upcoming-timeline">
            {analytics.upcomingAssignments.length > 0 ? (
              analytics.upcomingAssignments.map((item) => {
                const dueStr = item.dueDate
                  ? `${item.dueDate.month}/${item.dueDate.day}/${item.dueDate.year}`
                  : 'Upcoming'
                return (
                  <div
                    key={item.id}
                    className="timeline-item clickable"
                    onClick={() => onSelectAssignment && onSelectAssignment(item)}
                  >
                    <div className="timeline-marker">
                      <ion-icon name="calendar-number-outline"></ion-icon>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-top">
                        <span className="timeline-date">Due: {dueStr}</span>
                        <span className={`timeline-type-pill ${item.urgency}`}>
                          {item.countdownText}
                        </span>
                      </div>
                      <h4 className="h4 timeline-title">{item.title}</h4>
                      <p className="timeline-notes">
                        {item.description || 'Assigned coursework and practice problem set.'}
                      </p>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--orange-yellow-crayola)' }}>
                        Max Score: {item.maxPoints || 100} Pts • Click to inspect prompt →
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state-card">
                <ion-icon name="calendar-outline"></ion-icon>
                <h4 className="h4">No Upcoming Deadlines Scheduled</h4>
                <p>All active assignments for {activeCourseName} have either been completed or have flexible deadlines.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: MONTHLY PROGRESS REPORT (LOCKED SPECIFICATION) */}
      {/* ======================================================== */}
      {activeParentTab === 'report' && (
        <div className="parent-tab-content mr-tab-content">
          {/* Controls Bar (Screen Only - Hidden in Print) */}
          <div className="mr-controls-bar">
            <div className="mr-controls-left">
              <label htmlFor="mr-month-selector" className="mr-select-label">
                <ion-icon name="calendar-outline"></ion-icon>
                <span>Academic Cycle:</span>
              </label>
              <select
                id="mr-month-selector"
                className="mr-month-select"
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
              >
                {recentMonthKeys.map((mk) => (
                  <option key={mk} value={mk}>
                    {getMonthLabel(mk)}
                  </option>
                ))}
              </select>
              <span className="mr-sync-pill">
                <ion-icon name="checkmark-circle"></ion-icon>
                <span>Google Classroom Integrated</span>
              </span>
            </div>

            <div className="mr-controls-right">
              {isTeacherView && (
                <>
                  <button
                    type="button"
                    className={`mr-teacher-btn${isEditingSummative ? ' active' : ''}`}
                    onClick={() => {
                      setIsEditingSummative((prev) => !prev)
                      if (isEditingRemarks) setIsEditingRemarks(false)
                    }}
                    title="Teacher only: Edit Summative Exam score and observations"
                  >
                    <ion-icon name={isEditingSummative ? 'close-outline' : 'create-outline'}></ion-icon>
                    <span>{isEditingSummative ? 'Close Editor' : 'Edit Summative Score'}</span>
                  </button>

                  <button
                    type="button"
                    className={`mr-teacher-btn${isEditingRemarks ? ' active' : ''}`}
                    onClick={() => {
                      if (isEditingRemarks) {
                        setIsEditingRemarks(false)
                      } else {
                        handleOpenRemarksEditor()
                      }
                    }}
                    title="Teacher only: Edit Instructor Remarks & Observations"
                  >
                    <ion-icon name={isEditingRemarks ? 'close-outline' : 'chatbox-ellipses-outline'}></ion-icon>
                    <span>{isEditingRemarks ? 'Close Remarks' : 'Edit Remarks'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                className="mr-download-btn"
                onClick={handlePrint}
                title="Download report as PDF via browser print"
              >
                <ion-icon name="download-outline"></ion-icon>
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {saveSuccessNotice && (
            <div className="mr-alert-notice success">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>Summative exam evaluation saved successfully to this monthly report card.</span>
            </div>
          )}

          {remarksSuccessNotice && (
            <div className="mr-alert-notice success">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>
                {remarksSuccessNotice === 'reset'
                  ? 'Instructor remarks reverted to auto-generated narrative successfully.'
                  : 'Instructor Remarks & Observations saved successfully to this monthly report card.'}
              </span>
            </div>
          )}

          {/* Teacher Summative Editor (Screen Only, Teacher View Only) */}
          {isTeacherView && isEditingSummative && (
            <form className="mr-summative-editor-card" onSubmit={handleSaveSummative}>
              <div className="mr-editor-header">
                <div className="mr-editor-title-row">
                  <ion-icon name="school-outline"></ion-icon>
                  <h4 className="h4 mr-editor-title">Instructor Summative Exam Entry ({monthlyReport.academicCycle})</h4>
                </div>
                <span className="mr-editor-badge">Teacher-Only Tool</span>
              </div>
              <p className="mr-editor-sub">
                Manual summative score and note are visible and editable exclusively when in teacher view. Saved values update the official monthly report card instantly.
              </p>

              <div className="mr-editor-fields-grid">
                <div className="mr-form-group">
                  <label htmlFor="mr-score-input">Summative Score:</label>
                  <input
                    id="mr-score-input"
                    type="number"
                    min="0"
                    max={summativeForm.total || 100}
                    placeholder="e.g. 88"
                    value={summativeForm.score}
                    onChange={(e) => setSummativeForm({ ...summativeForm, score: e.target.value })}
                    required
                  />
                </div>

                <div className="mr-form-group">
                  <label htmlFor="mr-total-input">Total Points (Default 100):</label>
                  <input
                    id="mr-total-input"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={summativeForm.total}
                    onChange={(e) => setSummativeForm({ ...summativeForm, total: e.target.value })}
                    required
                  />
                </div>

                <div className="mr-form-group">
                  <label htmlFor="mr-date-input">Exam Administered Date:</label>
                  <input
                    id="mr-date-input"
                    type="text"
                    placeholder="e.g. Oct 27"
                    value={summativeForm.date}
                    onChange={(e) => setSummativeForm({ ...summativeForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="mr-form-group full-width">
                <label htmlFor="mr-notes-input">Instructor Qualitative Observation & Exam Feedback:</label>
                <textarea
                  id="mr-notes-input"
                  rows="3"
                  placeholder="e.g. Administered Oct 27. Excellent performance on factoring quadratics; minor calculation slips on rational denominators."
                  value={summativeForm.note}
                  onChange={(e) => setSummativeForm({ ...summativeForm, note: e.target.value })}
                ></textarea>
              </div>

              <div className="mr-editor-actions">
                <button type="submit" className="mr-save-btn">
                  <ion-icon name="save-outline"></ion-icon>
                  <span>Save to Report</span>
                </button>
                <button
                  type="button"
                  className="mr-cancel-btn"
                  onClick={() => setIsEditingSummative(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* ========================================================== */}
          {/* THE OFFICIAL REPORT CARD DOCUMENT (Matches PDF 1:1)       */}
          {/* ========================================================== */}
          <div className="monthly-report-card">
            {/* 1. Header */}
            <div className="mr-doc-header">
              <div className="mr-doc-header-left">
                <h2 className="mr-doc-title">Monthly Tutoring Progress Report</h2>
                <p className="mr-doc-subtitle">Google Classroom Integrated Tutee Evaluation</p>
              </div>
              <div className="mr-doc-header-right">
                <span className="mr-cycle-tag">ACADEMIC CYCLE</span>
                <span className="mr-cycle-val">{monthlyReport.academicCycle}</span>
              </div>
            </div>

            <div className="mr-header-divider"></div>

            {/* 2. Meta Grid (Student Name, Subject & Course, Google Classroom ID - Grade/Level removed) */}
            <div className="mr-meta-box">
              <div className="mr-meta-item">
                <span className="mr-meta-label">STUDENT NAME</span>
                <span className="mr-meta-value">{monthlyReport.meta.studentName}</span>
              </div>
              <div className="mr-meta-item">
                <span className="mr-meta-label">SUBJECT & COURSE</span>
                <span className="mr-meta-value">{monthlyReport.meta.subjectCourse}</span>
              </div>
              <div className="mr-meta-item">
                <span className="mr-meta-label">GOOGLE CLASSROOM ID</span>
                <span className="mr-meta-value">{monthlyReport.meta.classroomCode}</span>
              </div>
            </div>

            {/* 3. KPI Grid (4 Cards: Sessions Attended, Homework Average, Summative Score, Punctuality Rate) */}
            <div className="mr-kpi-grid">
              <div className="mr-kpi-card" title="Completed Sessions / Total Sessions">
                <div className="mr-kpi-number">{monthlyReport.kpis.sessionsAttended}</div>
                <div className="mr-kpi-caption">Sessions Attended</div>
                <div className="mr-kpi-sub-label">Completed / Total</div>
              </div>

              <div className="mr-kpi-card">
                <div className="mr-kpi-number">{monthlyReport.kpis.homeworkAverage}</div>
                <div className="mr-kpi-caption">Homework Average</div>
              </div>

              <div className="mr-kpi-card">
                <div className="mr-kpi-number">{monthlyReport.kpis.summativeScore}</div>
                <div className="mr-kpi-caption">Summative Score</div>
              </div>

              <div className="mr-kpi-card">
                <div className="mr-kpi-number">{monthlyReport.kpis.punctualityRate}</div>
                <div className="mr-kpi-caption">Punctuality Rate</div>
              </div>
            </div>

            {/* 4. Curriculum & Topics Covered Table */}
            <div className="mr-section">
              <h3 className="mr-section-heading">
                Curriculum & Topics Covered ({monthlyReport.curriculum.sessionsCount} Sessions)
              </h3>
              <div className="mr-table-wrapper">
                <table className="mr-table">
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>DATE / WEEK</th>
                      <th style={{ width: '42%' }}>CORE TOPICS COVERED</th>
                      <th style={{ width: '26%' }}>CLASSROOM ASSIGNMENT REF</th>
                      <th style={{ width: '14%' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.curriculum.rows.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td className="mr-cell-date" data-label="Date / Week">{row.dateWeek}</td>
                        <td className="mr-cell-topics" data-label="Core Topics Covered">{row.topics}</td>
                        <td className="mr-cell-ref" data-label="Classroom Assignment Ref">{row.assignmentRef}</td>
                        <td className="mr-cell-status" data-label="Status">
                          <span
                            className={`mr-status-pill ${row.status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Assessment & Task Performance */}
            <div className="mr-section">
              <h3 className="mr-section-heading">Assessment & Task Performance</h3>
              <div className="mr-assessment-grid">
                <div className="mr-assessment-card">
                  <div className="mr-assessment-card-header">
                    <span className="mr-assessment-title">Formative & Homework Average</span>
                    <span className="mr-assessment-score">
                      {monthlyReport.assessment.formative.scoreFormatted}
                    </span>
                  </div>
                  <p className="mr-assessment-note">
                    {monthlyReport.assessment.formative.note}
                  </p>
                </div>

                <div className="mr-assessment-card">
                  <div className="mr-assessment-card-header">
                    <span className="mr-assessment-title">Monthly Summative Exam</span>
                    <span className="mr-assessment-score">
                      {monthlyReport.assessment.summative.scoreFormatted}
                    </span>
                  </div>
                  <p className="mr-assessment-note">
                    {monthlyReport.assessment.summative.note}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Instructor Remarks & Observations */}
            <div className="mr-section" id="mr-instructor-remarks-section">
              <div className="mr-section-heading-row">
                <h3 className="mr-section-heading">Instructor Remarks & Observations</h3>
                {isTeacherView && (
                  <div className="mr-section-teacher-actions">
                    {monthlyReport.narrative.isCustomRemarks && (
                      <span className="mr-badge-custom-indicator">Customized by Teacher</span>
                    )}
                    <button
                      type="button"
                      className="mr-section-edit-btn"
                      onClick={() => {
                        if (isEditingRemarks) {
                          setIsEditingRemarks(false)
                        } else {
                          handleOpenRemarksEditor()
                        }
                      }}
                      title="Teacher only: Edit Academic Engagement, Focus Areas & Recommendations"
                    >
                      <ion-icon name={isEditingRemarks ? 'close-outline' : 'create-outline'}></ion-icon>
                      <span>{isEditingRemarks ? 'Cancel' : 'Edit Remarks'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isTeacherView && isEditingRemarks ? (
                <form className="mr-remarks-editor-card" onSubmit={handleSaveRemarks}>
                  <div className="mr-editor-header">
                    <div className="mr-editor-title-row">
                      <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                      <h4 className="h4 mr-editor-title">Edit Remarks & Recommendations ({monthlyReport.academicCycle})</h4>
                    </div>
                    <span className="mr-editor-badge">Teacher-Only Tool</span>
                  </div>
                  <p className="mr-editor-sub">
                    Manual academic engagement, focus areas, targeted support, and parent recommendations update the official monthly report card instantly and are saved for this student and academic cycle.
                  </p>

                  <div className="mr-form-group full-width">
                    <label htmlFor="mr-engagement-input">Academic Engagement & Class Participation:</label>
                    <textarea
                      id="mr-engagement-input"
                      rows="3"
                      placeholder="e.g. Student has displayed high enthusiasm..."
                      value={remarksForm.academicEngagement}
                      onChange={(e) => setRemarksForm({ ...remarksForm, academicEngagement: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="mr-form-group full-width">
                    <label htmlFor="mr-focus-input">Focus Areas & Recommendations:</label>
                    <textarea
                      id="mr-focus-input"
                      rows="3"
                      placeholder="e.g. Continued focus is recommended on verifying extraneous roots..."
                      value={remarksForm.focusAreas}
                      onChange={(e) => setRemarksForm({ ...remarksForm, focusAreas: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="mr-editor-recs-grid">
                    <div className="mr-form-group">
                      <label htmlFor="mr-targeted-support-input">
                        Targeted Support for Next Month:
                        <span className="mr-field-hint">One bullet point per line</span>
                      </label>
                      <textarea
                        id="mr-targeted-support-input"
                        rows="3"
                        placeholder="e.g. Reinforce asymptotes and rational expressions&#10;Timed practice sets for multi-step equation solving"
                        value={remarksForm.targetedSupport}
                        onChange={(e) => setRemarksForm({ ...remarksForm, targetedSupport: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="mr-form-group">
                      <label htmlFor="mr-parent-recs-input">
                        Parent Recommendations:
                        <span className="mr-field-hint">One bullet point per line</span>
                      </label>
                      <textarea
                        id="mr-parent-recs-input"
                        rows="3"
                        placeholder="e.g. Review Google Classroom assignment feedback tags&#10;Ensure weekly 15-minute formula sheet review at home"
                        value={remarksForm.parentRecommendations}
                        onChange={(e) => setRemarksForm({ ...remarksForm, parentRecommendations: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <div className="mr-editor-actions">
                    <button type="submit" className="mr-save-btn">
                      <ion-icon name="save-outline"></ion-icon>
                      <span>Save Remarks</span>
                    </button>
                    {monthlyReport.narrative.isCustomRemarks && (
                      <button
                        type="button"
                        className="mr-reset-btn"
                        onClick={handleResetRemarks}
                        title="Revert back to algorithm-generated narrative"
                      >
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Reset to Auto-Generated</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="mr-cancel-btn"
                      onClick={() => setIsEditingRemarks(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mr-remarks-card">
                  <p className="mr-remark-line">
                    <strong className="mr-remark-bold">Academic Engagement: </strong>
                    <span>{monthlyReport.narrative.academicEngagement}</span>
                  </p>
                  <p className="mr-remark-line">
                    <strong className="mr-remark-bold">Focus Areas: </strong>
                    <span>{monthlyReport.narrative.focusAreas}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 7 & 8. Targeted Support for Next Month & Parent Recommendations */}
            {!isEditingRemarks && (
              <div className="mr-recs-grid">
                <div className="mr-recs-card">
                  <div className="mr-recs-card-header">
                    <h4 className="mr-recs-heading">Targeted Support for Next Month</h4>
                    {isTeacherView && (
                      <button
                        type="button"
                        className="mr-recs-edit-btn"
                        onClick={handleOpenRemarksEditor}
                        title="Teacher only: Edit Targeted Support and Parent Recommendations"
                      >
                        <ion-icon name="create-outline"></ion-icon>
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  <ul className="mr-recs-list">
                    {monthlyReport.narrative.targetedSupport.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mr-recs-card">
                  <div className="mr-recs-card-header">
                    <h4 className="mr-recs-heading">Parent Recommendations</h4>
                    {isTeacherView && (
                      <button
                        type="button"
                        className="mr-recs-edit-btn"
                        onClick={handleOpenRemarksEditor}
                        title="Teacher only: Edit Targeted Support and Parent Recommendations"
                      >
                        <ion-icon name="create-outline"></ion-icon>
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  <ul className="mr-recs-list">
                    {monthlyReport.narrative.parentRecommendations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 9. Footer */}
            <div className="mr-footer">
              <div className="mr-footer-left">
                Tutor: {monthlyReport.footer.tutorName} • Contact: {monthlyReport.footer?.contactEmail || 'jivanauttestprep@gmail.com'}
              </div>
              <div className="mr-footer-right">
                {monthlyReport.footer.systemTag}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDashboard
